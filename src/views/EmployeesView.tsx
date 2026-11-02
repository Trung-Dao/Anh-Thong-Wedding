import React, { useState } from 'react';
import type { Employee } from '../types';

export const EmployeesView: React.FC = () => {
  // Dữ liệu mẫu khởi đầu theo schema
  const [employees] = useState<Employee[]>([
    {
      id: 1,
      code: '1',
      name: 'Nguyễn Văn An',
      employee_type: 'official',
      hourly_salary: 20000,
      ot_hourly_salary: 40000,
      start_date: '2024-01-01',
      status: 'active',
    },
    {
      id: 2,
      code: '2',
      name: 'Trần Thị Bình',
      employee_type: 'official',
      hourly_salary: 20000,
      ot_hourly_salary: 40000,
      start_date: '2024-02-15',
      status: 'active',
    },
    {
      id: 3,
      code: '3',
      name: 'Lê Hoàng Cường',
      employee_type: 'official',
      hourly_salary: 20000,
      ot_hourly_salary: 40000,
      start_date: '2024-03-01',
      status: 'active',
    },
    {
      id: 4,
      code: '4',
      name: 'Phạm Minh Đức',
      employee_type: 'probation',
      hourly_salary: 16666,
      ot_hourly_salary: 40000,
      start_date: '2024-10-01',
      status: 'active',
    },
    {
      id: 5,
      code: '5',
      name: 'Hoàng Thị Dung',
      employee_type: 'official',
      hourly_salary: 20000,
      ot_hourly_salary: 40000,
      start_date: '2024-04-10',
      status: 'active',
    },
    {
      id: 6,
      code: '6',
      name: 'Võ Quốc Em',
      employee_type: 'official',
      hourly_salary: 20000,
      ot_hourly_salary: 40000,
      start_date: '2024-05-20',
      status: 'active',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filtered = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.code.includes(searchTerm);
    const matchesType =
      filterType === 'all' || emp.employee_type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="card">
      <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="🔍 Tìm theo mã hoặc tên NV..."
            className="form-input"
            style={{ width: '260px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="form-input"
            style={{ width: '160px' }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">Tất cả loại NV</option>
            <option value="official">Chính thức (20k/h)</option>
            <option value="probation">Học việc (16.666k/h)</option>
          </select>
        </div>

        <button className="btn btn-primary">
          <span>+</span> Thêm Nhân Viên Mới
        </button>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>Mã</th>
              <th>Tên Nhân Viên</th>
              <th>Loại Nhân Viên</th>
              <th>Lương Giờ Chính</th>
              <th>Lương Ngày</th>
              <th>Lương Tăng Ca</th>
              <th>Ngày Vào Làm</th>
              <th>Trạng Thái</th>
              <th style={{ textAlign: 'center', width: '120px' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp) => (
              <tr key={emp.id}>
                <td>
                  <strong style={{ color: 'var(--primary)' }}>#{emp.code}</strong>
                </td>
                <td style={{ fontWeight: '600' }}>{emp.name}</td>
                <td>
                  {emp.employee_type === 'official' ? (
                    <span className="badge badge-success">Chính thức</span>
                  ) : (
                    <span className="badge badge-warning">Học việc</span>
                  )}
                </td>
                <td>{emp.hourly_salary.toLocaleString('vi-VN')} đ/h</td>
                <td>
                  {emp.employee_type === 'official'
                    ? '200.000 đ'
                    : '166.660 đ'}
                </td>
                <td>{emp.ot_hourly_salary.toLocaleString('vi-VN')} đ/h</td>
                <td>{emp.start_date}</td>
                <td>
                  {emp.status === 'active' ? (
                    <span className="badge badge-info">Đang làm</span>
                  ) : (
                    <span className="badge badge-neutral">Đã nghỉ</span>
                  )}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ marginRight: '6px' }}
                  >
                    Sửa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
