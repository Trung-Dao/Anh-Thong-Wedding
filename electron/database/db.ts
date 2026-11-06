import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import electron from 'electron';

const app = electron?.app;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let dbInstance: Database.Database | null = null;

/**
 * Lấy đường dẫn lưu file database athong_wedding.db
 * - Đang lập trình (DEV): Lưu trực tiếp tại source c:\wamp64\www\athong_wedding\athong_wedding.db để bạn xem và sửa.
 * - Đã đóng gói (PRODUCTION .exe): Tự động chuyển sang app.getPath('userData') cho khách hàng.
 */
export function getDatabasePath(): string {
  // 1. Nếu đã đóng gói thành file .exe (cho khách)
  if (app && app.isPackaged) {
    const dbDir = app.getPath('userData');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    return path.join(dbDir, 'athong_wedding.db');
  }

  // 2. Khi đang code (npm run dev) -> Lưu NGAY TRONG THƯ MỤC SOURCE DỰ ÁN
  return path.join(process.cwd(), 'athong_wedding.db');
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
    path.join(process.resourcesPath || '', 'schema.sql'),
    path.join(app ? app.getAppPath() : '', 'schema.sql'),
    path.join(process.cwd(), 'electron', 'database', 'schema.sql'),
    path.join(__dirname, 'schema.sql'),
    path.join(__dirname, 'database', 'schema.sql'),
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

    // Tự động gỡ bỏ các cột is_leave, leave_permitted cũ nếu còn tồn tại trong database cũ
    // try {
    //   const cols = dbInstance.prepare("PRAGMA table_info(attendances)").all() as any[];
    //   const colNames = cols.map((c) => c.name);
    //   if (colNames.includes('is_leave')) {
    //     dbInstance.exec('ALTER TABLE attendances DROP COLUMN is_leave;');
    //   }
    //   if (colNames.includes('leave_permitted')) {
    //     dbInstance.exec('ALTER TABLE attendances DROP COLUMN leave_permitted;');
    //   }
    // } catch (e) {
    //   // Bỏ qua nếu SQLite phiên bản cũ không hỗ trợ DROP COLUMN
    // }
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

/**
 * Lấy thư mục lưu trữ các file Excel được import vào hệ thống
 * Tuân thủ quy định: Lưu trữ tại app.getPath('userData') khi đóng gói
 */
export function getStorageDir(): string {
  let baseDir: string;
  if (app && app.isPackaged) {
    baseDir = app.getPath('userData');
  } else {
    baseDir = path.join(process.cwd(), 'uploads');
  }
  const importsDir = path.join(baseDir, 'imports');
  if (!fs.existsSync(importsDir)) {
    fs.mkdirSync(importsDir, { recursive: true });
  }
  return importsDir;
}

