import React, { useState, useEffect } from 'react';
import type { AttendanceRecord, Employee } from '../types';

export const LeaveApprovalView: React.FC = () => {
  const [items, setItems] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedEmpCode, setSelectedEmpCode] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  // Tải danh sách nhân viên cho dropdown
  useEffect(() => {
    if (window.electronAPI?.getEmployees) {
      window.electronAPI.getEmployees().then((res) => {
        setEmployees(res || []);
      });
    }
  }, []);

  // Tải danh sách duyệt đi trễ theo tháng và nhân viên
  const loadRequests = async () => {
    if (window.electronAPI?.getLeaveRequests) {
      setLoading(true);
      try {
        const list = await window.electronAPI.getLeaveRequests({
          month: selectedMonth || undefined,
          employee_code: selectedEmpCode !== 'all' ? selectedEmpCode : undefined,
        });
        setItems(list || []);
      } catch (err) {
        console.error('Lỗi tải danh sách duyệt đi trễ:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadRequests();
  }, [selectedMonth, selectedEmpCode]);

  const handleApprove = async (record: AttendanceRecord, permitted: boolean) => {
    if (!record.id) return;
    if (window.electronAPI?.updateAttendanceStatus) {
      try {
        await window.electronAPI.updateAttendanceStatus({
          id: record.id,
          late_permitted: permitted ? 1 : 0,
        });
        loadRequests();
      } catch (err: any) {
        alert(`Lỗi phê duyệt: ${err.message}`);
      }
    }
  };

  return (
    <div className="card">
      <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <span className="card-title">📝 Danh Sách Duyệt Đi Trễ Giờ</span>

          {/* Bộ lọc theo Tháng/Năm */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600' }}>Tháng:</label>
            <input
              type="month"
              className="form-input"
              style={{ width: '150px', padding: '5px 10px' }}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
            {selectedMonth && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedMonth('')}
                style={{ fontSize: '11px', padding: '3px 8px' }}
              >
                Tất cả
              </button>
            )}
          </div>

          {/* Bộ lọc theo Nhân viên */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600' }}>Nhân viên:</label>
            <select
              className="form-input"
              style={{ width: '180px', padding: '5px 10px' }}
              value={selectedEmpCode}
              onChange={(e) => setSelectedEmpCode(e.target.value)}
            >
              <option value="all">Tất cả nhân viên</option>
              {employees.map((emp) => (
                <option key={emp.code} value={emp.code}>
                  #{emp.code} - {emp.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* <button className="btn btn-secondary btn-sm" onClick={loadRequests} disabled={loading}>
          {loading ? 'Đang tải...' : '🔄 Làm Mới'}
        </button> */}
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '70px' }}>Mã NV</th>
              <th>Họ Và Tên</th>
              <th>Ngày Chấm Công</th>
              <th>Giờ Vào - Ra</th>
              <th>Tình Trạng</th>
              <th>Ghi Chú</th>
              <th style={{ textAlign: 'center', width: '220px' }}>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  Đang tải danh sách đi trễ...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  Hiện tại không có trường hợp đi trễ nào phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const isPermitted = item.late_permitted === 1;

                return (
                  <tr key={item.id}>
                    <td>
                      <strong style={{ color: 'var(--primary)' }}>#{item.employee_code}</strong>
                    </td>
                    <td style={{ fontWeight: '600' }}>
                      {item.employee_name || `Nhân viên ${item.employee_code}`}
                    </td>
                    <td>{item.attendance_date}</td>
                    <td>
                      {item.check_in || '--:--'} → {item.check_out || '--:--'}
                    </td>
                    <td>
                      {isPermitted ? (
                        <span className="badge badge-warning">Trễ có phép</span>
                      ) : (
                        <span className="badge badge-danger">Trễ không phép</span>
                      )}
                    </td>
                    <td style={{ fontSize: '12px', color: '#64748b' }}>
                      {item.note || '--'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        {isPermitted ? (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{
                              color: '#b91c1c',
                              fontSize: '11px',
                              padding: '4px 8px',
                            }}
                            onClick={() => handleApprove(item, false)}
                          >
                            ✕ Không Phép
                          </button>
                        ) : (
                          <button
                            className="btn btn-primary btn-sm"
                            style={{
                              backgroundColor: '#15803d',
                              fontSize: '11px',
                              padding: '4px 8px',
                            }}
                            onClick={() => handleApprove(item, true)}
                          >
                            ✓ Duyệt Có Phép
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div
        style={{
          padding: '16px 20px',
          backgroundColor: '#f8fafc',
          borderTop: '1px solid var(--border-color)',
          fontSize: '13px',
          color: '#475569',
        }}
      >
        💡 <strong>Quy định phê duyệt đi trễ:</strong>
        <ul style={{ margin: '6px 0 0 20px', lineHeight: '1.6' }}>
          <li>
            <strong>Duyệt Có Phép:</strong> Đi trễ bao nhiêu giờ thì tính lương bấy nhiêu giờ thực tế đã làm việc.
          </li>
          <li>
            <strong>Không Phép:</strong> Bị phạt trừ <strong>1/2 ngày lương chính</strong> (100.000đ đối với nhân viên chính thức, 83.330đ đối với học việc).
          </li>
        </ul>
      </div>
    </div>
  );
};
