import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'node:module';
import { initDatabase, getDb } from './database/db';
import { setupApplicationMenu } from './menu';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

let win: BrowserWindow | null = null;

function createWindow() {
  win = new BrowserWindow({
    title: 'Quản Lý Chấm Công',
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

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

  createWindow();
});
