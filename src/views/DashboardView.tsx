import React from 'react';
import type { TabId } from '../components/Sidebar';

interface DashboardViewProps {
  onNavigate: (tab: TabId) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  return (
    <div>
      {/* 4 Card thống kê chính */}
      <div className="stats-grid">
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('employees')}>
          <div className="stat-icon blue">👥</div>
          <div className="stat-info">
            <h3>Tổng Nhân Viên</h3>
            <div className="stat-value">6</div>
            <div className="stat-desc">6 Đang hoạt động</div>
          </div>
        </div>

        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('attendance')}>
          <div className="stat-icon green">⏱️</div>
          <div className="stat-info">
            <h3>Đi Làm Hôm Nay</h3>
            <div className="stat-value">6/6</div>
            <div className="stat-desc">Đã điểm danh đầy đủ</div>
          </div>
        </div>

        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('leaves')}>
          <div className="stat-icon amber">⚠️</div>
          <div className="stat-info">
            <h3>Đi Trễ Hôm Nay</h3>
            <div className="stat-value">1</div>
            <div className="stat-desc">Vào sau 7:15 (Cần duyệt phép)</div>
          </div>
        </div>

        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('bonuses')}>
          <div className="stat-icon red">🏆</div>
          <div className="stat-info">
            <h3>Đạt Chuyên Cần Tháng</h3>
            <div className="stat-value">5</div>
            <div className="stat-desc">Không nghỉ ngày nào</div>
          </div>
        </div>
      </div>

      {/* Lối tắt truy cập nhanh & Quy định công ty */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">🚀 Thao Tác Chức Năng Nhanh</span>
          </div>
          <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            <button
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '14px', height: 'auto', borderRadius: '10px' }}
              onClick={() => onNavigate('import')}
            >
              <span style={{ fontSize: '24px', marginRight: '10px' }}>📥</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 'bold' }}>Nhập File Chấm Công</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Upload file Excel từ máy chấm công</div>
              </div>
            </button>

            <button
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '14px', height: 'auto', borderRadius: '10px' }}
              onClick={() => onNavigate('leaves')}
            >
              <span style={{ fontSize: '24px', marginRight: '10px' }}>📝</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 'bold' }}>Duyệt Phép & Đi Trễ</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Phê duyệt có phép / không phép</div>
              </div>
            </button>

            <button
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '14px', height: 'auto', borderRadius: '10px' }}
              onClick={() => onNavigate('attendance')}
            >
              <span style={{ fontSize: '24px', marginRight: '10px' }}>📅</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 'bold' }}>Xem Bảng Chấm Công</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Chi tiết giờ vào ra, tăng ca</div>
              </div>
            </button>

            <button
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '14px', height: 'auto', borderRadius: '10px' }}
              onClick={() => onNavigate('salaries')}
            >
              <span style={{ fontSize: '24px', marginRight: '10px' }}>💰</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 'bold' }}>Xem Tổng Hợp Lương</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Bảng lương thực lĩnh hàng tháng</div>
              </div>
            </button>
          </div>
        </div>

        {/* Tóm tắt quy định chấm công & tính lương */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📋 Tóm Tắt Quy Định Áp Dụng</span>
          </div>
          <div className="card-body" style={{ fontSize: '13px', lineHeight: '1.7', color: '#334155' }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>⏰ Giờ làm chính:</strong> 07:00 - 17:00 (10 tiếng/ngày, không trừ nghỉ trưa).
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>⏳ Vào trễ:</strong> Cho phép trễ đến 07:15. Từ 07:16 tính là đi trễ. Nếu làm đủ 9h45p trong giờ chính thì làm tròn 10h.
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>🚫 Phạt trễ không phép:</strong> Trừ 1/2 ngày lương chính. Có phép thì làm bao nhiêu giờ tính bấy nhiêu.
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>🌙 Tăng ca:</strong> Tính ngoài khung 07:00 - 17:00, lương 40.000đ/giờ (chỉ lấy giờ, bỏ phút lẻ).
            </div>
            <div>
              <strong>🏆 Thưởng chuyên cần:</strong> Không nghỉ ngày nào: Tháng đầu 500k, mỗi tháng tiếp theo +100k liên tục. Nghỉ là reset về 500k.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
