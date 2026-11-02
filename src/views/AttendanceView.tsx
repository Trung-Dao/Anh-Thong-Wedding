import React, { useState } from 'react';
import type { AttendanceRecord } from '../types';

export const AttendanceView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState('2026-11-02');
  
  // Dữ liệu mẫu minh họa quy tắc chấm công
  const [records] = useState<AttendanceRecord[]>([
    {
      id: 1,
      employee_code: '1',
      employee_name: 'Nguyễn Văn An',
      attendance_date: '2026-11-02',
      check_in: '06:58',
      check_out: '17:18',
      regular_hours: 10,
      ot_hours: 0, // Trước 7h chưa đủ 1 tiếng, sau 17h chưa đủ 1 tiếng
      is_late: 0,
      late_permitted: 0,
      is_leave: 0,
      leave_permitted: 0,
      note: 'Đúng giờ',
    },
    {
      id: 2,
      employee_code: '2',
      employee_name: 'Trần Thị Bình',
      attendance_date: '2026-11-02',
      check_in: '07:14',
      check_out: '17:00',
      regular_hours: 10, // 7:14 vào <= 7:15, đủ 9h46 -> làm tròn 10h
      ot_hours: 0,
      is_late: 0,
      late_permitted: 0,
      is_leave: 0,
      leave_permitted: 0,
      note: 'Đến trong 15p cho phép (làm tròn 10h)',
    },
    {
      id: 3,
      employee_code: '3',
      employee_name: 'Lê Hoàng Cường',
      attendance_date: '2026-11-02',
      check_in: '07:35',
      check_out: '17:00',
      regular_hours: 9,
      ot_hours: 0,
      is_late: 1,
      late_permitted: 0, // Không phép -> bị trừ 1/2 ngày
      is_leave: 0,
      leave_permitted: 0,
      note: 'Trễ không phép (Trừ 1/2 ngày)',
    },
    {
      id: 4,
      employee_code: '4',
      employee_name: 'Phạm Minh Đức',
      attendance_date: '2026-11-02',
      check_in: '07:00',
      check_out: '19:15',
      regular_hours: 10,
      ot_hours: 2, // 17:00 đến 19:15 -> lấy 2 giờ ngoài giờ
      is_late: 0,
      late_permitted: 0,
      is_leave: 0,
      leave_permitted: 0,
      note: 'Tăng ca 2 giờ tối',
    },
    {
      id: 5,
      employee_code: '5',
      employee_name: 'Hoàng Thị Dung',
      attendance_date: '2026-11-02',
      check_in: '07:05',
      check_out: '15:00', // Về sớm trước 17:00 -> 8 tiếng
      regular_hours: 8,
      ot_hours: 0,
      is_late: 0,
      late_permitted: 0,
      is_leave: 0,
      leave_permitted: 0,
      note: 'Về sớm 15:00 (Tính 8h)',
    },
    {
      id: 6,
      employee_code: '6',
      employee_name: 'Võ Quốc Em',
      attendance_date: '2026-11-02',
      check_in: null,
      check_out: null,
      regular_hours: 0,
      ot_hours: 0,
      is_late: 0,
      late_permitted: 0,
      is_leave: 1,
      leave_permitted: 1,
      note: 'Nghỉ có phép',
    },
  ]);

  return (
    <div className="card">
      <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600' }}>Chọn Ngày:</label>
          <input
            type="date"
            className="form-input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm">Hôm Nay</button>
          <button className="btn btn-primary btn-sm">Làm Mới Dữ Liệu</button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Họ Và Tên</th>
              <th>Giờ Vào</th>
              <th>Giờ Ra</th>
              <th>Giờ Chính (7h-17h)</th>
              <th>Tăng Ca (OT)</th>
              <th>Tình Trạng Đi Trễ</th>
              <th>Nghỉ Phép</th>
              <th>Ghi Chú</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td><strong>#{r.employee_code}</strong></td>
                <td style={{ fontWeight: '600' }}>{r.employee_name}</td>
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
                <td style={{ fontSize: '12px', color: '#64748b' }}>{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
