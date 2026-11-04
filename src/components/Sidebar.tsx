import React from 'react';
import type { User } from '../types';

export type TabId = 
  | 'dashboard' 
  | 'employees' 
  | 'import' 
  | 'attendance' 
  | 'leaves' 
  | 'bonuses' 
  | 'salaries';

interface SidebarProps {
  currentTab: TabId;
  onSelectTab: (tab: TabId) => void;
  currentUser: User | null;
  onLogout: () => void;
  pendingLeavesCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onLogout,
  pendingLeavesCount = 0,
}) => {
  const menuItems = [
    {
      id: 'dashboard' as TabId,
      label: 'Tổng quan',
      icon: '📊',
      section: 'main',
    },
    {
      id: 'attendance' as TabId,
      label: 'Dữ liệu chấm công',
      icon: '📅',
      section: 'attendance',
    },
    {
      id: 'import' as TabId,
      label: 'Nhập công từ Excel',
      icon: '📥',
      section: 'attendance',
    },
    {
      id: 'leaves' as TabId,
      label: 'Duyệt phép đi trễ',
      icon: '📝',
      section: 'attendance',
      badge: pendingLeavesCount > 0 ? pendingLeavesCount : undefined,
    },
    {
      id: 'employees' as TabId,
      label: 'Quản lý nhân viên',
      icon: '👥',
      section: 'management',
    },
    {
      id: 'bonuses' as TabId,
      label: 'Thưởng chuyên cần',
      icon: '🏆',
      section: 'salary',
    },
    {
      id: 'salaries' as TabId,
      label: 'Tổng hợp bảng lương',
      icon: '💰',
      section: 'salary',
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">PM</div>
        <div className="sidebar-brand-text">
          <h1>Quản Lý Chấm Công</h1>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-title">CHÍNH</div>
        {menuItems
          .filter((item) => item.section === 'main')
          .map((item) => (
            <button
              key={item.id}
              className={`nav-item ${currentTab === item.id ? 'active' : ''}`}
              onClick={() => onSelectTab(item.id)}
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span className="nav-item-label">{item.label}</span>
            </button>
          ))}

        <div className="sidebar-section-title">NHÂN SỰ & CHẤM CÔNG</div>
        {menuItems
          .filter((item) => item.section === 'management' || item.section === 'attendance')
          .map((item) => (
            <button
              key={item.id}
              className={`nav-item ${currentTab === item.id ? 'active' : ''}`}
              onClick={() => onSelectTab(item.id)}
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span className="nav-item-label">{item.label}</span>
              {/* {item.badge !== undefined && (
                <span className="nav-item-badge">{item.badge}</span>
              )} */}
            </button>
          ))}

        <div className="sidebar-section-title">TIỀN LƯƠNG & CHUYÊN CẦN</div>
        {menuItems
          .filter((item) => item.section === 'salary')
          .map((item) => (
            <button
              key={item.id}
              className={`nav-item ${currentTab === item.id ? 'active' : ''}`}
              onClick={() => onSelectTab(item.id)}
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span className="nav-item-label">{item.label}</span>
            </button>
          ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="user-details">
            <span className="user-name">{currentUser?.full_name || 'Quản trị viên'}</span>
            <span className="user-role">@{currentUser?.username || 'admin'}</span>
          </div>
        </div>
        <button className="btn-logout" onClick={onLogout} title="Đăng xuất">
          Thoát
        </button>
      </div>
    </aside>
  );
};
