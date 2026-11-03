import React, { useState, useEffect } from 'react';
import type { AttendanceRecord, RawAttendanceRecord, Employee } from '../types';

export const AttendanceView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'summary' | 'raw'>('summary');

  // State cho Bảng tổng hợp
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // State cho Bảng dữ liệu thô (Raw punches)
  const [rawRecords, setRawRecords] = useState<RawAttendanceRecord[]>([]);
  const [loadingRaw, setLoadingRaw] = useState(false);
  const [rawDateFilter, setRawDateFilter] = useState('');
  const [rawEmpFilter, setRawEmpFilter] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Tải danh sách nhân viên để lọc
  useEffect(() => {
    if (window.electronAPI?.getEmployees) {
      window.electronAPI.getEmployees().then((res) => {
        setEmployees(res || []);
      });
    }
  }, []);

  const loadAttendances = async (dateStr: string) => {
    if (window.electronAPI?.getAttendances) {
      setLoading(true);
      try {
        const list = await window.electronAPI.getAttendances(dateStr);
        setRecords(list || []);
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
      loadAttendances(selectedDate);
    } else {
      loadRawAttendances();
    }
  }, [activeTab, selectedDate, rawDateFilter, rawEmpFilter]);

  const handleToday = () => {
    const today = new Date().toISOString().slice(0, 10);
    setSelectedDate(today);
  };

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
          <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>Chọn tháng:</label>
              <input
                type="date"
                className="form-input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary btn-sm" onClick={handleToday}>
                Hôm Nay
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => loadAttendances(selectedDate)}
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
                  <th>Giờ Vào</th>
                  <th>Giờ Ra</th>
                  <th>Giờ Làm Chính (7h-17h)</th>
                  <th>Tăng Ca (OT)</th>
                  <th>Tình Trạng Đi Trễ</th>
                  <th>Nghỉ Phép</th>
                  <th>Ghi Chú</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      Không có dữ liệu chấm công nào trong ngày <strong>{selectedDate}</strong>.
                      <br />
                      <span style={{ fontSize: '12px' }}>
                        Vui lòng chọn ngày khác hoặc vào mục <strong>"Nhập công từ excel"</strong> để nạp dữ liệu từ máy chấm công.
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
