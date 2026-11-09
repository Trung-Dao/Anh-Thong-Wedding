import React, { useState, useEffect, useMemo } from 'react';
import type { MonthlySalary, AttendanceRecord } from '../types';
import XLSX from 'xlsx-js-style';

const xlsxLib: any = XLSX;

export const SalaryView: React.FC = () => {
  // Mặc định tháng hiện tại
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return new Date().toISOString().slice(0, 7);
  });
  // const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [salaries, setSalaries] = useState<MonthlySalary[]>([]);
  const [loading, setLoading] = useState(false);

  // Bộ lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'official' | 'probation'>('all');

  // Modal xem chi tiết phiếu lương & bảng chấm công của nhân viên
  const [selectedEmployee, setSelectedEmployee] = useState<MonthlySalary | null>(null);
  const [empAttendances, setEmpAttendances] = useState<AttendanceRecord[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Tải danh sách các tháng có dữ liệu
  useEffect(() => {
    const loadMonths = async () => {
      if (window.electronAPI?.getSalaryMonths) {
        try {
          const months = await window.electronAPI.getSalaryMonths();
          // setAvailableMonths(months || []);
          // Nếu tháng hiện tại không có dữ liệu mà có tháng trước đó thì ưu tiên tháng mới nhất
          if (months && months.length > 0 && !months.includes(selectedMonth)) {
            setSelectedMonth(months[0]);
          }
        } catch (err) {
          console.error('Lỗi khi lấy danh sách tháng:', err);
        }
      }
    };
    loadMonths();
  }, []);

  // Tải bảng lương theo tháng
  const loadSalaries = async (month: string) => {
    if (window.electronAPI?.getMonthlySalaries) {
      setLoading(true);
      try {
        const list = await window.electronAPI.getMonthlySalaries(month);
        setSalaries(list || []);
      } catch (err) {
        console.error('Lỗi khi tính bảng lương:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadSalaries(selectedMonth);
  }, [selectedMonth]);

  // Tải chi tiết bảng chấm công của nhân viên khi mở Modal
  useEffect(() => {
    if (selectedEmployee && window.electronAPI?.getAttendances) {
      setLoadingDetails(true);
      window.electronAPI
        .getAttendances({
          month: selectedMonth,
          employee_code: selectedEmployee.employee_code,
        })
        .then((records) => {
          // Sắp xếp ngày tăng dần để người dùng dễ theo dõi theo tiến trình tháng
          const sorted = (records || []).slice().sort((a, b) =>
            a.attendance_date.localeCompare(b.attendance_date)
          );
          setEmpAttendances(sorted);
        })
        .catch((err) => {
          console.error('Lỗi khi tải chi tiết chấm công nhân viên:', err);
        })
        .finally(() => {
          setLoadingDetails(false);
        });
    } else {
      setEmpAttendances([]);
    }
  }, [selectedEmployee, selectedMonth]);

  // Định dạng ngày hiển thị dd/mm/yyyy
  const formatDateVN = (dateStr?: string) => {
    if (!dateStr) return '--';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Lọc danh sách nhân viên
  const filteredSalaries = useMemo(() => {
    return salaries.filter((s) => {
      const name = s.employee_name?.toLowerCase() || '';
      const code = s.employee_code.toLowerCase();
      const search = searchTerm.toLowerCase();
      const matchesSearch = name.includes(search) || code.includes(search);
      const matchesType = filterType === 'all' || s.employee_type === filterType;
      return matchesSearch && matchesType;
    });
  }, [salaries, searchTerm, filterType]);

  // Thống kê tổng hợp
  const totalPayroll = filteredSalaries.reduce((acc, cur) => acc + (cur.net_salary || 0), 0);
  const totalRegularHours = Math.round(filteredSalaries.reduce((acc, cur) => acc + (cur.total_regular_hours || 0), 0) * 100) / 100;
  const totalRegularSalary = filteredSalaries.reduce((acc, cur) => acc + (cur.regular_salary || 0), 0);
  const totalOtHours = Math.round(filteredSalaries.reduce((acc, cur) => acc + (cur.total_ot_hours || 0), 0) * 100) / 100;
  const totalOtSalary = filteredSalaries.reduce((acc, cur) => acc + (cur.ot_salary || 0), 0);
  const totalBonus = filteredSalaries.reduce((acc, cur) => acc + (cur.attendance_bonus || 0), 0);
  const totalLatePenalty = filteredSalaries.reduce((acc, cur) => acc + (cur.late_penalty || 0), 0);
  const totalWorkDays = filteredSalaries.reduce((acc, cur) => acc + (cur.total_work_days || 0), 0);
  const totalUnexcusedLate = filteredSalaries.reduce((acc, cur) => acc + (cur.unexcused_late_count || 0), 0);
  const bonusEligibleCount = filteredSalaries.filter((s) => (s.attendance_bonus || 0) > 0).length;

  // Lấy tên tháng hiển thị (VD: Tháng 10/2026)
  const formattedMonthLabel = useMemo(() => {
    const parts = selectedMonth.split('-');
    if (parts.length === 2) {
      return `Tháng ${parts[1]}/${parts[0]}`;
    }
    return selectedMonth;
  }, [selectedMonth]);

  // Lấy thứ trong tuần (Thứ 2, Thứ 3, ..., Chủ nhật)
  const getDayOfWeekVN = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return days[d.getDay()] || '';
  };

  // Xuất file Excel Nhật Ký Chấm Công Hàng Ngày Trong Tháng để nhân viên đối chiếu
  const handleExportEmployeeExcel = async () => {
    if (!selectedEmployee) return;
    setExportingExcel(true);
    setExportNotice(null);

    try {
      // const isProbation = selectedEmployee.employee_type === 'probation';
      // const typeLabel = isProbation ? 'Học việc' : 'Chính thức';
      const cleanName = (selectedEmployee.employee_name || `NV_${selectedEmployee.employee_code}`)
        .trim()
        .replace(/\s+/g, '_');
      const defaultFileName = `Bang_Cham_Cong_${cleanName}_${selectedEmployee.month_year}.xlsx`;

      // Tạo cấu trúc dữ liệu AOA (Array of Arrays) cho sheet Excel
      const aoa: any[][] = [];

      // 1. Tiêu đề
      // aoa.push(['ANH THÔNG WEDDING']);
      aoa.push(['BẢNG CHẤM CÔNG NHÂN VIÊN']);
      // aoa.push([`Kỳ tính lương: ${formattedMonthLabel}`, '', '', `Ngày xuất file: ${new Date().toLocaleDateString('vi-VN')}`]);
      aoa.push([]);

      // 2. Thông tin nhân viên
      // aoa.push(['I. THÔNG TIN NHÂN VIÊN']);
      // aoa.push(['Mã nhân viên:', selectedEmployee.employee_code, '', 'Họ và tên:', selectedEmployee.employee_name || '']);
      // aoa.push(['Loại nhân viên:', typeLabel, '', 'Ngày vào làm:', formatDateVN(selectedEmployee.start_date)]);
      // aoa.push([
      //   'Đơn giá giờ chính:',
      //   `${(selectedEmployee.hourly_salary || (isProbation ? 16666 : 20000)).toLocaleString('vi-VN')} đ/h`,
      //   '',
      //   'Đơn giá tăng ca (OT):',
      //   `${(selectedEmployee.ot_hourly_salary || 40000).toLocaleString('vi-VN')} đ/h`,
      // ]);
      // aoa.push([]);

      // 3. Tóm tắt công & lương tháng
      // aoa.push(['II. TỔNG HỢP CÔNG & LƯƠNG TRONG THÁNG']);
      // aoa.push([
      //   'Số ngày đi làm:',
      //   `${selectedEmployee.total_work_days}/${selectedEmployee.total_month_days || 31} ngày`,
      //   '',
      //   'Tổng giờ làm chính:',
      //   `${selectedEmployee.total_regular_hours} giờ`,
      // ]);
      // aoa.push([
      //   'Số ngày nghỉ:',
      //   `${selectedEmployee.leave_days || 0} ngày`,
      //   '',
      //   'Tổng giờ tăng ca:',
      //   `${selectedEmployee.total_ot_hours} giờ`,
      // ]);
      // aoa.push([
      //   'Lương giờ chính:',
      //   `${selectedEmployee.regular_salary.toLocaleString('vi-VN')} đ`,
      //   '',
      //   'Lương tăng ca:',
      //   `${selectedEmployee.ot_salary.toLocaleString('vi-VN')} đ`,
      // ]);
      // aoa.push([
      //   'Thưởng chuyên cần:',
      //   `${selectedEmployee.attendance_bonus.toLocaleString('vi-VN')} đ`,
      //   '',
      //   'Khấu trừ phạt trễ:',
      //   `-${selectedEmployee.late_penalty.toLocaleString('vi-VN')} đ (${selectedEmployee.unexcused_late_count || 0} lần K.phép)`,
      // ]);
      // aoa.push([
      //   'TỔNG THỰC LĨNH:',
      //   `${selectedEmployee.net_salary.toLocaleString('vi-VN')} đ`,
      //   '',
      //   'Trễ có phép:',
      //   `${selectedEmployee.excused_late_count || 0} lần (không trừ tiền)`,
      // ]);
      // aoa.push([]);

      // 4. Bảng nhật ký chấm công hàng ngày
      // aoa.push(['III. NHẬT KÝ CHẤM CÔNG HÀNG NGÀY']);
      aoa.push([
        'STT',
        'Ngày',
        'Thứ',
        'Giờ Vào',
        'Giờ Ra',
        'Giờ Làm Chính (h)',
        'Giờ Tăng Ca (h)',
        'Tình Trạng Đi Trễ',
        'Ghi Chú',
      ]);

      empAttendances.forEach((att, idx) => {
        const isLate = att.is_late === 1;
        const isPermitted = att.late_permitted === 1;
        let lateStatusText = 'Đúng giờ';
        if (isLate) {
          lateStatusText = isPermitted ? 'Trễ có phép' : 'Trễ không phép (-1/2 ngày)';
        }

        aoa.push([
          idx + 1,
          formatDateVN(att.attendance_date),
          getDayOfWeekVN(att.attendance_date),
          att.check_in || '--:--',
          att.check_out || '--:--',
          att.regular_hours || 0,
          att.ot_hours || 0,
          lateStatusText,
          att.note || '',
        ]);
      });

      // Dòng tổng cộng
      aoa.push([
        '',
        'TỔNG CỘNG',
        '',
        '',
        '',
        selectedEmployee.total_regular_hours,
        selectedEmployee.total_ot_hours,
        '',
        '',
      ]);

      // Khởi tạo Worksheet & Workbook
      const ws = xlsxLib.utils.aoa_to_sheet(aoa);

      // Định dạng ô A1: In đậm
      if (ws['A1']) {
        ws['A1'].s = {
          font: { bold: true, sz: 12 },
          alignment: { vertical: 'center' },
        };
      }

      // Tạo Border nét mảnh cho toàn bộ bảng chấm công
      const thinBorder = {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } },
      };

      const startRowIdx = 2; // Dòng 3 (0-based) là Header
      const endRowIdx = aoa.length - 1; // Dòng cuối cùng là TỔNG CỘNG
      const totalCols = 9; // 9 cột từ A đến I

      for (let r = startRowIdx; r <= endRowIdx; r++) {
        for (let c = 0; c < totalCols; c++) {
          const cellRef = xlsxLib.utils.encode_cell({ r, c });
          if (!ws[cellRef]) {
            ws[cellRef] = { t: 's', v: '' };
          }

          if (r === startRowIdx) {
            // 1. Dòng tiêu đề cột (Header): In đậm, có viền
            ws[cellRef].s = {
              font: { bold: true },
              border: thinBorder,
              alignment: {
                horizontal: c <= 4 ? 'center' : c === 5 || c === 6 ? 'right' : 'left',
                vertical: 'center',
              },
            };
          } else if (r === endRowIdx) {
            // 2. Dòng TỔNG CỘNG: In đậm, có viền
            ws[cellRef].s = {
              font: { bold: true },
              border: thinBorder,
              alignment: {
                horizontal: c === 1 ? 'center' : c === 5 || c === 6 ? 'right' : 'left',
                vertical: 'center',
              },
            };
          } else {
            // 3. Dòng dữ liệu hàng ngày: Căn lề chuẩn & Kẻ viền
            let hAlign = 'left';
            if (c === 0) hAlign = 'right'; // Cột STT căn phải & in đậm
            else if (c >= 1 && c <= 4) hAlign = 'center'; // Ngày, Thứ, Giờ vào, Giờ ra căn giữa
            else if (c === 5 || c === 6) hAlign = 'right'; // Số giờ làm căn phải

            ws[cellRef].s = {
              font: { bold: c === 0 },
              border: thinBorder,
              alignment: {
                horizontal: hAlign,
                vertical: 'center',
              },
            };
          }
        }
      }

      // Căn chỉnh độ rộng cột
      ws['!cols'] = [
        { wch: 6 },  // STT
        { wch: 13 }, // Ngày
        { wch: 10 }, // Thứ
        { wch: 11 }, // Giờ Vào
        { wch: 11 }, // Giờ Ra
        { wch: 18 }, // Giờ Làm Chính
        { wch: 16 }, // Giờ Tăng Ca
        { wch: 28 }, // Tình Trạng Đi Trễ
        { wch: 22 }, // Ghi Chú
      ];

      const wb = xlsxLib.utils.book_new();
      xlsxLib.utils.book_append_sheet(wb, ws, 'Nhat_Ky_Cham_Cong');

      // Xuất file qua Electron API hoặc Fallback Browser
      if (window.electronAPI?.exportExcelFile) {
        const base64Buffer = xlsxLib.write(wb, { bookType: 'xlsx', type: 'base64' });
        const res = await window.electronAPI.exportExcelFile({
          defaultFileName,
          base64Buffer,
        });

        if (res.canceled) {
          return;
        }

        if (res.success) {
          setExportNotice(`Đã xuất file:\n${res.filePath}`);
          setTimeout(() => setExportNotice(null), 6000);
        } else {
          alert(`Lỗi khi xuất file: ${res.message || 'Không xác định'}`);
        }
      } else {
        // Fallback Web: Tải trực tiếp qua Blob
        const wbBuffer = xlsxLib.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbBuffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = defaultFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setExportNotice(`✅ Đã tải file ${defaultFileName} về máy!`);
        setTimeout(() => setExportNotice(null), 6000);
      }
    } catch (err: any) {
      console.error('Lỗi khi xuất file Excel:', err);
      alert(`Đã xảy ra lỗi khi tạo file Excel: ${err.message}`);
    } finally {
      setExportingExcel(false);
    }
  };

  // In bảng lương
  // const handlePrint = () => {
  //   window.print();
  // };

  return (
    <div>
      {/* ================= PHẦN HIỂN THỊ KHI IN (PRINT ONLY) ================= */}
      <div className="print-only" style={{ marginBottom: '20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '18pt', fontWeight: 'bold' }}>
            Wedding
          </h2>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '15pt', textTransform: 'uppercase' }}>
            BẢNG TỔNG HỢP THANH TOÁN TIỀN LƯƠNG NHÂN VIÊN
          </h3>
          <p style={{ margin: 0, fontStyle: 'italic', fontSize: '11pt' }}>
            Kỳ tính lương: <strong>{formattedMonthLabel}</strong>
          </p>
        </div>
      </div>

      {/* ================= 4 THẺ THỐNG KÊ QUỸ LƯƠNG & CHỈ SỐ ================= */}
      <div className="stats-grid no-print" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
        {/* 1. Tổng Quỹ Lương Thực Lĩnh */}
        <div className="stat-card">
          <div className="stat-icon red">💵</div>
          <div className="stat-info">
            <h3>Tổng Quỹ Lương Thực Lĩnh</h3>
            <div className="stat-value" style={{ color: 'var(--primary)', fontSize: '20px' }}>
              {totalPayroll.toLocaleString('vi-VN')} đ
            </div>
            <div className="stat-desc">
              Chi trả cho <strong>{filteredSalaries.length}</strong> nhân viên
            </div>
          </div>
        </div>

        {/* 2. Tổng Giờ Làm & Công */}
        <div className="stat-card">
          <div className="stat-icon green">⏱️</div>
          <div className="stat-info">
            <h3>Tổng Giờ Làm Việc</h3>
            <div className="stat-value" style={{ fontSize: '20px' }}>
              {Math.round((totalRegularHours + totalOtHours) * 100) / 100} giờ
            </div>
            <div className="stat-desc">
              Chính: <strong>{totalRegularHours}h</strong> | Tăng ca: <strong>{totalOtHours}h</strong> ({totalWorkDays} công)
            </div>
          </div>
        </div>

        {/* 3. Thưởng Chuyên Cần */}
        <div className="stat-card">
          <div className="stat-icon amber">🏆</div>
          <div className="stat-info">
            <h3>Thưởng Chuyên Cần</h3>
            <div className="stat-value" style={{ color: '#15803d', fontSize: '20px' }}>
              +{totalBonus.toLocaleString('vi-VN')} đ
            </div>
            <div className="stat-desc">
              <strong>{bonusEligibleCount}</strong> nhân viên đạt chuyên cần
            </div>
          </div>
        </div>

        {/* 4. Khấu Trừ Phạt Trễ */}
        <div className="stat-card">
          <div className="stat-icon red" style={{ background: '#fee2e2' }}>⚠️</div>
          <div className="stat-info">
            <h3>Phạt Trễ Không Phép</h3>
            <div className="stat-value" style={{ color: '#b91c1c', fontSize: '20px' }}>
              -{totalLatePenalty.toLocaleString('vi-VN')} đ
            </div>
            <div className="stat-desc">
              Tổng <strong>{totalUnexcusedLate}</strong> lần trễ không phép (1/2 ngày/lần)
            </div>
          </div>
        </div>
      </div>

      {/* ================= BẢNG DỮ LIỆU TỔNG HỢP LƯƠNG ================= */}
      <div className="card">
        {/* THANH ĐIỀU KHIỂN & BỘ LỌC */}
        <div className="card-header no-print" style={{ flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
              📅 Chọn Tháng:
            </label>
            <input
              type="month"
              className="form-input"
              style={{ width: '160px', padding: '6px 10px', fontWeight: '600' }}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />

            {/* Quick-pill các tháng có dữ liệu */}
            {/* {availableMonths.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Tháng có dữ liệu:</span>
                {availableMonths.slice(0, 4).map((m) => {
                  const mLabel = m.split('-').reverse().join('/');
                  const isActive = m === selectedMonth;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSelectedMonth(m)}
                      style={{
                        padding: '3px 8px',
                        fontSize: '11px',
                        borderRadius: '999px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        border: isActive ? '1px solid var(--primary)' : '1px solid #cbd5e1',
                        backgroundColor: isActive ? 'var(--primary)' : '#f8fafc',
                        color: isActive ? '#ffffff' : '#334155',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {mLabel}
                    </button>
                  );
                })}
              </div>
            )} */}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto', flexWrap: 'wrap' }}>
            {/* Tìm kiếm tên / mã */}
            <input
              type="text"
              placeholder="🔍 Tìm tên hoặc mã NV..."
              className="form-input"
              style={{ width: '210px', padding: '6px 12px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* Lọc loại nhân viên */}
            <select
              className="form-input"
              style={{ width: '140px', padding: '6px 10px' }}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
            >
              <option value="all">Tất cả loại NV</option>
              <option value="official">Chính thức</option>
              <option value="probation">Học việc</option>
            </select>

            {/* Nút tính lại */}
            {/* <button
              className="btn btn-secondary btn-sm"
              onClick={() => loadSalaries(selectedMonth)}
              disabled={loading}
              title="Tính toán và cập nhật lại bảng lương từ dữ liệu chấm công"
            >
              {loading ? '⏳ Đang tính...' : '🔄 Tính Lại'}
            </button> */}

            {/* Nút In bảng lương */}
            {/* <button
              className="btn btn-primary btn-sm"
              onClick={handlePrint}
              style={{ backgroundColor: '#0f766e', borderColor: '#0f766e' }}
              title="In bảng lương ra máy in hoặc lưu PDF"
            >
              🖨️ In Bảng Lương
            </button> */}
          </div>
        </div>

        {/* BẢNG TỔNG HỢP LƯƠNG */}
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                {/* <th style={{ width: '45px', textAlign: 'center' }}>STT</th> */}
                {/* <th style={{ width: '75px' }}>Mã NV</th> */}
                <th>Tên Nhân Viên</th>
                <th style={{ width: '110px' }}>Mức Lương</th>
                <th style={{ textAlign: 'center' }}>Tổng Công</th>
                <th style={{ textAlign: 'right' }}>Giờ Chính</th>
                <th style={{ textAlign: 'right' }}>Lương Chính</th>
                <th style={{ textAlign: 'right' }}>Tăng Ca</th>
                <th style={{ textAlign: 'right' }}>Lương TC</th>
                <th style={{ textAlign: 'right' }}>Phạt Trễ</th>
                <th style={{ textAlign: 'right' }}>Thưởng</th>
                <th style={{ textAlign: 'right', backgroundColor: '#fdf2f8', color: 'var(--primary)' }}>
                  Thực Lĩnh
                </th>
                <th className="no-print" style={{ width: '120px', textAlign: 'center' }}>
                  Thao Tác
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSalaries.length === 0 ? (
                <tr>
                  <td colSpan={13} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    {loading ? (
                      <div>⏳ Đang tải và tổng hợp dữ liệu bảng lương...</div>
                    ) : (
                      <div>
                        Chưa có nhân viên hoặc dữ liệu chấm công cho <strong>{formattedMonthLabel}</strong>.
                        <br />
                        <span style={{ fontSize: '12px' }}>
                          Vui lòng chọn tháng khác có dữ liệu hoặc vào mục <strong>"Nhập công từ excel"</strong> để nạp dữ liệu máy chấm công.
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredSalaries.map((s) => {
                  const isProbation = s.employee_type === 'probation';
                  const hasBonus = (s.attendance_bonus || 0) > 0;
                  const hasPenalty = (s.late_penalty || 0) > 0;

                  return (
                    <tr
                      key={s.id || s.employee_code}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedEmployee(s)}
                      title="Bấm để xem chi tiết phiếu lương và công từng ngày"
                    >
                      {/* <td style={{ textAlign: 'center', color: '#64748b' }}>{index + 1}</td> */}
                      {/* <td>
                        <strong style={{ color: 'var(--primary)' }}>#{s.employee_code}</strong>
                      </td> */}
                      <td>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{s.employee_name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          Vào làm: {formatDateVN(s.start_date)}
                        </div>
                      </td>
                      <td>
                        <div>
                          {isProbation ? (
                            <span className="badge badge-warning" style={{ fontSize: '10px' }}>
                              Học việc
                            </span>
                          ) : (
                            <span className="badge badge-info" style={{ fontSize: '10px' }}>
                              Chính thức
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                          {(s.hourly_salary || (isProbation ? 16666 : 20000)).toLocaleString('vi-VN')} đ/h
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ fontWeight: '700', color: '#1e293b' }}>{s.total_work_days}</span>
                        <span style={{ color: '#64748b', fontSize: '11px' }}>
                          /{s.total_month_days || 31} ngày
                        </span>
                        {s.leave_days && s.leave_days > 0 ? (
                          <div style={{ fontSize: '10px', color: '#b91c1c' }}>
                            (Nghỉ {s.leave_days} ngày)
                          </div>
                        ) : (
                          <div style={{ fontSize: '10px', color: '#15803d' }}>(Đủ tháng)</div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }}>
                        {s.total_regular_hours}h
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {s.regular_salary.toLocaleString('vi-VN')} đ
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }}>
                        {s.total_ot_hours > 0 ? (
                          <span style={{ color: '#0284c7' }}>{s.total_ot_hours}h</span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>0h</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {s.ot_salary.toLocaleString('vi-VN')} đ
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {hasPenalty ? (
                          <div>
                            <span style={{ color: '#b91c1c', fontWeight: '700' }}>
                              -{s.late_penalty.toLocaleString('vi-VN')} đ
                            </span>
                            <div style={{ fontSize: '10px', color: '#991b1b' }}>
                              {s.unexcused_late_count} lần trễ K.phép
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>0 đ</span>
                        )}
                        {s.excused_late_count && s.excused_late_count > 0 ? (
                          <div style={{ fontSize: '10px', color: '#64748b' }}>
                            ({s.excused_late_count} lần có phép)
                          </div>
                        ) : null}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {hasBonus ? (
                          <div>
                            <span style={{ color: '#15803d', fontWeight: '700' }}>
                              +{s.attendance_bonus.toLocaleString('vi-VN')} đ
                            </span>
                            {s.consecutive_months && s.consecutive_months > 1 && (
                              <div style={{ fontSize: '10px', color: '#166534' }}>
                                (Chuỗi {s.consecutive_months} tháng)
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>0 đ</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', backgroundColor: '#fdf2f8' }}>
                        <strong style={{ fontSize: '15px', color: 'var(--primary)' }}>
                          {s.net_salary.toLocaleString('vi-VN')} đ
                        </strong>
                      </td>
                      <td className="no-print" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEmployee(s);
                          }}
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                        >
                          📄 Chi Tiết
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* DÒNG TỔNG CỘNG HÀNG CUỐI */}
            {filteredSalaries.length > 0 && (
              <tfoot>
                <tr
                  style={{
                    backgroundColor: '#f8fafc',
                    borderTop: '2px solid #cbd5e1',
                    fontWeight: 'bold',
                  }}
                >
                  <td colSpan={2} style={{ textAlign: 'right', padding: '12px 14px', fontSize: '13px' }}>
                    <strong>TỔNG CỘNG ({filteredSalaries.length} NV):</strong>
                  </td>
                  <td style={{ textAlign: 'center', fontSize: '13px' }}>
                    <strong>{totalWorkDays}</strong> công
                  </td>
                  <td style={{ textAlign: 'right', fontSize: '13px' }}>
                    <strong>{totalRegularHours}h</strong>
                  </td>
                  <td style={{ textAlign: 'right', fontSize: '13px' }}>
                    <strong>{totalRegularSalary.toLocaleString('vi-VN')} đ</strong>
                  </td>
                  <td style={{ textAlign: 'right', fontSize: '13px', color: '#0284c7' }}>
                    <strong>{totalOtHours}h</strong>
                  </td>
                  <td style={{ textAlign: 'right', fontSize: '13px' }}>
                    <strong>{totalOtSalary.toLocaleString('vi-VN')} đ</strong>
                  </td>
                  <td style={{ textAlign: 'right', fontSize: '13px', color: '#b91c1c' }}>
                    <strong>-{totalLatePenalty.toLocaleString('vi-VN')} đ</strong>
                  </td>
                  <td style={{ textAlign: 'right', fontSize: '13px', color: '#15803d' }}>
                    <strong>+{totalBonus.toLocaleString('vi-VN')} đ</strong>
                  </td>
                  <td style={{ textAlign: 'right', backgroundColor: '#fdf2f8', fontSize: '15px', color: 'var(--primary)' }}>
                    <strong>{totalPayroll.toLocaleString('vi-VN')} đ</strong>
                  </td>
                  <td className="no-print"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* ================= KHỐI CHỮ KÝ IN ẤN (PRINT ONLY) ================= */}
        <div className="print-signature-section print-only">
          <div className="print-signature-box">
            <strong>NGƯỜI LẬP BIỂU</strong>
            <p style={{ margin: '4px 0', fontSize: '10pt', fontStyle: 'italic' }}>(Ký, ghi rõ họ tên)</p>
            <div className="sign-space"></div>
          </div>
          <div className="print-signature-box">
            <strong>KẾ TOÁN TRƯỞNG</strong>
            <p style={{ margin: '4px 0', fontSize: '10pt', fontStyle: 'italic' }}>(Ký, ghi rõ họ tên)</p>
            <div className="sign-space"></div>
          </div>
          <div className="print-signature-box">
            <strong>GIÁM ĐỐC DUYỆT</strong>
            <p style={{ margin: '4px 0', fontSize: '10pt', fontStyle: 'italic' }}>(Ký, đóng dấu)</p>
            <div className="sign-space"></div>
          </div>
        </div>

        {/* DIỄN GIẢI QUY ĐỊNH CHẤM CÔNG VÀ TÍNH LƯƠNG */}
        <div
          className="no-print"
          style={{
            padding: '16px 20px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid var(--border-color)',
            fontSize: '13px',
            color: '#475569',
          }}
        >
          <div style={{ fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
            📌 Quy định tính lương & chấm công:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', lineHeight: '1.6' }}>
            <div>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>
                  <strong>Giờ làm chính:</strong> 07:00 – 17:00 (không trừ giờ nghỉ trưa, tính trọn vẹn).
                </li>
                <li>
                  <strong>Quy định vào trễ:</strong> Cho phép trễ 15 phút (vào trước hoặc lúc 07:15 không tính trễ). Từ 07:16 trở đi tính là đi trễ.
                </li>
                <li>
                  <strong>Làm tròn 10 giờ:</strong> Nếu làm trong khung chính đủ 9h45p (vào trước 07:15 và làm tới 17:00) thì làm tròn 10 giờ.
                </li>
                <li>
                  <strong>Tăng ca (OT):</strong> Làm ngoài khung 07:00 – 17:00 (trước 7h sáng hoặc sau 17h chiều), lấy phần giờ chẵn, bỏ phút lẻ. Đơn giá: <strong>40.000 đ/giờ</strong>.
                </li>
              </ul>
            </div>
            <div>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>
                  <strong>Phạt trễ không phép:</strong> Trừ <strong>1/2 ngày lương</strong> (Chính thức: -100.000đ; Học việc: -83.330đ). Lương tăng ca tính riêng không trừ.
                </li>
                <li>
                  <strong>Trễ có phép:</strong> Làm bao nhiêu giờ tính bấy nhiêu, không bị phạt tiền.
                </li>
                <li>
                  <strong>Thưởng chuyên cần:</strong> Điều kiện không nghỉ ngày nào trong tháng (kể cả có phép hay không phép). Đi trễ không phép vẫn tính là có đi làm.
                  <br />
                  Tháng đầu: <strong>500.000đ</strong>; tháng tiếp theo liên tục: <strong>+100.000đ/tháng</strong> (600k, 700k... không giới hạn). Nếu có nghỉ trong tháng: 0đ và reset về 500k cho tháng sau.
                </li>
                <li>
                  <strong>Mức lương giờ chính:</strong> Chính thức <strong>20.000 đ/giờ</strong> (200k/ngày); Học việc <strong>16.666 đ/giờ</strong> (166.660đ/ngày).
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MODAL XEM CHI TIẾT PHIẾU LƯƠNG & CHẤM CÔNG ================= */}
      {selectedEmployee && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setSelectedEmployee(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#f8fafc',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', color: '#0f172a' }}>
                  📄 Phiếu Lương Chi Tiết & Bảng Chấm Công
                </h3>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                  Nhân viên: <strong style={{ color: 'var(--primary)' }}>{selectedEmployee.employee_name}</strong> (#{selectedEmployee.employee_code}) - Kỳ tính lương: <strong>{formattedMonthLabel}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEmployee(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '22px',
                  cursor: 'pointer',
                  color: '#64748b',
                }}
              >
                ✕
              </button>
            </div>

            {/* Nội dung Modal (Scrollable) */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              {/* Thẻ tóm tắt thông tin & công thức lương */}
              <div
                style={{
                  backgroundColor: '#fdf2f8',
                  borderRadius: '10px',
                  padding: '16px 20px',
                  border: '1px solid #fbcfe8',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Loại Nhân Viên</span>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>
                      {selectedEmployee.employee_type === 'probation' ? 'Học việc' : 'Chính thức'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Đơn Giá Giờ Chính</span>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>
                      {(selectedEmployee.hourly_salary || 20000).toLocaleString('vi-VN')} đ/h
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Đơn Giá Tăng Ca (OT)</span>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#0284c7' }}>
                      {(selectedEmployee.ot_hourly_salary || 40000).toLocaleString('vi-VN')} đ/h
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Ngày Vào Làm</span>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>
                      {formatDateVN(selectedEmployee.start_date)}
                    </div>
                  </div>
                </div>

                {/* Bảng phân tích chi tiết dòng tiền lương */}
                <div style={{ borderTop: '1px solid #fbcfe8', paddingTop: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#831843', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Chi Tiết Các Khoản Thu Nhập & Khấu Trừ:
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>
                        1. Lương giờ làm chính ({selectedEmployee.total_regular_hours} giờ × {(selectedEmployee.hourly_salary || 20000).toLocaleString('vi-VN')} đ):
                      </span>
                      <strong>{selectedEmployee.regular_salary.toLocaleString('vi-VN')} đ</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>
                        2. Lương làm tăng ca OT ({selectedEmployee.total_ot_hours} giờ × {(selectedEmployee.ot_hourly_salary || 40000).toLocaleString('vi-VN')} đ):
                      </span>
                      <strong style={{ color: '#0284c7' }}>+{selectedEmployee.ot_salary.toLocaleString('vi-VN')} đ</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>
                        3. Thưởng chuyên cần ({selectedEmployee.attendance_status === 'eligible' ? 'Đủ tất cả các ngày trong tháng' : selectedEmployee.attendance_reason || 'Chưa đủ điều kiện'}):
                      </span>
                      <strong style={{ color: selectedEmployee.attendance_bonus > 0 ? '#15803d' : '#64748b' }}>
                        +{selectedEmployee.attendance_bonus.toLocaleString('vi-VN')} đ
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>
                        4. Khấu trừ phạt đi trễ không phép ({selectedEmployee.unexcused_late_count || 0} lần × 1/2 ngày lương):
                      </span>
                      <strong style={{ color: selectedEmployee.late_penalty > 0 ? '#b91c1c' : '#64748b' }}>
                        -{selectedEmployee.late_penalty.toLocaleString('vi-VN')} đ
                      </strong>
                    </div>

                    {selectedEmployee.excused_late_count && selectedEmployee.excused_late_count > 0 ? (
                      <div style={{ fontSize: '12px', color: '#15803d', fontStyle: 'italic' }}>
                        * Có {selectedEmployee.excused_late_count} lần trễ có phép: tính đủ số giờ làm thực tế, không bị phạt tiền.
                      </div>
                    ) : null}

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        borderTop: '2px dashed #f472b6',
                        paddingTop: '8px',
                        marginTop: '4px',
                        fontSize: '16px',
                      }}
                    >
                      <strong style={{ color: '#831843' }}>TỔNG THỰC LĨNH:</strong>
                      <strong style={{ color: 'var(--primary)', fontSize: '18px' }}>
                        {selectedEmployee.net_salary.toLocaleString('vi-VN')} đ
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bảng nhật ký chấm công hàng ngày */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', color: '#1e293b' }}>
                    📅 Nhật Ký Chấm Công Hàng Ngày Trong Tháng ({empAttendances.length} ngày có mặt):
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      {selectedEmployee.total_work_days}/{selectedEmployee.total_month_days || 31} ngày đi làm
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={handleExportEmployeeExcel}
                      disabled={exportingExcel || loadingDetails}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#107c41',
                        color: '#ffffff',
                        borderColor: '#107c41',
                        fontSize: '11px',
                        fontWeight: '600',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        cursor: exportingExcel || loadingDetails ? 'not-allowed' : 'pointer',
                      }}
                      title="Xuất bảng đối chiếu nhật ký chấm công ra file Excel"
                    >
                      📊 Xuất Excel
                    </button>
                  </div>
                </div>

                <div className="table-responsive" style={{ maxHeight: '280px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <table className="data-table" style={{ fontSize: '12px' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#f1f5f9' }}>
                      <tr>
                        <th style={{ width: '90px' }}>Ngày</th>
                        <th>Giờ Vào</th>
                        <th>Giờ Ra</th>
                        <th style={{ textAlign: 'center' }}>Giờ Chính</th>
                        <th style={{ textAlign: 'center' }}>Giờ Tăng Ca</th>
                        <th>Trạng Thái Đi Trễ</th>
                        <th>Ghi Chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingDetails ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                            ⏳ Đang tải chi tiết chấm công...
                          </td>
                        </tr>
                      ) : empAttendances.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                            Chưa có dữ liệu chấm công ngày nào của nhân viên trong tháng này.
                          </td>
                        </tr>
                      ) : (
                        empAttendances.map((att) => {
                          const isLate = att.is_late === 1;
                          const isPermitted = att.late_permitted === 1;

                          return (
                            <tr key={att.id || att.attendance_date}>
                              <td>
                                <strong>{formatDateVN(att.attendance_date)}</strong>
                              </td>
                              <td>{att.check_in || '--'}</td>
                              <td>{att.check_out || '--'}</td>
                              <td style={{ textAlign: 'center', fontWeight: '600' }}>
                                {att.regular_hours}h
                              </td>
                              <td style={{ textAlign: 'center', fontWeight: '600' }}>
                                {att.ot_hours > 0 ? (
                                  <span style={{ color: '#0284c7' }}>{att.ot_hours}h</span>
                                ) : (
                                  '0h'
                                )}
                              </td>
                              <td>
                                {!isLate ? (
                                  <span className="badge badge-success" style={{ fontSize: '10px' }}>
                                    Đúng giờ
                                  </span>
                                ) : isPermitted ? (
                                  <span className="badge badge-warning" style={{ fontSize: '10px' }}>
                                    Trễ có phép
                                  </span>
                                ) : (
                                  <span className="badge badge-danger" style={{ fontSize: '10px' }}>
                                    Trễ K.phép (-1/2 ngày)
                                  </span>
                                )}
                              </td>
                              <td style={{ color: '#64748b' }}>{att.note || '--'}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div
              style={{
                padding: '14px 24px',
                borderTop: '1px solid var(--border-color)',
                backgroundColor: '#f8fafc',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={handleExportEmployeeExcel}
                  disabled={exportingExcel || loadingDetails}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#107c41',
                    color: '#ffffff',
                    borderColor: '#107c41',
                    fontWeight: '600',
                    fontSize: '13px',
                    padding: '8px 18px',
                    borderRadius: '6px',
                    cursor: exportingExcel || loadingDetails ? 'not-allowed' : 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                >
                  {exportingExcel ? '⏳ Đang tạo file...' : '📊 Xuất Excel Nhật Ký Chấm Công'}
                </button>

                {exportNotice && (
                  <span style={{ fontSize: '12px', color: '#15803d', fontWeight: '600' }}>
                    {exportNotice}
                  </span>
                )}
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setSelectedEmployee(null);
                  setExportNotice(null);
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
