import React, { useState, useEffect } from 'react';
import type { AttendanceRecord } from '../types';

export const AttendanceView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    loadAttendances(selectedDate);
  }, [selectedDate]);

  const handleToday = () => {
    const today = new Date().toISOString().slice(0, 10);
    setSelectedDate(today);
  };

  return (
    <div className="card">
      <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600' }}>Chọn Ngày Xem:</label>
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
  );
};
