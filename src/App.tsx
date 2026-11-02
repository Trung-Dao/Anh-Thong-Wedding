import { useState, useEffect } from 'react';
import './App.css';
import { Sidebar } from './components/Sidebar';
import type { TabId } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginPage } from './components/LoginPage';
import { DashboardView } from './views/DashboardView';
import { EmployeesView } from './views/EmployeesView';
import { ImportExcelView } from './views/ImportExcelView';
import { AttendanceView } from './views/AttendanceView';
import { LeaveApprovalView } from './views/LeaveApprovalView';
import { AttendanceBonusView } from './views/AttendanceBonusView';
import { SalaryView } from './views/SalaryView';
import type { User } from './types';

function App() {
  const defaultAdmin: User = {
    id: 1,
    username: 'admin',
    full_name: 'Quản Trị Viên',
    role: 'admin',
  };

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('athong_user');
    // Mặc định đăng nhập luôn để người dùng thao tác menu ngay
    return saved ? JSON.parse(saved) : defaultAdmin;
  });

  const [currentTab, setCurrentTab] = useState<TabId>('dashboard');

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('athong_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('athong_user');
  };

  useEffect(() => {
    if (!window.electronAPI) {
      console.warn('[Renderer] window.electronAPI is undefined.');
      return;
    }

    if (window.electronAPI.onMenuNavigate) {
      console.log('[Renderer] Registering onMenuNavigate listener');

      const unsubscribe = window.electronAPI.onMenuNavigate((tab: string) => {
        console.log('[Renderer] Received menu tab:', tab);
        if (tab === 'logout') {
          handleLogout();
        } else if (
          [
            'dashboard',
            'employees',
            'import',
            'attendance',
            'leaves',
            'bonuses',
            'salaries',
          ].includes(tab)
        ) {
          // Đảm bảo có user để hiển thị màn hình chính
          setCurrentUser((prev) => prev || defaultAdmin);
          setCurrentTab(tab as TabId);
        }
      });
      
      return () => {
        unsubscribe?.();
      };
    }
  }, []);

  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-layout">
      {/* Menu Điều Hướng Trái (Sidebar) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        pendingLeavesCount={2}
      />

      {/* Vùng Làm Việc Chính */}
      <div className="main-wrapper">
        <Header currentTab={currentTab} />

        <main className="content-body">
          {currentTab === 'dashboard' && (
            <DashboardView onNavigate={(tab) => setCurrentTab(tab)} />
          )}
          {currentTab === 'employees' && <EmployeesView />}
          {currentTab === 'import' && <ImportExcelView />}
          {currentTab === 'attendance' && <AttendanceView />}
          {currentTab === 'leaves' && <LeaveApprovalView />}
          {currentTab === 'bonuses' && <AttendanceBonusView />}
          {currentTab === 'salaries' && <SalaryView />}
        </main>
      </div>
    </div>
  );
}

export default App;
