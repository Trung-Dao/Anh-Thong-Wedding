import React, { useState } from 'react';
import type { User } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (window.electronAPI?.login) {
        const res = await window.electronAPI.login({ username, password });
        if (res.success && res.user) {
          onLoginSuccess(res.user);
        } else {
          setErrorMsg(res.message || 'Tên đăng nhập hoặc mật khẩu không chính xác!');
        }
      } else {
        // Fallback demo cho browser
        if (username === 'admin' && password === '123456') {
          onLoginSuccess({
            id: 1,
            username: 'admin',
            full_name: 'Quản Trị Viên',
            role: 'admin',
          });
        } else {
          setErrorMsg('Tên đăng nhập hoặc mật khẩu không chính xác! (Mặc định: admin / 123456)');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi kết nối hệ thống');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <div className="login-brand-icon">💍</div>
          <h2>Hệ thống Quản lý Chấm công & Bảng lương</h2>
        </div>

        {errorMsg && <div className="alert-error">{errorMsg}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Tài khoản</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên đăng nhập"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? 'Đang xác thực...' : 'Đăng Nhập'}
          </button>

          <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
            Tài khoản mẫu: <strong>admin</strong> | Mật khẩu: <strong>123456</strong>
          </div>
        </form>
      </div>
    </div>
  );
};
