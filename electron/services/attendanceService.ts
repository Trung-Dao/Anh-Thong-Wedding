import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { getDb, getStorageDir } from '../database/db';

const xlsxLib: any = (XLSX as any).default || XLSX;

export interface ImportResult {
  success: boolean;
  message?: string;
  savedFileName?: string;
  totalRows?: number;
  totalRawRows?: number;
  newRawRows?: number;
  duplicateRawRows?: number;
  totalPunches?: number;
  totalDays?: number;
  uniqueEmployees?: number;
  dateRange?: { from: string; to: string };
}

/**
 * Chuyển đổi ô Ngày trong Excel sang YYYY-MM-DD
 * Hỗ trợ định dạng số serial Excel (ví dụ 46296), chuỗi ngày YYYY-MM-DD, DD/MM/YYYY hoặc Date object
 */
function parseDateCell(val: any): string | null {
  if (val === null || val === undefined || val === '') return null;

  // 1. Nếu là số serial Excel (e.g. 46296)
  if (typeof val === 'number') {
    // 25569 là số ngày từ 1900-01-01 đến mốc Unix Epoch 1970-01-01
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, '0');
      const d = String(date.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  // 2. Nếu là Date object
  // if (val instanceof Date && !isNaN(val.getTime())) {
  //   const y = val.getFullYear();
  //   const m = String(val.getMonth() + 1).padStart(2, '0');
  //   const d = String(val.getDate()).padStart(2, '0');
  //   return `${y}-${m}-${d}`;
  // }

  // 3. Nếu là chuỗi
  // if (typeof val === 'string') {
  //   const s = val.trim();
  //   if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  //   if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
  //     const parts = s.split('/');
  //     return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  //   }
  //   return s;
  // }

  return null;
}

/**
 * Chuyển đổi ô Giờ trong Excel sang HH:mm:ss
 * Hỗ trợ số thực serial Excel (e.g. 46296.56319 hoặc 0.56319), chuỗi HH:mm, HH:mm:ss hoặc Date object
 */
function parseTimeCell(val: any): string | null {
  if (val === null || val === undefined || val === '') return null;

  // 1. Nếu là số serial Excel (lấy phần thập phân thể hiện thời gian trong ngày)
  if (typeof val === 'number') {
    const frac = val >= 1 ? val - Math.floor(val) : val;
    const totalSeconds = Math.round(frac * 86400);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  // 2. Nếu là Date object
  // if (val instanceof Date && !isNaN(val.getTime())) {
  //   const h = String(val.getHours()).padStart(2, '0');
  //   const m = String(val.getMinutes()).padStart(2, '0');
  //   const s = String(val.getSeconds()).padStart(2, '0');
  //   return `${h}:${m}:${s}`;
  // }

  // 3. Nếu là chuỗi
  // if (typeof val === 'string') {
  //   const s = val.trim();
  //   if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) {
  //     const p = s.split(':');
  //     return `${p[0].padStart(2, '0')}:${p[1].padStart(2, '0')}:${(p[2] || '00').padStart(2, '0')}`;
  //   }
  //   return s;
  // }

  return null;
}

function timeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':').map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

/**
 * Tính toán giờ làm chính, tăng ca, và tình trạng đi trễ theo quy định công ty
 * Quy tắc: Không làm tròn bất kỳ giờ nào, làm bao nhiêu tính bấy nhiêu (quy đổi sang số thập phân: phút / 60)
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
    // Không làm tròn, làm bao nhiêu tính bấy nhiêu (quy đổi sang số thập phân)
    regHours = Math.round((regMin / 60) * 100) / 100;
  }

  // Giờ tăng ca (OT) ngoài khung 07:00 - 17:00 (trước 7h và sau 17h, tính chính xác số phút quy đổi thập phân)
  let otMorningMin = 0;
  if (inMin < 7 * 60) {
    otMorningMin = Math.max(0, Math.min(outMin, 7 * 60) - inMin);
  }
  let otEveningMin = 0;
  if (outMin > 17 * 60) {
    otEveningMin = Math.max(0, outMin - Math.max(inMin, 17 * 60));
  }
  const totalOtMin = otMorningMin + otEveningMin;
  const otHours = Math.round((totalOtMin / 60) * 100) / 100;

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
  const readFn = xlsxLib.read || XLSX.read;
  const utilsObj = xlsxLib.utils || XLSX.utils;

  const wb = readFn(buffer, { type: 'buffer' });
  if (!wb.SheetNames || wb.SheetNames.length === 0) {
    throw new Error('File Excel không có Sheet dữ liệu nào!');
  }

  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rawRows: any[][] = utilsObj.sheet_to_json(sheet, { header: 1 });

  if (!rawRows || rawRows.length < 2) {
    throw new Error('File Excel không có dữ liệu để nhập!');
  }

  // Xác định vị trí cột Mã, Ngày, Giờ, Kiểu chấm, Nguồn chấm, Mã máy, Tên máy
  let codeCol = 1;
  let dateCol = 2;
  let timeCol = 3;
  let typeCol = 4;
  let sourceCol = 5;
  let machineNumCol = 6;
  let machineNameCol = 7;

  const headerRow = rawRows[0] || [];
  for (let c = 0; c < headerRow.length; c++) {
    const val = String(headerRow[c] || '').toLowerCase().trim();
    if (val === 'mã' || val === 'ma' || val === 'code' || val === 'mã nv') codeCol = c;
    if (val === 'ngày' || val === 'ngay' || val === 'date') dateCol = c;
    if (val === 'giờ' || val === 'gio' || val === 'time') timeCol = c;
    if (val === 'kiểu chấm' || val === 'kieu cham' || val === 'type') typeCol = c;
    if (val === 'nguồn chấm' || val === 'nguon cham' || val === 'source') sourceCol = c;
    if (val === 'mã số máy' || val === 'ma so may' || val === 'mã máy' || val === 'machine id') machineNumCol = c;
    if (val === 'tên máy' || val === 'ten may' || val === 'machine name') machineNameCol = c;
  }

  interface RawPunchRecord {
    code: string;
    dateRaw: string;
    timeRaw: string;
    dateStr: string;
    timeStr: string;
    punchType: number | null;
    punchSource: number | null;
    machineNumber: number | null;
    machineName: string;
  }

  const rawPunchesList: RawPunchRecord[] = [];
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
    const dateRaw = row[dateCol] !== undefined && row[dateCol] !== null ? String(row[dateCol]).trim() : '';
    const timeRaw = row[timeCol] !== undefined && row[timeCol] !== null ? String(row[timeCol]).trim() : '';
    const dateStr = parseDateCell(row[dateCol]);
    const timeStr = parseTimeCell(row[timeCol]);
    const punchType =
      row[typeCol] !== undefined && row[typeCol] !== null && row[typeCol] !== ''
        ? Number(row[typeCol])
        : null;
    const punchSource =
      row[sourceCol] !== undefined && row[sourceCol] !== null && row[sourceCol] !== ''
        ? Number(row[sourceCol])
        : null;
    const machineNumber =
      row[machineNumCol] !== undefined && row[machineNumCol] !== null && row[machineNumCol] !== ''
        ? Number(row[machineNumCol])
        : 1;
    const machineName =
      row[machineNameCol] !== undefined && row[machineNameCol] !== null
        ? String(row[machineNameCol]).trim()
        : '';

    if (!dateStr || !timeStr) continue;

    allCodes.add(code);
    allDates.push(dateStr);
    totalPunches++;

    rawPunchesList.push({
      code,
      dateRaw,
      timeRaw,
      dateStr,
      timeStr,
      punchType,
      punchSource,
      machineNumber,
      machineName,
    });

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

  // Lưu dữ liệu thô: Kiểm tra trùng theo (employee_code, date_formatted, time_formatted, machine_number)
  const insertRawStmt = db.prepare(`
    INSERT OR IGNORE INTO raw_attendances (
      file_id, employee_code, date_raw, time_raw,
      date_formatted, time_formatted, punch_type, punch_source,
      machine_number, machine_name
    ) VALUES (
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?
    )
  `);

  const upsertAttendanceStmt = db.prepare(`
    INSERT INTO attendances (
      employee_code, attendance_date, check_in, check_out,
      regular_hours, ot_hours, is_late, late_permitted, note
    ) VALUES (
      ?, ?, ?, ?,
      ?, ?, ?, 0, ?
    )
    ON CONFLICT(employee_code, attendance_date) DO UPDATE SET
      check_in = excluded.check_in,
      check_out = excluded.check_out,
      regular_hours = excluded.regular_hours,
      ot_hours = excluded.ot_hours,
      is_late = excluded.is_late
  `);

  let fileId = 0;
  let newRawRows = 0;
  let duplicateRawRows = 0;

  const runImport = db.transaction(() => {
    // 3.1 Lưu lịch sử file
    const fileResult = insertFileStmt.run(savedFileName, originalName, filePath, rawRows.length - 1);
    fileId = Number(fileResult.lastInsertRowid);

    // 3.2 Tự động thêm nhân viên mới nếu chưa có
    for (const code of allCodes) {
      insertEmpStmt.run(code, `Nhân viên ${code}`, minDate);
    }

    // 3.3 Lưu dữ liệu thô 100% vào raw_attendances và phát hiện trùng
    for (const p of rawPunchesList) {
      const res = insertRawStmt.run(
        fileId,
        p.code,
        p.dateRaw,
        p.timeRaw,
        p.dateStr,
        p.timeStr,
        p.punchType,
        p.punchSource,
        p.machineNumber,
        p.machineName
      );
      if (res.changes > 0) {
        newRawRows++;
      } else {
        duplicateRawRows++;
      }
    }

    // 3.4 Lưu bảng công tổng hợp từng ngày vào attendances
    for (const [key, times] of Object.entries(punchesByEmpDate)) {
      const [empCode, attDate] = key.split('||');
      const calc = calculateAttendanceHours(times);

      let note = '';
      if (calc.isLate === 1) {
        note = 'Vào trễ sau 7:15';
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
    totalRawRows: rawPunchesList.length,
    newRawRows,
    duplicateRawRows,
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
 * Lấy dữ liệu chấm công (theo ngày, tháng hoặc tất cả)
 */
export function getAttendances(filter?: string | { date?: string; month?: string; employee_code?: string }) {
  const db = getDb();
  let sql = `
    SELECT a.*, e.name as employee_name, e.employee_type
    FROM attendances a
    LEFT JOIN employees e ON a.employee_code = e.code
    WHERE 1=1
  `;
  const params: any[] = [];

  let dateParam: string | undefined;
  let monthParam: string | undefined;
  let empCodeParam: string | undefined;

  if (typeof filter === 'string') {
    const trimmed = filter.trim();
    if (trimmed && trimmed !== 'all') {
      if (trimmed.length === 7) {
        // YYYY-MM
        monthParam = trimmed;
      } else {
        // YYYY-MM-DD
        dateParam = trimmed;
      }
    }
  } else if (filter && typeof filter === 'object') {
    dateParam = filter.date;
    monthParam = filter.month;
    empCodeParam = filter.employee_code;
  }

  if (dateParam) {
    sql += ` AND a.attendance_date = ?`;
    params.push(dateParam);
  } else if (monthParam) {
    sql += ` AND strftime('%Y-%m', a.attendance_date) = ?`;
    params.push(monthParam);
  }
  if (empCodeParam) {
    sql += ` AND a.employee_code = ?`;
    params.push(empCodeParam);
  }

  sql += ` ORDER BY a.attendance_date DESC, CAST(a.employee_code AS INTEGER) ASC, a.employee_code ASC`;

  return db.prepare(sql).all(...params);
}

/**
 * Lấy dữ liệu thô đầu vào từ máy chấm công để khách hàng kiểm tra thực tế
 */
export interface RawAttendanceFilter {
  date?: string;
  employee_code?: string;
  file_id?: number;
}

export function getRawAttendances(filter?: RawAttendanceFilter) {
  const db = getDb();
  let sql = `
    SELECT r.*, e.name as employee_name
    FROM raw_attendances r
    LEFT JOIN employees e ON r.employee_code = e.code
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filter?.date) {
    sql += ` AND r.date_formatted = ?`;
    params.push(filter.date);
  }
  if (filter?.employee_code) {
    sql += ` AND r.employee_code = ?`;
    params.push(filter.employee_code);
  }
  if (filter?.file_id) {
    sql += ` AND r.file_id = ?`;
    params.push(filter.file_id);
  }

  sql += ` ORDER BY r.date_formatted DESC, r.time_formatted ASC, CAST(r.employee_code AS INTEGER) ASC`;

  return db.prepare(sql).all(...params);
}

/**
 * Cập nhật duyệt phép / trễ giờ
 */
export function updateAttendanceStatus(params: {
  id: number;
  late_permitted?: number;
  note?: string;
}) {
  const db = getDb();
  const { id, late_permitted, note } = params;
  db.prepare(`
    UPDATE attendances SET
      late_permitted = COALESCE(?, late_permitted),
      note = COALESCE(?, note)
    WHERE id = ?
  `).run(late_permitted ?? null, note ?? null, id);
  return { success: true };
}

/**
 * Danh sách yêu cầu cần duyệt phép đi trễ
 */
export function getLeaveRequests(filter?: { month?: string; employee_code?: string; status?: string }) {
  const db = getDb();
  let sql = `
    SELECT a.*, e.name as employee_name, e.employee_type
    FROM attendances a
    LEFT JOIN employees e ON a.employee_code = e.code
    WHERE a.is_late = 1
  `;
  const params: any[] = [];

  if (filter?.month && filter.month !== 'all') {
    sql += ` AND strftime('%Y-%m', a.attendance_date) = ?`;
    params.push(filter.month);
  }
  if (filter?.employee_code && filter.employee_code !== 'all') {
    sql += ` AND a.employee_code = ?`;
    params.push(filter.employee_code);
  }
  if (filter?.status === 'permitted') {
    sql += ` AND a.late_permitted = 1`;
  } else if (filter?.status === 'unpermitted') {
    sql += ` AND (a.late_permitted = 0 OR a.late_permitted IS NULL)`;
  }

  sql += ` ORDER BY a.attendance_date DESC, CAST(a.employee_code AS INTEGER) ASC`;
  return db.prepare(sql).all(...params);
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

    const attendedDays = attendances.filter((a) => a.regular_hours > 0 || a.check_in).length;
    const leaveDays = Math.max(0, daysInMonth - attendedDays);

    // Quy định: Điều kiện không nghỉ ngày nào kể cả có phép hoặc không phép.
    // Đi trễ vẫn tính là có đi làm. Phải làm đủ các ngày trong tháng (đặc thù không nghỉ chủ nhật/lễ).
    const isEligible = attendedDays >= daysInMonth;

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
 * Lấy danh sách các tháng có dữ liệu chấm công
 */
export function getSalaryMonths(): string[] {
  const db = getDb();
  const rows: any[] = db
    .prepare("SELECT DISTINCT strftime('%Y-%m', attendance_date) as m FROM attendances WHERE attendance_date IS NOT NULL ORDER BY m DESC")
    .all();
  return rows.map((r) => r.m).filter(Boolean);
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
  const bonusMap = new Map(bonuses.map((b) => [b.employee_code, b]));

  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr, 10);
  const m = parseInt(monthStr, 10);
  const daysInMonth = new Date(year, m, 0).getDate();

  const insertSalaryStmt = db.prepare(`
    INSERT INTO monthly_salaries (
      employee_code, month_year, total_work_days, total_regular_hours, total_ot_hours,
      regular_salary, ot_salary, late_penalty, attendance_bonus, net_salary, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
    ON CONFLICT(employee_code, month_year) DO UPDATE SET
      total_work_days = excluded.total_work_days,
      total_regular_hours = excluded.total_regular_hours,
      total_ot_hours = excluded.total_ot_hours,
      regular_salary = excluded.regular_salary,
      ot_salary = excluded.ot_salary,
      late_penalty = excluded.late_penalty,
      attendance_bonus = excluded.attendance_bonus,
      net_salary = excluded.net_salary,
      updated_at = datetime('now', 'localtime')
  `);

  const result: any[] = [];

  for (const emp of employees) {
    const attendances: any[] = db
      .prepare(`
        SELECT * FROM attendances
        WHERE employee_code = ? AND strftime('%Y-%m', attendance_date) = ?
        ORDER BY attendance_date ASC
      `)
      .all(emp.code, month);

    let totalWorkDays = 0;
    let totalRegularHours = 0;
    let totalOtHours = 0;
    let latePenalty = 0; //Lương phạt đi trễ trừ 1/2
    let lateCount = 0; //Đi trễ
    let unexcusedLateCount = 0; //Đi trễ không phép
    let excusedLateCount = 0; //Đi trễ có phép

    for (const att of attendances) {
      if (att.regular_hours > 0 || att.check_in) {
        totalWorkDays++;
      }
      totalRegularHours += att.regular_hours || 0;
      totalOtHours += att.ot_hours || 0;

      if (att.is_late === 1) {
        lateCount++;
        if (att.late_permitted === 1) {
          excusedLateCount++;
        } else {
          unexcusedLateCount++;
          // Quy định: Đi trễ không phép bị trừ 1/2 ngày lương chính
          // Lương chính thức: 200.000đ/ngày -> 100.000đ
          // Lương học việc: 166.660đ/ngày -> 83.330đ
          const halfDayRate = Math.round(((emp.hourly_salary || 20000) * 10) / 2);
          latePenalty += halfDayRate;
        }
      }
    }

    totalRegularHours = Math.round(totalRegularHours * 100) / 100;
    totalOtHours = Math.round(totalOtHours * 100) / 100;

    const hourlySalary = emp.hourly_salary || 0;
    const otHourlySalary = emp.ot_hourly_salary || 0;
    const regularSalary = Math.round(totalRegularHours * hourlySalary);
    const otSalary = Math.round(totalOtHours * otHourlySalary);

    const bonusInfo = bonusMap.get(emp.code);
    const attendanceBonus = bonusInfo?.bonus_amount || 0;
    const attendanceStatus = bonusInfo?.status || 'not_eligible';
    const attendanceReason = bonusInfo?.reason || '';
    const consecutiveMonths = bonusInfo?.consecutive_months || 0;

    const netSalary = Math.max(0, Math.round(regularSalary + otSalary + attendanceBonus - latePenalty));

    // Cập nhật vào bảng monthly_salaries trong database SQLite
    insertSalaryStmt.run(
      emp.code,
      month,
      totalWorkDays,
      totalRegularHours,
      totalOtHours,
      regularSalary,
      otSalary,
      latePenalty,
      attendanceBonus,
      netSalary
    );

    result.push({
      id: emp.id,
      employee_code: emp.code,
      employee_name: emp.name,
      employee_type: emp.employee_type || 'official',
      status: emp.status || 'active',
      start_date: emp.start_date,
      hourly_salary: hourlySalary,
      ot_hourly_salary: otHourlySalary,
      month_year: month,
      total_month_days: daysInMonth,
      total_work_days: totalWorkDays,
      leave_days: Math.max(0, daysInMonth - totalWorkDays),
      total_regular_hours: totalRegularHours,
      total_ot_hours: totalOtHours,
      late_count: lateCount,
      unexcused_late_count: unexcusedLateCount,
      excused_late_count: excusedLateCount,
      regular_salary: regularSalary,
      ot_salary: otSalary,
      late_penalty: latePenalty,
      attendance_bonus: attendanceBonus,
      attendance_status: attendanceStatus,
      attendance_reason: attendanceReason,
      consecutive_months: consecutiveMonths,
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

