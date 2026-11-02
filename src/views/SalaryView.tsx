import React, { useState } from 'react';
import type { MonthlySalary } from '../types';

export const SalaryView: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState('2026-11');

  const [salaries] = useState<MonthlySalary[]>([
    {
      id: 1,
      employee_code: '1',
      employee_name: 'Nguyễn Văn An (Chính thức)',
      month_year: '2026-11',
      total_work_days: 30,
      total_regular_hours: 300,
      total_ot_hours: 15,
      regular_salary: 6000000, // 300 * 20.000
      ot_salary: 600000,      // 15 * 40.000
      late_penalty: 0,
      attendance_bonus: 700000, // Tháng thứ 3
      net_salary: 7300000,
    },
    {
      id: 2,
      employee_code: '2',
      employee_name: 'Trần Thị Bình (Chính thức)',
      month_year: '2026-11',
      total_work_days: 30,
      total_regular_hours: 300,
      total_ot_hours: 10,
      regular_salary: 6000000,
      ot_salary: 400000,
      late_penalty: 0,
      attendance_bonus: 600000, // Tháng thứ 2
      net_salary: 7000000,
    },
    {
      id: 3,
      employee_code: '3',
      employee_name: 'Lê Hoàng Cường (Chính thức)',
      month_year: '2026-11',
      total_work_days: 30,
      total_regular_hours: 295,
      total_ot_hours: 8,
      regular_salary: 5900000,
      ot_salary: 320000,
      late_penalty: 100000, // Trễ 1 lần không phép trừ 1/2 ngày (100.000đ)
      attendance_bonus: 500000,
      net_salary: 6620000,
    },
    {
      id: 4,
      employee_code: '4',
      employee_name: 'Phạm Minh Đức (Học việc)',
      month_year: '2026-11',
      total_work_days: 30,
      total_regular_hours: 300,
      total_ot_hours: 20,
      regular_salary: 4999800, // 300 * 16.666
      ot_salary: 800000,      // 20 * 40.000
      late_penalty: 0,
      attendance_bonus: 500000,
      net_salary: 6299800,
    },
    {
      id: 5,
      employee_code: '5',
      employee_name: 'Hoàng Thị Dung (Chính thức)',
      month_year: '2026-11',
      total_work_days: 30,
      total_regular_hours: 290,
      total_ot_hours: 5,
      regular_salary: 5800000,
      ot_salary: 200000,
      late_penalty: 0,
      attendance_bonus: 800000, // Tháng thứ 4
      net_salary: 6800000,
    },
    {
      id: 6,
      employee_code: '6',
      employee_name: 'Võ Quốc Em (Chính thức)',
      month_year: '2026-11',
      total_work_days: 29,
      total_regular_hours: 290,
      total_ot_hours: 0,
      regular_salary: 5800000,
      ot_salary: 0,
      late_penalty: 0,
      attendance_bonus: 0, // Nghỉ 1 ngày -> không có chuyên cần
      net_salary: 5800000,
    },
  ]);

  const totalPayroll = salaries.reduce((acc, cur) => acc + cur.net_salary, 0);

  return (
    <div>
      {/* Thẻ tổng kết chi phí lương tháng */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-icon red">💵</div>
          <div className="stat-info">
            <h3>Tổng Quỹ Lương Tháng</h3>
            <div className="stat-value" style={{ color: 'var(--primary)' }}>
              {totalPayroll.toLocaleString('vi-VN')} đ
            </div>
            <div className="stat-desc">Thực lĩnh cho {salaries.length} nhân viên</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">⏱️</div>
          <div className="stat-info">
            <h3>Tổng Giờ Làm Việc</h3>
            <div className="stat-value">
              {salaries.reduce((acc, cur) => acc + cur.total_regular_hours + cur.total_ot_hours, 0)} giờ
            </div>
            <div className="stat-desc">
              Chính: {salaries.reduce((acc, cur) => acc + cur.total_regular_hours, 0)}h | Tăng ca: {salaries.reduce((acc, cur) => acc + cur.total_ot_hours, 0)}h
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">🏆</div>
          <div className="stat-info">
            <h3>Tổng Tiền Chuyên Cần</h3>
            <div className="stat-value">
              {salaries.reduce((acc, cur) => acc + cur.attendance_bonus, 0).toLocaleString('vi-VN')} đ
            </div>
            <div className="stat-desc">
              {salaries.filter((s) => s.attendance_bonus > 0).length}/{salaries.length} nhân viên đạt chuẩn
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600' }}>Bảng Lương Tháng:</label>
            <input
              type="month"
              className="form-input"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>

          <button className="btn btn-primary btn-sm">
            🧮 Tính Lại Bảng Lương
          </button>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tên Nhân Viên</th>
                <th>Tổng Công</th>
                <th>Tổng Giờ Chính</th>
                <th>Lương Giờ Chính</th>
                <th>Tăng Ca (OT)</th>
                <th>Lương Tăng Ca</th>
                <th>Phạt Trễ (K.Phép)</th>
                <th>Chuyên Cần</th>
                <th style={{ backgroundColor: '#fdf2f8', color: 'var(--primary)' }}>Thực Lĩnh</th>
              </tr>
            </thead>
            <tbody>
              {salaries.map((s) => (
                <tr key={s.id}>
                  <td><strong>#{s.employee_code}</strong></td>
                  <td style={{ fontWeight: '600' }}>{s.employee_name}</td>
                  <td>{s.total_work_days} ngày</td>
                  <td>{s.total_regular_hours}h</td>
                  <td>{s.regular_salary.toLocaleString('vi-VN')} đ</td>
                  <td>{s.total_ot_hours > 0 ? `${s.total_ot_hours}h` : '0h'}</td>
                  <td>{s.ot_salary.toLocaleString('vi-VN')} đ</td>
                  <td>
                    {s.late_penalty > 0 ? (
                      <span style={{ color: '#b91c1c', fontWeight: '600' }}>
                        -{s.late_penalty.toLocaleString('vi-VN')} đ
                      </span>
                    ) : (
                      '0 đ'
                    )}
                  </td>
                  <td>
                    <span style={{ color: s.attendance_bonus > 0 ? '#15803d' : '#64748b', fontWeight: '600' }}>
                      +{s.attendance_bonus.toLocaleString('vi-VN')} đ
                    </span>
                  </td>
                  <td style={{ backgroundColor: '#fdf2f8' }}>
                    <strong style={{ fontSize: '15px', color: 'var(--primary)' }}>
                      {s.net_salary.toLocaleString('vi-VN')} đ
                    </strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
