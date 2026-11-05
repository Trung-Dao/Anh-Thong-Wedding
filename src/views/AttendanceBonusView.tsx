import React, { useState, useEffect } from 'react';
import type { AttendanceBonusRow } from '../types';

export const AttendanceBonusView: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return new Date().toISOString().slice(0, 7);
  });
  const [data, setData] = useState<AttendanceBonusRow[]>([]);
  const [loading, setLoading] = useState(false);

  const loadBonuses = async (month: string) => {
    if (window.electronAPI?.getAttendanceBonuses) {
      setLoading(true);
      try {
        const list = await window.electronAPI.getAttendanceBonuses(month);
        setData(list || []);
      } catch (err) {
        console.error('Lỗi khi tính chuyên cần:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadBonuses(selectedMonth);
  }, [selectedMonth]);

  return (
    <div className="card">
      <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', width: '112px' }}>Chọn Tháng:</label>
          <input
            type="month"
            className="form-input"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        </div>

        {/* <button
          className="btn btn-primary btn-sm"
          onClick={() => loadBonuses(selectedMonth)}
          disabled={loading}
        >
          {loading ? 'Đang tính toán...' : '🔄 Tính Lại Chuyên Cần'}
        </button> */}
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '70px' }}>Mã NV</th>
              <th>Họ Và Tên</th>
              <th>Số Ngày Trong Tháng</th>
              <th>Số Ngày Đi Làm</th>
              <th>Số Ngày Nghỉ</th>
              <th>Chuỗi Tháng Đạt</th>
              <th>Thưởng Chuyên Cần</th>
              <th>Trạng Thái</th>
              <th>Chi Tiết Đánh Giá</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  Đang tính toán dữ liệu chuyên cần...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  Chưa có nhân viên hoặc dữ liệu chấm công cho tháng <strong>{selectedMonth}</strong>.
                  <br />
                  <span style={{ fontSize: '12px' }}>
                    Vui lòng nạp file Excel chấm công tại mục <strong>"Nhập công từ excel"</strong>.
                  </span>
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.employee_code}>
                  <td>
                    <strong style={{ color: 'var(--primary)' }}>#{row.employee_code}</strong>
                  </td>
                  <td style={{ fontWeight: '600' }}>{row.employee_name}</td>
                  <td>{row.total_month_days} ngày</td>
                  <td>
                    <strong style={{ color: '#15803d' }}>{row.attended_days}</strong>
                  </td>
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
                    <strong
                      style={{
                        fontSize: '14px',
                        color: row.bonus_amount > 0 ? 'var(--primary)' : '#64748b',
                      }}
                    >
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
              ))
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
        📌 <strong>Quy định thưởng chuyên cần:</strong>
        <ul style={{ margin: '6px 0 0 20px', lineHeight: '1.6' }}>
          <li>
            <strong>Điều kiện:</strong> Không nghỉ bất kỳ ngày nào trong tháng (kể cả nghỉ có phép hay không phép). Đi trễ vẫn tính là có đi làm.
          </li>
          <li>
            <strong>Mức thưởng:</strong> Tháng đầu tiên không nghỉ ngày nào thưởng <strong>500.000đ</strong>. Các tháng kế tiếp liên tục không nghỉ cộng thêm <strong>+100.000đ/tháng</strong> (600k, 700k,... không có mức giới hạn tối đa).
          </li>
          <li>
            <strong>Reset thưởng:</strong> Nếu trong tháng có nghỉ bất kỳ ngày nào, không được nhận thưởng tháng đó và reset mức thưởng về <strong>500.000đ</strong> cho tháng sau.
          </li>
          <li>
            <strong>Đặc thù:</strong> Không có ngày nghỉ chủ nhật hay lễ. Phải làm đủ tất cả các ngày trong tháng.
          </li>
        </ul>
      </div>
    </div>
  );
};
