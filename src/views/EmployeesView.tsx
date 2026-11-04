import React, { useState, useEffect } from 'react';
import type { Employee, EmployeeType, EmployeeStatus } from '../types';

export const EmployeesView: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Trạng thái modal thêm/sửa nhân viên
  const [editingEmp, setEditingEmp] = useState<Partial<Employee> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadEmployees = async () => {
    if (window.electronAPI?.getEmployees) {
      setLoading(true);
      try {
        const list = await window.electronAPI.getEmployees();
        setEmployees(list || []);
      } catch (err) {
        console.error('Lỗi khi tải danh sách nhân viên:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleOpenAdd = () => {
    setEditingEmp({
      code: '',
      name: '',
      employee_type: 'official',
      hourly_salary: 20000,
      ot_hourly_salary: 40000,
      start_date: new Date().toISOString().slice(0, 10),
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmp({ ...emp });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp || !editingEmp.code || !editingEmp.name) {
      alert('Vui lòng nhập đầy đủ Mã và Tên nhân viên!');
      return;
    }

    if (window.electronAPI?.saveEmployee) {
      try {
        await window.electronAPI.saveEmployee(editingEmp);
        setIsModalOpen(false);
        setEditingEmp(null);
        loadEmployees();
      } catch (err: any) {
        alert(`Lỗi khi lưu nhân viên: ${err.message}`);
      }
    }
  };

  const handleDelete = async (emp: Employee) => {
    if (!emp.id) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa nhân viên "${emp.name}" (Mã: ${emp.code})?`)) {
      if (window.electronAPI?.deleteEmployee) {
        try {
          await window.electronAPI.deleteEmployee(emp.id);
          loadEmployees();
        } catch (err: any) {
          alert(`Lỗi khi xóa nhân viên: ${err.message}`);
        }
      }
    }
  };

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
            style={{ width: '180px' }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">Tất cả nhân viên</option>
            <option value="official">NV Chính thức</option>
            <option value="probation">NV Học việc</option>
          </select>

          {/* <button className="btn btn-secondary btn-sm" onClick={loadEmployees} disabled={loading}>
            {loading ? 'Đang tải...' : '🔄 Làm Mới'}
          </button> */}
        </div>

        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <span>+</span> Thêm Nhân Viên Mới
        </button>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '70px' }}>Mã NV</th>
              <th>Họ Và Tên</th>
              <th>Loại Nhân Viên</th>
              <th>Lương Giờ Chính</th>
              <th>Lương Ngày</th>
              <th>Lương Tăng Ca</th>
              <th>Ngày Vào Làm</th>
              <th>Trạng Thái</th>
              <th style={{ textAlign: 'center', width: '130px' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  {employees.length === 0
                    ? 'Chưa có nhân viên nào trong CSDL. Hãy nhập file Excel từ máy chấm công hoặc bấm "Thêm Nhân Viên Mới" ở trên.'
                    : 'Không tìm thấy nhân viên nào khớp với bộ lọc tìm kiếm.'}
                </td>
              </tr>
            ) : (
              filtered.map((emp) => (
                <tr key={emp.id || emp.code}>
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
                  <td>{(emp.hourly_salary || 20000).toLocaleString('vi-VN')} đ/h</td>
                  <td>
                    {emp.employee_type === 'official'
                      ? '200.000 đ'
                      : '166.660 đ'}
                  </td>
                  <td>{(emp.ot_hourly_salary || 40000).toLocaleString('vi-VN')} đ/h</td>
                  <td>{emp.start_date || '--'}</td>
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
                      onClick={() => handleOpenEdit(emp)}
                    >
                      Sửa
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ color: '#b91c1c' }}
                      onClick={() => handleDelete(emp)}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL THÊM / SỬA NHÂN VIÊN */}
      {isModalOpen && editingEmp && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            className="card"
            style={{
              width: '460px',
              maxWidth: '90%',
              margin: '0',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div className="card-header">
              <span className="card-title">
                {editingEmp.id ? '✏️ Chỉnh Sửa Nhân Viên' : '➕ Thêm Nhân Viên Mới'}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                    Mã Nhân Viên (Trùng với mã máy chấm công) *
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    style={{ width: '100%' }}
                    value={editingEmp.code || ''}
                    onChange={(e) => setEditingEmp({ ...editingEmp, code: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                    Họ Và Tên Nhân Viên *
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    style={{ width: '100%' }}
                    value={editingEmp.name || ''}
                    onChange={(e) => setEditingEmp({ ...editingEmp, name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                      Phân loại
                    </label>
                    <select
                      className="form-input"
                      style={{ width: '100%' }}
                      value={editingEmp.employee_type || 'official'}
                      onChange={(e) => {
                        const val = e.target.value as EmployeeType;
                        setEditingEmp({
                          ...editingEmp,
                          employee_type: val,
                          hourly_salary: val === 'official' ? 20000 : 16666,
                        });
                      }}
                    >
                      <option value="official">Chính thức</option>
                      <option value="probation">Học việc</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                      Trạng Thái
                    </label>
                    <select
                      className="form-input"
                      style={{ width: '100%' }}
                      value={editingEmp.status || 'active'}
                      onChange={(e) => setEditingEmp({ ...editingEmp, status: e.target.value as EmployeeStatus })}
                    >
                      <option value="active">Đang làm</option>
                      <option value="inactive">Đã nghỉ việc</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                      Lương Giờ (VNĐ)
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: '100%' }}
                      value={editingEmp.hourly_salary ?? 20000}
                      onChange={(e) => setEditingEmp({ ...editingEmp, hourly_salary: Number(e.target.value) })}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                      Lương Tăng Ca / Giờ (VNĐ)
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: '100%' }}
                      value={editingEmp.ot_hourly_salary ?? 40000}
                      onChange={(e) => setEditingEmp({ ...editingEmp, ot_hourly_salary: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                    Ngày Vào Làm
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    style={{ width: '100%' }}
                    value={editingEmp.start_date || ''}
                    onChange={(e) => setEditingEmp({ ...editingEmp, start_date: e.target.value })}
                  />
                </div>
              </div>

              <div
                style={{
                  padding: '14px 20px',
                  backgroundColor: '#f8fafc',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Hủy Bỏ
                </button>
                <button type="submit" className="btn btn-primary">
                  💾 Lưu Thông Tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
