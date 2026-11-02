import React, { useState, useEffect } from 'react';
import type { TabId } from './Sidebar';

interface HeaderProps {
  currentTab: TabId;
}

const tabTitles: Record<TabId, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Bảng Điều Khiển Tổng Quan',
    subtitle: 'Thống kê tổng hợp chấm công và hoạt động hôm nay',
  },
  employees: {
    title: 'Danh Sách Nhân Viên',
    subtitle: 'Quản lý thông tin hồ sơ, loại nhân viên và mức lương giờ',
  },
  import: {
    title: 'Nhập Dữ Liệu Chấm Công',
    subtitle: 'Tải lên và xử lý tệp Excel xuất từ máy chấm công',
  },
  attendance: {
    title: 'Bảng Dữ Liệu Chấm Công',
    subtitle: 'Theo dõi chi tiết giờ vào, ra, giờ chính, tăng ca và trạng thái',
  },
  leaves: {
    title: 'Duyệt Phép & Giải Trình Đi Trễ',
    subtitle: 'Xử lý các trường hợp xin nghỉ và giải trình vào trễ',
  },
  bonuses: {
    title: 'Thưởng Chuyên Cần Theo Tháng',
    subtitle: 'Theo dõi chuỗi tháng làm đủ không nghỉ (500k + 100k/tháng)',
  },
  salaries: {
    title: 'Tổng Hợp Bảng Lương',
    subtitle: 'Tính toán lương giờ chính, tăng ca, phạt trễ và thực lĩnh theo tháng',
  },
};

export const Header: React.FC<HeaderProps> = ({ currentTab }) => {
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      };
      setCurrentDateTime(now.toLocaleDateString('vi-VN', options));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentInfo = tabTitles[currentTab] || {
    title: 'Hệ Thống Chấm Công',
    subtitle: 'Quản lý dữ liệu chấm công và tính lương',
  };

  return (
    <header className="top-header">
      <div className="header-title-area">
        <h2>{currentInfo.title}</h2>
        <p>{currentInfo.subtitle}</p>
      </div>

      <div className="header-actions">
        <div className="datetime-pill">
          <span>🕒</span>
          <span>{currentDateTime}</span>
        </div>
      </div>
    </header>
  );
};
