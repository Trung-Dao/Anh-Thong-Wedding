import React, { useState, useEffect } from 'react';
import type { MonthlySalary } from '../types';

export const SalaryView: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return new Date().toISOString().slice(0, 7);
  });
  const [salaries, setSalaries] = useState<MonthlySalary[]>([]);
  const [loading, setLoading] = useState(false);

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

  const totalPayroll = salaries.reduce((acc, cur) => acc + (cur.net_salary || 0), 0);
  const totalRegularHours = salaries.reduce((acc, cur) => acc + (cur.total_regular_hours || 0), 0);
  const totalOtHours = salaries.reduce((acc, cur) => acc + (cur.total_ot_hours || 0), 0);
  const totalBonus = salaries.reduce((acc, cur) => acc + (cur.attendance_bonus || 0), 0);
  const totalLatePenalty = salaries.reduce((acc, cur) => acc + (cur.late_penalty || 0), 0);

  return (
    <div>
      {/* 3 Thẻ thống kê chi phí quỹ lương */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-icon red">💵</div>
          <div className="stat-info">
            <h3>Tổng Quỹ Lương Thực Lĩnh</h3>
            <div className="stat-value" style={{ color: 'var(--primary)' }}>
              {totalPayroll.toLocaleString('vi-VN')} đ
            </div>
            <div className="stat-desc">
              Chi trả cho {salaries.length} nhân viên (Tháng {selectedMonth})
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">⏱️</div>
          <div className="stat-info">
            <h3>Tổng Giờ Làm Việc</h3>
            <div className="stat-value">
              {totalRegularHours + totalOtHours} giờ
            </div>
            <div className="stat-desc">
              Chính: {totalRegularHours}h | Tăng ca: {totalOtHours}h
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">🏆</div>
          <div className="stat-info">
            <h3>Tổng Tiền Chuyên Cần</h3>
            <div className="stat-value">
              {totalBonus.toLocaleString('vi-VN')} đ
            </div>
            <div className="stat-desc">
              Phạt trễ không phép: -{totalLatePenalty.toLocaleString('vi-VN')} đ
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

          <button
            className="btn btn-primary btn-sm"
            onClick={() => loadSalaries(selectedMonth)}
            disabled={loading}
          >
            {loading ? 'Đang tính toán...' : '🧮 Tính Lại Bảng Lương'}
          </button>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '70px' }}>Mã NV</th>
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
              {salaries.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    Chưa có nhân viên hoặc dữ liệu chấm công cho tháng <strong>{selectedMonth}</strong>.
                    <br />
                    <span style={{ fontSize: '12px' }}>
                      Vui lòng nhập file Excel từ máy chấm công để hệ thống tự động tổng hợp bảng lương.
                    </span>
                  </td>
                </tr>
              ) : (
                salaries.map((s) => (
                  <tr key={s.id || s.employee_code}>
                    <td>
                      <strong style={{ color: 'var(--primary)' }}>#{s.employee_code}</strong>
                    </td>
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
                      <span
                        style={{
                          color: s.attendance_bonus > 0 ? '#15803d' : '#64748b',
                          fontWeight: '600',
                        }}
                      >
                        +{s.attendance_bonus.toLocaleString('vi-VN')} đ
                      </span>
                    </td>
                    <td style={{ backgroundColor: '#fdf2f8' }}>
                      <strong style={{ fontSize: '15px', color: 'var(--primary)' }}>
                        {s.net_salary.toLocaleString('vi-VN')} đ
                      </strong>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
