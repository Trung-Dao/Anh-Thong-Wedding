import React, { useState, useEffect } from 'react';
import type { AttendanceRecord, RawAttendanceRecord, Employee } from '../types';

export const AttendanceView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'summary' | 'raw'>('summary');

  // State cho Bảng tổng hợp (mặc định rỗng = xem tất cả)
  const [selectedMonth, setSelectedMonth] = useState('');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // State cho Bảng dữ liệu thô (Raw punches)
  const [rawRecords, setRawRecords] = useState<RawAttendanceRecord[]>([]);
  const [loadingRaw, setLoadingRaw] = useState(false);
  const [rawDateFilter, setRawDateFilter] = useState('');
  const [rawEmpFilter, setRawEmpFilter] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);

  const currentMonth = new Date().toISOString().slice(0, 7);

  const formatDateVN = (dateStr?: string) => {
    if (!dateStr) return '--';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Tải danh sách nhân viên để lọc
  useEffect(() => {
    if (window.electronAPI?.getEmployees) {
      window.electronAPI.getEmployees().then((res) => {
        setEmployees(res || []);
      });
    }
  }, []);

  const loadAttendances = async (monthStr: string) => {
    if (window.electronAPI?.getAttendances) {
      setLoading(true);
      try {
        const list = await window.electronAPI.getAttendances(monthStr);
        // Sắp xếp giảm dần theo attendance_date, sau đó theo mã nhân viên tăng dần
        const sorted = (list || []).slice().sort((a, b) => {
          if (b.attendance_date !== a.attendance_date) {
            return b.attendance_date.localeCompare(a.attendance_date);
          }
          return Number(a.employee_code) - Number(b.employee_code);
        });
        setRecords(sorted);
      } catch (err) {
        console.error('Lỗi khi lấy dữ liệu chấm công:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const loadRawAttendances = async () => {
    if (window.electronAPI?.getRawAttendances) {
      setLoadingRaw(true);
      try {
        const list = await window.electronAPI.getRawAttendances({
          date: rawDateFilter || undefined,
          employee_code: rawEmpFilter || undefined,
        });
        setRawRecords(list || []);
      } catch (err) {
        console.error('Lỗi khi lấy dữ liệu thô chấm công:', err);
      } finally {
        setLoadingRaw(false);
      }
    }
  };

  useEffect(() => {
    if (activeTab === 'summary') {
      loadAttendances(selectedMonth);
    } else {
      loadRawAttendances();
    }
  }, [activeTab, selectedMonth, rawDateFilter, rawEmpFilter]);

  return (
    <div>
      {/* THANH CHUYỂN TAB: TỔNG HỢP / DỮ LIỆU THÔ */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px',
        }}
      >
        <button
          className={`btn ${activeTab === 'summary' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('summary')}
          style={{ padding: '8px 16px', fontWeight: '600' }}
        >
          📊 Bảng Chấm Công Tổng Hợp
        </button>
        <button
          className={`btn ${activeTab === 'raw' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('raw')}
          style={{ padding: '8px 16px', fontWeight: '600' }}
        >
          📋 Dữ Liệu Thô Máy Chấm Công từ Excel
        </button>
      </div>

      {activeTab === 'summary' ? (
        /* ================= 1. TAB BẢNG TỔNG HỢP THEO THÁNG ================= */
        <div className="card">
          <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>Lọc Theo Tháng:</label>
              <input
                type="month"
                className="form-input"
                style={{ width: '160px' }}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
              <button
                className={`btn btn-sm ${!selectedMonth ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedMonth('')}
                title="Xem tất cả các tháng"
              >
                Xem Tất Cả
              </button>
              <button
                className={`btn btn-sm ${selectedMonth === currentMonth ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedMonth(currentMonth)}
                title="Xem dữ liệu tháng hiện tại"
              >
                Tháng Này
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge badge-info" style={{ fontSize: '13px', padding: '6px 12px' }}>
                Tổng: {records.length} bản ghi {selectedMonth ? `(Tháng ${selectedMonth})` : '(Tất cả)'}
              </span>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => loadAttendances(selectedMonth)}
                disabled={loading}
              >
                {loading ? 'Đang tải...' : '🔄 Làm Mới Dữ Liệu'}
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '70px' }}>Mã NV</th>
                  <th>Họ Và Tên</th>
                  <th>Ngày</th>
                  <th>Giờ Vào</th>
                  <th>Giờ Ra</th>
                  <th>Giờ Làm Chính (7h-17h)</th>
                  <th>Tăng Ca</th>
                  <th>Tình Trạng Đi Trễ</th>
                  <th>Nghỉ Phép</th>
                  <th>Ghi Chú</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      {loading
                        ? 'Đang tải dữ liệu...'
                        : selectedMonth
                        ? (
                          <>
                            Không có dữ liệu chấm công nào trong tháng <strong>{selectedMonth}</strong>.
                          </>
                        )
                        : 'Không có dữ liệu chấm công nào trong hệ thống.'}
                      <br />
                      <span style={{ fontSize: '12px' }}>
                        Vui lòng chọn tháng khác hoặc vào mục <strong>"Nhập công từ excel"</strong> để nạp dữ liệu từ máy chấm công.
                      </span>
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id || `${r.employee_code}-${r.attendance_date}`}>
                      <td>
                        <strong style={{ color: 'var(--primary)' }}>#{r.employee_code}</strong>
                      </td>
                      <td style={{ fontWeight: '600' }}>
                        {r.employee_name || `Nhân viên ${r.employee_code}`}
                      </td>
                      <td>
                        <strong style={{ color: '#0f172a' }}>{formatDateVN(r.attendance_date)}</strong>
                      </td>
                      <td>{r.check_in || '--:--'}</td>
                      <td>{r.check_out || '--:--'}</td>
                      <td>
                        <strong style={{ color: 'var(--secondary)' }}>{r.regular_hours} giờ</strong>
                      </td>
                      <td>
                        {r.ot_hours > 0 ? (
                          <span className="badge badge-success">+{r.ot_hours} giờ</span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>0</span>
                        )}
                      </td>
                      <td>
                        {r.is_late === 1 ? (
                          r.late_permitted === 1 ? (
                            <span className="badge badge-warning">Trễ có phép</span>
                          ) : (
                            <span className="badge badge-danger">Trễ không phép (Trừ 1/2 ngày)</span>
                          )
                        ) : (
                          <span className="badge badge-neutral">Đúng giờ</span>
                        )}
                      </td>
                      <td>
                        {r.is_leave === 1 ? (
                          r.leave_permitted === 1 ? (
                            <span className="badge badge-info">Nghỉ có phép</span>
                          ) : (
                            <span className="badge badge-danger">Nghỉ không phép</span>
                          )
                        ) : (
                          <span className="badge badge-success">Có đi làm</span>
                        )}
                      </td>
                      <td style={{ fontSize: '12px', color: '#64748b' }}>{r.note || '--'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ================= 2. TAB DỮ LIỆU THÔ MÁY CHẤM CÔNG ================= */
        <div className="card">
          <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600' }}>Lọc Ngày:</label>
                <input
                  type="date"
                  className="form-input"
                  style={{ width: '160px' }}
                  value={rawDateFilter}
                  onChange={(e) => setRawDateFilter(e.target.value)}
                />
                {rawDateFilter && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setRawDateFilter('')}
                    title="Xem tất cả các ngày"
                  >
                    Tất cả ngày
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600' }}>Nhân Viên:</label>
                <select
                  className="form-input"
                  style={{ width: '180px' }}
                  value={rawEmpFilter}
                  onChange={(e) => setRawEmpFilter(e.target.value)}
                >
                  <option value="">-- Tất cả nhân viên --</option>
                  {employees.map((e) => (
                    <option key={e.code} value={e.code}>
                      #{e.code} - {e.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge badge-info" style={{ fontSize: '13px', padding: '6px 12px' }}>
                Tổng: {rawRecords.length} lượt quẹt thực tế
              </span>
              <button
                className="btn btn-primary btn-sm"
                onClick={loadRawAttendances}
                disabled={loadingRaw}
              >
                {loadingRaw ? 'Đang tải...' : '🔄 Làm Mới'}
              </button>
            </div>
          </div>

          <div style={{ padding: '8px 16px', backgroundColor: '#f8fafc', fontSize: '12px', color: '#64748b' }}>
            💡 <strong>Dữ liệu thô nguyên bản:</strong> Lưu trữ toàn bộ 100% dòng dữ liệu từ file Excel máy chấm công xuất ra (bao gồm cả mã máy, kiểu chấm, giá trị gốc số thực). Tự động kiểm tra và ngăn chặn việc nạp trùng lặp.
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>STT</th>
                  <th style={{ width: '70px' }}>Mã NV</th>
                  <th>Tên Nhân Viên</th>
                  <th>Ngày</th>
                  {/* <th>Ngày Gốc Excel</th> */}
                  <th>Giờ</th>
                  {/* <th>Giờ Gốc Excel</th> */}
                  <th>Kiểu Chấm</th>
                  <th>Nguồn</th>
                  <th>Mã Số Máy</th>
                  <th>Tên Máy</th>
                </tr>
              </thead>
              <tbody>
                {rawRecords.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      {loadingRaw ? 'Đang tải dữ liệu...' : 'Không có bản ghi quẹt thẻ nào phù hợp với bộ lọc.'}
                    </td>
                  </tr>
                ) : (
                  rawRecords.map((r, idx) => (
                    <tr key={r.id || idx}>
                      <td style={{ color: '#94a3b8' }}>{idx + 1}</td>
                      <td>
                        <strong style={{ color: 'var(--primary)' }}>#{r.employee_code}</strong>
                      </td>
                      <td style={{ fontWeight: '600' }}>
                        {r.employee_name || `Nhân viên ${r.employee_code}`}
                      </td>
                      <td>
                        <strong>{r.date_formatted}</strong>
                      </td>
                      {/* <td style={{ color: '#64748b', fontSize: '12px' }}>{r.date_raw || '--'}</td> */}
                      <td>
                        <span className="badge badge-neutral" style={{ fontWeight: '600' }}>
                          {r.time_formatted}
                        </span>
                      </td>
                      {/* <td style={{ color: '#64748b', fontSize: '12px' }}>{r.time_raw || '--'}</td> */}
                      <td>{r.punch_type ?? '--'}</td>
                      <td>{r.punch_source ?? '--'}</td>
                      <td>{r.machine_number ?? '--'}</td>
                      <td>{r.machine_name || '--'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
