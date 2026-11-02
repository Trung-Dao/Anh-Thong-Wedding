-- ============================================================
-- 1. BẢNG TÀI KHOẢN ĐĂNG NHẬP
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tài khoản quản trị mặc định ban đầu: admin / 123456
INSERT OR IGNORE INTO users (id, username, password, full_name, role)
VALUES (1, 'admin', '123456', 'Quản Trị Viên', 'admin');


-- ============================================================
-- 2. BẢNG NHÂN VIÊN
-- ============================================================
CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,                  -- Mã nhân viên trên máy chấm công
    name TEXT NOT NULL,                         -- Tên nhân viên
    employee_type TEXT DEFAULT 'official',      -- 'official' (chính thức) hoặc 'probation' (học việc)
    hourly_salary REAL DEFAULT 20000,           -- Lương theo giờ (chính thức: 20000, học việc: 16666)
    ot_hourly_salary REAL DEFAULT 40000,        -- Lương tăng ca theo giờ (mặc định 40000)
    start_date DATE,                            -- Ngày vào làm
    status TEXT DEFAULT 'active',               -- 'active' (đang làm) hoặc 'inactive' (nghỉ việc)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 3. BẢNG LỊCH SỬ CÁC FILE EXCEL ĐÃ IMPORT
-- ============================================================
CREATE TABLE IF NOT EXISTS import_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_name TEXT NOT NULL,                    -- Tên lưu trữ định dạng Ymd_His.xlsx
    original_name TEXT NOT NULL,                -- Tên file gốc lúc tải lên
    file_path TEXT NOT NULL,                    -- Đường dẫn lưu trữ an toàn
    total_rows INTEGER DEFAULT 0,               -- Tổng số dòng đã đọc
    imported_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 4. BẢNG DỮ LIỆU CHẤM CÔNG HÀNG NGÀY
-- ============================================================
CREATE TABLE IF NOT EXISTS attendances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_code TEXT NOT NULL,                -- Mã nhân viên
    attendance_date DATE NOT NULL,              -- Ngày chấm công (YYYY-MM-DD)
    check_in TEXT,                              -- Giờ vào sớm nhất (HH:mm:ss)
    check_out TEXT,                             -- Giờ ra muộn nhất (HH:mm:ss)
    
    regular_hours INTEGER DEFAULT 0,            -- Giờ làm chính (chuẩn 7:00 - 17:00)
    ot_hours INTEGER DEFAULT 0,                 -- Giờ làm ngoài giờ (trước 7:00 hoặc sau 17:00)
    
    is_late INTEGER DEFAULT 0,                  -- Đi trễ (vào sau 7:15)
    late_permitted INTEGER DEFAULT 0,           -- Trễ có phép (1: có phép, 0: không phép)
    
    is_leave INTEGER DEFAULT 0,                 -- Nghỉ làm (1: nghỉ ngày này)
    leave_permitted INTEGER DEFAULT 0,          -- Nghỉ có phép (1: có phép, 0: không phép)
    
    note TEXT,                                  -- Ghi chú bổ sung
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_code, attendance_date)
);


-- ============================================================
-- 5. BẢNG THEO DÕI THƯỞNG CHUYÊN CẦN THEO THÁNG
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance_bonuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_code TEXT NOT NULL,
    month_year TEXT NOT NULL,                   -- Định dạng YYYY-MM
    consecutive_months INTEGER DEFAULT 0,       -- Số tháng liên tục không nghỉ ngày nào
    bonus_amount REAL DEFAULT 0,                -- Tiền thưởng: 500k, 600k, 700k...
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_code, month_year)
);


-- ============================================================
-- 6. BẢNG TỔNG HỢP LƯƠNG THEO THÁNG
-- ============================================================
CREATE TABLE IF NOT EXISTS monthly_salaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_code TEXT NOT NULL,
    month_year TEXT NOT NULL,                   -- Định dạng YYYY-MM
    total_work_days INTEGER DEFAULT 0,          -- Tổng số ngày đi làm
    total_regular_hours INTEGER DEFAULT 0,      -- Tổng giờ làm chính
    total_ot_hours INTEGER DEFAULT 0,           -- Tổng giờ tăng ca
    
    regular_salary REAL DEFAULT 0,              -- Lương giờ chính
    ot_salary REAL DEFAULT 0,                   -- Lương tăng ca
    late_penalty REAL DEFAULT 0,                -- Phạt trễ không phép (1/2 ngày lương)
    attendance_bonus REAL DEFAULT 0,            -- Thưởng chuyên cần
    
    net_salary REAL DEFAULT 0,                  -- Thực lĩnh
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_code, month_year)
);

