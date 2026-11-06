import electron from 'electron';
const { app, BrowserWindow, ipcMain, dialog } = electron;
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'node:module';
import { initDatabase, getDb } from './database/db';
import { setupApplicationMenu } from './menu';
import {
  importExcelTimesheet,
  getImportHistory,
  getEmployees,
  saveEmployee,
  deleteEmployee,
  getAttendances,
  getRawAttendances,
  updateAttendanceStatus,
  getLeaveRequests,
  getAttendanceBonuses,
  getMonthlySalaries,
  getSalaryMonths,
  getDashboardStats,
} from './services/attendanceService';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Thiết lập ngôn ngữ tiếng Việt cho Electron và Chromium
app.commandLine.appendSwitch('lang', 'vi');

let win: BrowserWindow | null = null;

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.cjs');
  console.log('[Main] Sử dụng preload script:', preloadPath);

  win = new BrowserWindow({
    title: 'Quản Lý Chấm Công',
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Mở ứng dụng phóng to tối đa (maximize) mặc định
  win.maximize();

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    // win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Khởi tạo Menu native trên Electron
  setupApplicationMenu(win);
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  // Khởi tạo Database SQLite khi app sẵn sàng
  initDatabase();

  // Đăng ký các hàm IPC xử lý dữ liệu
  ipcMain.handle('ping', () => 'pong');

  // 1. Đăng nhập
  ipcMain.handle('login', async (_event, { username, password }) => {
    try {
      const db = getDb();
      const user = db
        .prepare('SELECT id, username, full_name, role FROM users WHERE username = ? AND password = ?')
        .get(username, password);

      if (user) {
        return { success: true, user };
      }
      return { success: false, message: 'Sai tên đăng nhập hoặc mật khẩu!' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  });

  // 2. Tải file mẫu Template.xlsx về máy tính của người dùng
  ipcMain.handle('template:download', async () => {
    try {
      const possibleSrcPaths = [
        path.join(process.resourcesPath || '', 'Template.xlsx'),
        path.join(process.resourcesPath || '', 'Template.xls'),
        path.join(app.getAppPath(), 'dist', 'Template.xlsx'),
        path.join(__dirname, '../dist/Template.xlsx'),
        path.join(process.cwd(), 'public', 'Template.xlsx'),
        path.join(process.cwd(), 'dist', 'Template.xlsx'),
        path.join(app.getAppPath(), 'public', 'Template.xlsx'),
        path.join(__dirname, '../public/Template.xlsx'),
        path.join(__dirname, 'Template.xlsx'),
      ];

      let foundSrc = '';
      for (const p of possibleSrcPaths) {
        if (fs.existsSync(p)) {
          foundSrc = p;
          break;
        }
      }

      if (!foundSrc) {
        return { success: false, message: 'Không tìm thấy file mẫu Template.xlsx trong hệ thống!' };
      }

      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Tải File Mẫu Excel Máy Chấm Công',
        defaultPath: 'Template.xlsx',
        filters: [{ name: 'Excel Files (*.xlsx)', extensions: ['xlsx'] }],
      });

      if (canceled || !filePath) {
        return { success: false, canceled: true };
      }

      fs.copyFileSync(foundSrc, filePath);
      return { success: true, filePath };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  });

  // 3. Nhập file Excel chấm công
  ipcMain.handle('excel:import', async (_event, { fileBuffer, originalName }) => {
    try {
      const buffer = Buffer.from(fileBuffer);
      const result = await importExcelTimesheet(buffer, originalName);
      return result;
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  });

  // 4. Lấy lịch sử file đã import
  ipcMain.handle('excel:getHistory', async () => {
    try {
      return getImportHistory();
    } catch (err: any) {
      console.error('Lỗi lấy lịch sử file:', err);
      return [];
    }
  });

  // 5. Quản lý nhân viên
  ipcMain.handle('employees:getAll', async () => {
    try {
      return getEmployees();
    } catch (err: any) {
      console.error('Lỗi lấy danh sách nhân viên:', err);
      return [];
    }
  });

  ipcMain.handle('employees:save', async (_event, emp) => {
    try {
      return saveEmployee(emp);
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('employees:delete', async (_event, id) => {
    try {
      return deleteEmployee(id);
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  });

  // 6. Chấm công
  ipcMain.handle('attendance:getByDate', async (_event, date) => {
    try {
      return getAttendances(date);
    } catch (err: any) {
      console.error('Lỗi lấy chấm công:', err);
      return [];
    }
  });

  // 6.1 Dữ liệu thô máy chấm công (Raw Logs)
  ipcMain.handle('attendance:getRaw', async (_event, filters) => {
    try {
      return getRawAttendances(filters);
    } catch (err: any) {
      console.error('Lỗi lấy dữ liệu thô chấm công:', err);
      return [];
    }
  });

  ipcMain.handle('attendance:updateStatus', async (_event, params) => {
    try {
      return updateAttendanceStatus(params);
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('attendance:getLeaveRequests', async (_event, filter) => {
    try {
      return getLeaveRequests(filter);
    } catch (err: any) {
      console.error('Lỗi lấy danh sách duyệt:', err);
      return [];
    }
  });

  // 7. Thưởng chuyên cần & Lương tháng
  ipcMain.handle('bonus:getByMonth', async (_event, month) => {
    try {
      return getAttendanceBonuses(month);
    } catch (err: any) {
      console.error('Lỗi tính chuyên cần:', err);
      return [];
    }
  });

  ipcMain.handle('salary:getByMonth', async (_event, month) => {
    try {
      return getMonthlySalaries(month);
    } catch (err: any) {
      console.error('Lỗi tính bảng lương:', err);
      return [];
    }
  });

  ipcMain.handle('salary:getMonths', async () => {
    try {
      return getSalaryMonths();
    } catch (err: any) {
      console.error('Lỗi lấy danh sách tháng:', err);
      return [];
    }
  });

  // 8. Thống kê Dashboard
  ipcMain.handle('dashboard:getStats', async (_event, { date, month } = {}) => {
    try {
      return getDashboardStats(date, month);
    } catch (err: any) {
      console.error('Lỗi lấy thống kê dashboard:', err);
      return {
        totalEmployees: 0,
        activeEmployees: 0,
        todayAttended: 0,
        todayLate: 0,
        monthlyBonusEligible: 0,
      };
    }
  });

  createWindow();
});
