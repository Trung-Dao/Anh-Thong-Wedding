import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

let dbInstance: Database.Database | null = null;

/**
 * Lấy đường dẫn lưu file database athong_wedding.db
 * - Khi chạy trong Electron: lưu tại app.getPath('userData')
 * - Khi chạy script test ngoài Electron: lưu ngay tại thư mục dự án
 */
export function getDatabasePath(): string {
  let dbDir: string;
  try {
    if (app && typeof app.getPath === 'function') {
      dbDir = app.getPath('userData');
    } else {
      dbDir = process.cwd();
    }
  } catch {
    dbDir = process.cwd();
  }

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  return path.join(dbDir, 'athong_wedding.db');
}

/**
 * Khởi tạo kết nối SQLite và tự động chạy schema.sql tạo bảng nếu chưa có
 */
export function initDatabase(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = getDatabasePath();
  console.log('==> [SQLite] Đang kết nối CSDL tại:', dbPath);

  // Tạo kết nối database (tự tạo file .db nếu chưa có)
  dbInstance = new Database(dbPath);

  // Bật chế độ WAL để tăng tốc độ ghi/đọc SQLite
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('foreign_keys = ON');

  // Đọc và chạy file schema.sql để tạo các bảng
  const possibleSchemaPaths = [
    path.join(__dirname, 'schema.sql'),
    path.join(__dirname, 'database', 'schema.sql'),
    path.join(process.cwd(), 'electron', 'database', 'schema.sql'),
  ];

  let schemaSql = '';
  for (const p of possibleSchemaPaths) {
    if (fs.existsSync(p)) {
      schemaSql = fs.readFileSync(p, 'utf8');
      break;
    }
  }

  if (schemaSql) {
    dbInstance.exec(schemaSql);
    console.log('==> [SQLite] Đã kiểm tra và khởi tạo các bảng thành công!');
  } else {
    console.warn('==> [SQLite] Cảnh báo: Không tìm thấy file schema.sql!');
  }

  return dbInstance;
}

export function getDb(): Database.Database {
  if (!dbInstance) {
    return initDatabase();
  }
  return dbInstance;
}

