import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { getDb, getStorageDir } from '../database/db';

export interface ImportResult {
  success: boolean;
  message?: string;
  savedFileName?: string;
  totalRows?: number;
  totalPunches?: number;
  totalDays?: number;
  uniqueEmployees?: number;
  dateRange?: { from: string; to: string };
}

function parseDateCell(val: any): string | null {
  if (typeof val === 'number') {
    const d = XLSX.SSF.parse_date_code(val);
    if (!d) return null;
    return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
  }
  if (typeof val === 'string') {
    const s = val.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
      const parts = s.split('/');
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return s;
  }
  return null;
}

function parseTimeCell(val: any): string | null {
  if (typeof val === 'number') {
    const t = XLSX.SSF.parse_date_code(val);
    if (!t) return null;
    return `${String(t.H).padStart(2, '0')}:${String(t.M).padStart(2, '0')}:${String(t.S).padStart(2, '0')}`;
  }
  if (typeof val === 'string') {
    const s = val.trim();
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) {
      const p = s.split(':');
      return `${p[0].padStart(2, '0')}:${p[1].padStart(2, '0')}:${(p[2] || '00').padStart(2, '0')}`;
    }
    return s;
  }
  return null;
}

function timeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':').map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0) + (parts[2] || 0) / 60;
}

/**
 * Tính toán giờ làm chính, tăng ca, và tình trạng đi trễ theo quy định công ty
 */
export function calculateAttendanceHours(times: string[]) {
  const sortedTimes = [...times].sort();
  const checkIn = sortedTimes[0];
  let checkOut = sortedTimes[sortedTimes.length - 1];

  // Quy định: Nếu chỉ có 1 lần chấm công (quên check ra) và checkIn <= 17:00 -> tính giờ ra là 17:00
  if (sortedTimes.length === 1) {
    const inMin = timeToMinutes(checkIn);
    if (inMin <= 17 * 60) {
      checkOut = '17:00:00';
    }
  }

  const inMin = timeToMinutes(checkIn);
  const outMin = timeToMinutes(checkOut);

  // Quy định: Cho phép vào trễ 15 phút (<= 7:15 không tính đi trễ). Từ 7:16 trở đi là đi trễ.
  const isLate = inMin > 7 * 60 + 15 ? 1 : 0;

  // Giờ làm chính trong khung 07:00 - 17:00 (tối đa 10 tiếng)
  const regStart = Math.max(inMin, 7 * 60);
  const regEnd = Math.min(outMin, 17 * 60);
  let regHours = 0;
  if (regEnd > regStart) {
    const regMin = regEnd - regStart;
    // Quy định: Trong phạm vi giờ làm chính nếu đủ 9 giờ 45 phút (585 phút) thì làm tròn 10 giờ
    if (inMin <= 7 * 60 + 15 && regMin >= 9 * 60 + 45) {
      regHours = 10;
    } else {
      // Tính theo giờ, bỏ phút lẻ, không làm tròn
      regHours = Math.floor(regMin / 60);
    }
  }

  // Giờ tăng ca (OT) ngoài khung 07:00 - 17:00 (trước 7h và sau 17h, bỏ phút lẻ)
  let otMorningMin = 0;
  if (inMin < 7 * 60) {
    otMorningMin = Math.max(0, Math.min(outMin, 7 * 60) - inMin);
  }
  let otEveningMin = 0;
  if (outMin > 17 * 60) {
    otEveningMin = Math.max(0, outMin - Math.max(inMin, 17 * 60));
  }
  const otHours = Math.floor((otMorningMin + otEveningMin) / 60);

  return {
    checkIn,
    checkOut,
    regHours,
    otHours,
    isLate,
  };
}

/**
 * Nhập file Excel từ máy chấm công
 */
export async function importExcelTimesheet(
  buffer: Buffer,
  originalName: string
): Promise<ImportResult> {
  const db = getDb();

  // 1. Lưu file trước khi import với định dạng Ymd_His
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const ext = path.extname(originalName) || '.xlsx';
  const savedFileName = `${timestamp}${ext}`;

  const storageDir = getStorageDir();
  const filePath = path.join(storageDir, savedFileName);
  fs.writeFileSync(filePath, buffer);

  // 2. Đọc nội dung file Excel
  const wb = XLSX.read(buffer, { type: 'buffer' });
  if (!wb.SheetNames || wb.SheetNames.length === 0) {
    throw new Error('File Excel không có Sheet dữ liệu nào!');
  }

  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  if (!rawRows || rawRows.length < 2) {
    throw new Error('File Excel không có dữ liệu để nhập!');
  }

  // Xác định vị trí cột Mã, Ngày, Giờ
  let codeCol = 1;
  let dateCol = 2;
  let timeCol = 3;

  const headerRow = rawRows[0] || [];
  for (let c = 0; c < headerRow.length; c++) {
    const val = String(headerRow[c] || '').toLowerCase().trim();
    if (val === 'mã' || val === 'ma' || val === 'code' || val === 'mã nv') codeCol = c;
    if (val === 'ngày' || val === 'ngay' || val === 'date') dateCol = c;
    if (val === 'giờ' || val === 'gio' || val === 'time') timeCol = c;
  }

  // Nhóm lần chấm công theo (Mã nhân viên, Ngày)
  const punchesByEmpDate: Record<string, string[]> = {};
  const allDates: string[] = [];
  const allCodes = new Set<string>();
  let totalPunches = 0;

  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row[codeCol] === undefined || row[codeCol] === null || row[codeCol] === '') {
      continue;
    }

    const code = String(row[codeCol]).trim();
    const dateStr = parseDateCell(row[dateCol]);
    const timeStr = parseTimeCell(row[timeCol]);

    if (!dateStr || !timeStr) continue;

    allCodes.add(code);
    allDates.push(dateStr);
    totalPunches++;

    const key = `${code}||${dateStr}`;
    if (!punchesByEmpDate[key]) {
      punchesByEmpDate[key] = [];
    }
    punchesByEmpDate[key].push(timeStr);
  }

  allDates.sort();
  const minDate = allDates[0] || '2026-01-01';
  const maxDate = allDates[allDates.length - 1] || '2026-01-01';

  // 3. Thực thi lưu vào SQLite qua Transaction
  const insertFileStmt = db.prepare(`
    INSERT INTO import_files (file_name, original_name, file_path, total_rows, imported_at)
    VALUES (?, ?, ?, ?, datetime('now', 'localtime'))
  `);

  const insertEmpStmt = db.prepare(`
    INSERT OR IGNORE INTO employees (code, name, employee_type, hourly_salary, ot_hourly_salary, start_date, status)
    VALUES (?, ?, 'official', 20000, 40000, ?, 'active')
  `);

  const upsertAttendanceStmt = db.prepare(`
    INSERT INTO attendances (
      employee_code, attendance_date, check_in, check_out,
      regular_hours, ot_hours, is_late, late_permitted, is_leave, leave_permitted, note
    ) VALUES (
      ?, ?, ?, ?,
      ?, ?, ?, 0, 0, 0, ?
    )
    ON CONFLICT(employee_code, attendance_date) DO UPDATE SET
      check_in = excluded.check_in,
      check_out = excluded.check_out,
      regular_hours = excluded.regular_hours,
      ot_hours = excluded.ot_hours,
      is_late = excluded.is_late
  `);

  const runImport = db.transaction(() => {
    // Lưu lịch sử file
    insertFileStmt.run(savedFileName, originalName, filePath, rawRows.length - 1);

    // Tự động thêm nhân viên mới nếu chưa có
    for (const code of allCodes) {
      insertEmpStmt.run(code, `Nhân viên ${code}`, minDate);
    }

    // Lưu bảng công từng ngày
    for (const [key, times] of Object.entries(punchesByEmpDate)) {
      const [empCode, attDate] = key.split('||');
      const calc = calculateAttendanceHours(times);

      let note = '';
      if (calc.isLate === 1) {
        note = 'Vào trễ sau 7:15';
      } else if (calc.regHours === 10 && times[0] > '07:00:00') {
        note = 'Vào trong 15p cho phép (làm tròn 10h)';
      }

      upsertAttendanceStmt.run(
        empCode,
        attDate,
        calc.checkIn,
        calc.checkOut,
        calc.regHours,
        calc.otHours,
        calc.isLate,
        note
      );
    }
  });

  runImport();

  return {
    success: true,
    savedFileName,
    totalRows: rawRows.length - 1,
    totalPunches,
    totalDays: Object.keys(punchesByEmpDate).length,
    uniqueEmployees: allCodes.size,
    dateRange: { from: minDate, to: maxDate },
  };
}

/**
 * Lịch sử các file Excel đã import
 */
export function getImportHistory() {
  const db = getDb();
  return db
    .prepare('SELECT * FROM import_files ORDER BY imported_at DESC')
    .all();
}

/**
 * Lấy danh sách nhân viên
 */
export function getEmployees() {
  const db = getDb();
  return db
    .prepare('SELECT * FROM employees ORDER BY CAST(code AS INTEGER) ASC, code ASC')
    .all();
}

/**
 * Thêm hoặc cập nhật nhân viên
 */
export function saveEmployee(emp: any) {
  const db = getDb();
  if (emp.id) {
    db.prepare(`
      UPDATE employees SET
        code = ?, name = ?, employee_type = ?, hourly_salary = ?,
        ot_hourly_salary = ?, start_date = ?, status = ?
      WHERE id = ?
    `).run(
      emp.code,
      emp.name,
      emp.employee_type,
      emp.hourly_salary,
      emp.ot_hourly_salary,
      emp.start_date,
      emp.status,
      emp.id
    );
  } else {
    db.prepare(`
      INSERT INTO employees (code, name, employee_type, hourly_salary, ot_hourly_salary, start_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      emp.code,
      emp.name,
      emp.employee_type || 'official',
      emp.hourly_salary || 20000,
      emp.ot_hourly_salary || 40000,
      emp.start_date || new Date().toISOString().slice(0, 10),
      emp.status || 'active'
    );
  }
  return { success: true };
}

/**
 * Xóa nhân viên
 */
export function deleteEmployee(id: number) {
  const db = getDb();
  db.prepare('DELETE FROM employees WHERE id = ?').run(id);
  return { success: true };
}

/**
 * Lấy dữ liệu chấm công theo ngày
 */
export function getAttendances(date?: string) {
  const db = getDb();
  const queryDate = date || new Date().toISOString().slice(0, 10);
  return db
    .prepare(`
      SELECT a.*, e.name as employee_name, e.employee_type
      FROM attendances a
      LEFT JOIN employees e ON a.employee_code = e.code
      WHERE a.attendance_date = ?
      ORDER BY CAST(a.employee_code AS INTEGER) ASC, a.employee_code ASC
    `)
    .all(queryDate);
}

/**
 * Cập nhật duyệt phép / trễ giờ
 */
export function updateAttendanceStatus(params: {
  id: number;
  late_permitted?: number;
  leave_permitted?: number;
  note?: string;
}) {
  const db = getDb();
  const { id, late_permitted, leave_permitted, note } = params;
  db.prepare(`
    UPDATE attendances SET
      late_permitted = COALESCE(?, late_permitted),
      leave_permitted = COALESCE(?, leave_permitted),
      note = COALESCE(?, note)
    WHERE id = ?
  `).run(late_permitted ?? null, leave_permitted ?? null, note ?? null, id);
  return { success: true };
}

/**
 * Danh sách yêu cầu cần duyệt phép & trễ
 */
export function getLeaveRequests() {
  const db = getDb();
  return db
    .prepare(`
      SELECT a.*, e.name as employee_name, e.employee_type
      FROM attendances a
      LEFT JOIN employees e ON a.employee_code = e.code
      WHERE a.is_late = 1 OR a.is_leave = 1
      ORDER BY a.attendance_date DESC, CAST(a.employee_code AS INTEGER) ASC
    `)
    .all();
}

/**
 * Tính thưởng chuyên cần theo tháng (YYYY-MM)
 */
export function getAttendanceBonuses(month: string) {
  const db = getDb();
  const employees: any[] = db
    .prepare('SELECT * FROM employees ORDER BY CAST(code AS INTEGER) ASC, code ASC')
    .all();

  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr, 10);
  const m = parseInt(monthStr, 10);
  const daysInMonth = new Date(year, m, 0).getDate();

  const result: any[] = [];

  for (const emp of employees) {
    const attendances: any[] = db
      .prepare(`
        SELECT * FROM attendances
        WHERE employee_code = ? AND strftime('%Y-%m', attendance_date) = ?
      `)
      .all(emp.code, month);

    const attendedDays = attendances.filter((a) => (a.regular_hours > 0 || a.check_in) && a.is_leave !== 1).length;
    const leaveDays = attendances.filter((a) => a.is_leave === 1).length;

    // Quy định: Điều kiện không nghỉ ngày nào kể cả có phép hoặc không phép.
    // Đi trễ vẫn tính là có đi làm. Phải làm đủ các ngày trong tháng (đặc thù không nghỉ chủ nhật/lễ).
    const isEligible = attendedDays >= daysInMonth && leaveDays === 0;

    let consecutiveMonths = 0;
    let bonusAmount = 0;
    let reason = '';

    if (isEligible) {
      // Tìm tháng trước đó xem có đạt không
      const prevDate = new Date(year, m - 2, 1);
      const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
      const prevBonus: any = db
        .prepare('SELECT consecutive_months FROM attendance_bonuses WHERE employee_code = ? AND month_year = ?')
        .get(emp.code, prevMonth);

      consecutiveMonths = prevBonus ? prevBonus.consecutive_months + 1 : 1;
      bonusAmount = 500000 + (consecutiveMonths - 1) * 100000;
      reason = consecutiveMonths === 1
        ? 'Đạt tháng đầu tiên (500.000đ)'
        : `Đạt tháng thứ ${consecutiveMonths} liên tục (+${(consecutiveMonths - 1) * 100}k)`;

      // Lưu lại kết quả chuyên cần
      db.prepare(`
        INSERT INTO attendance_bonuses (employee_code, month_year, consecutive_months, bonus_amount)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(employee_code, month_year) DO UPDATE SET
          consecutive_months = excluded.consecutive_months,
          bonus_amount = excluded.bonus_amount
      `).run(emp.code, month, consecutiveMonths, bonusAmount);
    } else {
      consecutiveMonths = 0;
      bonusAmount = 0;
      reason = leaveDays > 0
        ? `Nghỉ ${leaveDays} ngày trong tháng (Reset về 500k cho tháng sau)`
        : attendedDays === 0
        ? 'Chưa có dữ liệu chấm công'
        : `Chỉ làm ${attendedDays}/${daysInMonth} ngày trong tháng (Không đủ ngày)`;

      db.prepare(`
        INSERT INTO attendance_bonuses (employee_code, month_year, consecutive_months, bonus_amount)
        VALUES (?, ?, 0, 0)
        ON CONFLICT(employee_code, month_year) DO UPDATE SET
          consecutive_months = 0,
          bonus_amount = 0
      `).run(emp.code, month);
    }

    result.push({
      employee_code: emp.code,
      employee_name: emp.name,
      total_month_days: daysInMonth,
      attended_days: attendedDays,
      leave_days: leaveDays,
      consecutive_months: consecutiveMonths,
      bonus_amount: bonusAmount,
      status: isEligible ? 'eligible' : 'not_eligible',
      reason,
    });
  }

  return result;
}

/**
 * Tổng hợp lương theo tháng (YYYY-MM)
 */
export function getMonthlySalaries(month: string) {
  const db = getDb();
  const employees: any[] = db
    .prepare('SELECT * FROM employees ORDER BY CAST(code AS INTEGER) ASC, code ASC')
    .all();

  // Đảm bảo tính toán chuyên cần trước
  const bonuses = getAttendanceBonuses(month);
  const bonusMap = new Map(bonuses.map((b) => [b.employee_code, b.bonus_amount]));

  const result: any[] = [];

  for (const emp of employees) {
    const attendances: any[] = db
      .prepare(`
        SELECT * FROM attendances
        WHERE employee_code = ? AND strftime('%Y-%m', attendance_date) = ?
      `)
      .all(emp.code, month);

    let totalWorkDays = 0;
    let totalRegularHours = 0;
    let totalOtHours = 0;
    let latePenalty = 0;

    for (const att of attendances) {
      if ((att.regular_hours > 0 || att.check_in) && att.is_leave !== 1) {
        totalWorkDays++;
      }
      totalRegularHours += att.regular_hours || 0;
      totalOtHours += att.ot_hours || 0;

      // Quy định: Đi trễ không phép bị trừ 1/2 ngày lương chính
      // 1 ngày = 10 giờ * hourly_salary. Trừ 1/2 ngày = 5 giờ * hourly_salary.
      if (att.is_late === 1 && att.late_permitted !== 1) {
        const halfDayRate = (emp.hourly_salary * 10) / 2;
        latePenalty += halfDayRate;
      }
    }

    const regularSalary = totalRegularHours * (emp.hourly_salary || 20000);
    const otSalary = totalOtHours * (emp.ot_hourly_salary || 40000);
    const attendanceBonus = bonusMap.get(emp.code) || 0;
    const netSalary = Math.round(regularSalary + otSalary + attendanceBonus - latePenalty);

    result.push({
      id: emp.id,
      employee_code: emp.code,
      employee_name: `${emp.name} (${emp.employee_type === 'probation' ? 'Học việc' : 'Chính thức'})`,
      month_year: month,
      total_work_days: totalWorkDays,
      total_regular_hours: totalRegularHours,
      total_ot_hours: totalOtHours,
      regular_salary: regularSalary,
      ot_salary: otSalary,
      late_penalty: latePenalty,
      attendance_bonus: attendanceBonus,
      net_salary: netSalary,
    });
  }

  return result;
}

/**
 * Thống kê Dashboard
 */
export function getDashboardStats(dateStr?: string, monthStr?: string) {
  const db = getDb();
  const queryDate = dateStr || new Date().toISOString().slice(0, 10);
  const queryMonth = monthStr || queryDate.slice(0, 7);

  const empStats: any = db
    .prepare('SELECT COUNT(*) as total, SUM(CASE WHEN status = "active" THEN 1 ELSE 0 END) as active FROM employees')
    .get();

  const todayStats: any = db
    .prepare(`
      SELECT
        COUNT(CASE WHEN regular_hours > 0 OR check_in IS NOT NULL THEN 1 END) as attended,
        COUNT(CASE WHEN is_late = 1 THEN 1 END) as late
      FROM attendances
      WHERE attendance_date = ?
    `)
    .get(queryDate);

  const bonuses = getAttendanceBonuses(queryMonth);
  const eligibleBonuses = bonuses.filter((b) => b.status === 'eligible').length;

  return {
    totalEmployees: empStats?.total || 0,
    activeEmployees: empStats?.active || 0,
    todayAttended: todayStats?.attended || 0,
    todayLate: todayStats?.late || 0,
    monthlyBonusEligible: eligibleBonuses,
  };
}

