import React, { useState } from 'react';

interface BonusRow {
  employee_code: string;
  employee_name: string;
  total_month_days: number;
  attended_days: number;
  leave_days: number;
  consecutive_months: number;
  bonus_amount: number;
  status: 'eligible' | 'not_eligible';
  reason: string;
}

export const AttendanceBonusView: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState('2026-11');

  const [data] = useState<BonusRow[]>([
    {
      employee_code: '1',
      employee_name: 'Nguyễn Văn An',
      total_month_days: 30,
      attended_days: 30,
      leave_days: 0,
      consecutive_months: 3,
      bonus_amount: 700000,
      status: 'eligible',
      reason: 'Đạt tháng thứ 3 liên tục (500k + 200k)',
    },
    {
      employee_code: '2',
      employee_name: 'Trần Thị Bình',
      total_month_days: 30,
      attended_days: 30,
      leave_days: 0,
      consecutive_months: 2,
      bonus_amount: 600000,
      status: 'eligible',
      reason: 'Đạt tháng thứ 2 liên tục (500k + 100k)',
    },
    {
      employee_code: '3',
      employee_name: 'Lê Hoàng Cường',
      total_month_days: 30,
      attended_days: 30,
      leave_days: 0,
      consecutive_months: 1,
      bonus_amount: 500000,
      status: 'eligible',
      reason: 'Đạt tháng đầu tiên (Có trễ nhưng vẫn đi làm đủ)',
    },
    {
      employee_code: '4',
      employee_name: 'Phạm Minh Đức',
      total_month_days: 30,
      attended_days: 30,
      leave_days: 0,
      consecutive_months: 1,
      bonus_amount: 500000,
      status: 'eligible',
      reason: 'Nhân viên mới, làm đủ trọn vẹn 30 ngày',
    },
    {
      employee_code: '5',
      employee_name: 'Hoàng Thị Dung',
      total_month_days: 30,
      attended_days: 30,
      leave_days: 0,
      consecutive_months: 4,
      bonus_amount: 800000,
      status: 'eligible',
      reason: 'Đạt tháng thứ 4 liên tục',
    },
    {
      employee_code: '6',
      employee_name: 'Võ Quốc Em',
      total_month_days: 30,
      attended_days: 29,
      leave_days: 1,
      consecutive_months: 0,
      bonus_amount: 0,
      status: 'not_eligible',
      reason: 'Có nghỉ 1 ngày trong tháng (Reset về 500k tháng sau)',
    },
  ]);

  return (
    <div className="card">
      <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600' }}>Chọn Tháng:</label>
          <input
            type="month"
            className="form-input"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        </div>

        <button className="btn btn-primary btn-sm">
          🔄 Tính Toán Lại Chuyên Cần
        </button>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Tên Nhân Viên</th>
              <th>Số Ngày Trong Tháng</th>
              <th>Ngày Đi Làm</th>
              <th>Số Ngày Nghỉ</th>
              <th>Chuỗi Tháng Đạt</th>
              <th>Thưởng Chuyên Cần</th>
              <th>Trạng Thái</th>
              <th>Chi Tiết</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.employee_code}>
                <td><strong>#{row.employee_code}</strong></td>
                <td style={{ fontWeight: '600' }}>{row.employee_name}</td>
                <td>{row.total_month_days} ngày</td>
                <td><strong style={{ color: '#15803d' }}>{row.attended_days}</strong></td>
                <td>
                  {row.leave_days > 0 ? (
                    <strong style={{ color: '#b91c1c' }}>{row.leave_days}</strong>
                  ) : (
                    '0'
                  )}
                </td>
                <td>
                  {row.consecutive_months > 0 ? (
                    <span className="badge badge-success">Tháng thứ {row.consecutive_months}</span>
                  ) : (
                    <span className="badge badge-neutral">0 tháng</span>
                  )}
                </td>
                <td>
                  <strong style={{ fontSize: '14px', color: row.bonus_amount > 0 ? 'var(--primary)' : '#64748b' }}>
                    {row.bonus_amount.toLocaleString('vi-VN')} đ
                  </strong>
                </td>
                <td>
                  {row.status === 'eligible' ? (
                    <span className="badge badge-success">Đạt thưởng</span>
                  ) : (
                    <span className="badge badge-danger">Không đạt</span>
                  )}
                </td>
                <td style={{ fontSize: '12px', color: '#64748b' }}>{row.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ padding: '16px 20px', backgroundColor: '#f8fafc', borderTop: '1px solid var(--border-color)', fontSize: '13px', color: '#475569' }}>
        📌 <strong>Quy tắc thưởng chuyên cần:</strong>
        <ul style={{ margin: '6px 0 0 20px', lineHeight: '1.6' }}>
          <li>Điều kiện: Không nghỉ ngày nào trong tháng (kể cả nghỉ có phép hay không phép). Đi trễ vẫn tính là có đi làm.</li>
          <li>Mức thưởng: Tháng đầu tiên đạt thưởng <strong>500.000đ</strong>. Mỗi tháng kế tiếp tiếp tục không nghỉ cộng thêm <strong>+100.000đ</strong> (600k, 700k,... không giới hạn tối đa).</li>
          <li>Nếu trong tháng có nghỉ bất kỳ ngày nào: Mất thưởng tháng đó và reset mức thưởng về <strong>500.000đ</strong> cho tháng sau.</li>
        </ul>
      </div>
    </div>
  );
};

