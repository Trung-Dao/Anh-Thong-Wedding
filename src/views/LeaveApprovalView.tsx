import React, { useState } from 'react';

interface PendingItem {
  id: number;
  employee_code: string;
  employee_name: string;
  type: 'late' | 'leave';
  date: string;
  time_or_reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

export const LeaveApprovalView: React.FC = () => {
  const [items, setItems] = useState<PendingItem[]>([
    {
      id: 1,
      employee_code: '3',
      employee_name: 'Lê Hoàng Cường',
      type: 'late',
      date: '2026-11-02',
      time_or_reason: 'Vào lúc 07:35 (Trễ 35 phút - Lý do: kẹt xe hỏng xe)',
      status: 'pending',
    },
    {
      id: 2,
      employee_code: '6',
      employee_name: 'Võ Quốc Em',
      type: 'leave',
      date: '2026-11-02',
      time_or_reason: 'Xin nghỉ việc gia đình có báo trước',
      status: 'pending',
    },
  ]);

  const handleAction = (id: number, status: 'approved' | 'rejected' | 'pending') => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">📝 Danh Sách Yêu Cầu Duyệt Phép & Trễ Giờ</span>
        <span className="badge badge-warning">
          Chờ duyệt: {items.filter((i) => i.status === 'pending').length}
        </span>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã NV</th>
              <th>Họ Và Tên</th>
              <th>Loại Yêu Cầu</th>
              <th>Ngày Áp Dụng</th>
              <th>Nội Dung / Lý Do</th>
              <th>Tình Trạng</th>
              <th style={{ textAlign: 'center', width: '220px' }}>Hành Động Phê Duyệt</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td><strong>#{item.employee_code}</strong></td>
                <td style={{ fontWeight: '600' }}>{item.employee_name}</td>
                <td>
                  {item.type === 'late' ? (
                    <span className="badge badge-warning">Giải trình vào trễ</span>
                  ) : (
                    <span className="badge badge-info">Đơn xin nghỉ</span>
                  )}
                </td>
                <td>{item.date}</td>
                <td>{item.time_or_reason}</td>
                <td>
                  {item.status === 'pending' && (
                    <span className="badge badge-warning">Chờ quản lý duyệt</span>
                  )}
                  {item.status === 'approved' && (
                    <span className="badge badge-success">Đã duyệt Có Phép</span>
                  )}
                  {item.status === 'rejected' && (
                    <span className="badge badge-danger">Không duyệt (Không Phép)</span>
                  )}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {item.status === 'pending' ? (
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ backgroundColor: '#15803d' }}
                        onClick={() => handleAction(item.id, 'approved')}
                      >
                        ✓ Duyệt Có Phép
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#b91c1c' }}
                        onClick={() => handleAction(item.id, 'rejected')}
                      >
                        ✕ Không Phép (Trừ 1/2 ngày)
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleAction(item.id, 'pending')}
                    >
                      Hoàn tác
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ padding: '16px 20px', backgroundColor: '#f8fafc', borderTop: '1px solid var(--border-color)', fontSize: '13px', color: '#475569' }}>
        💡 <strong>Ghi chú quy định:</strong> Khi duyệt <em>"Có phép"</em>: Đi trễ bao nhiêu giờ tính bấy nhiêu giờ thực làm. Nếu <em>"Không phép"</em>: Bị trừ phạt 1/2 ngày lương chính (100.000đ với chính thức, 83.330đ với học việc).
      </div>
    </div>
  );
};
