import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'athong_wedding.db');
const schemaPath = path.join(process.cwd(), 'electron', 'database', 'schema.sql');

console.log('----------------------------------------------------');
console.log('🚀 Bắt đầu khởi tạo CSDL SQLite: athong_wedding.db');
console.log('📁 Đường dẫn file DB:', dbPath);

// 1. Tạo file SQLite
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// 2. Đọc file schema.sql
if (!fs.existsSync(schemaPath)) {
  console.error('❌ Lỗi: Không tìm thấy file schema.sql tại:', schemaPath);
  process.exit(1);
}

const sql = fs.readFileSync(schemaPath, 'utf8');

// 3. Thực thi tạo bảng
db.exec(sql);

// 4. Kiểm tra các bảng đã được tạo
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();

console.log('✅ Khởi tạo CSDL thành công!');
console.log('📋 Danh sách các bảng đã tạo:');
tables.forEach((t, i) => {
  console.log(`   ${i + 1}. ${t.name}`);
});

// 5. Kiểm tra tài khoản admin mặc định
const admin = db.prepare('SELECT id, username, full_name, role FROM users LIMIT 1').get();
console.log('👤 Tài khoản mặc định:', admin);
console.log('----------------------------------------------------');
console.log('👉 Bạn có thể mở file "athong_wedding.db" bằng DB Browser for SQLite để xem trực tiếp!');

