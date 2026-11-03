export interface User {
  id: number;
  username: string;
  full_name: string;
  role: string;
}

export type EmployeeType = 'official' | 'probation';
export type EmployeeStatus = 'active' | 'inactive';

export interface Employee {
  id?: number;
  code: string;
  name: string;
  employee_type: EmployeeType;
  hourly_salary: number;
  ot_hourly_salary: number;
  start_date: string;
  status: EmployeeStatus;
}

export interface AttendanceRecord {
  id?: number;
  employee_code: string;
  employee_name?: string;
  employee_type?: EmployeeType;
  attendance_date: string;
  check_in?: string | null;
  check_out?: string | null;
  regular_hours: number;
  ot_hours: number;
  is_late: number;
  late_permitted: number;
  note?: string;
}

export interface AttendanceBonusRow {
  employee_code: string;
  employee_name: string;
  total_month_days: number;
  attended_days: number;
  leave_days: number;
  consecutive_months: number;
  bonus_amount: number;
  status: 'eligible' | 'not_eligible';
  reason: string;
}

export interface MonthlySalary {
  id?: number;
  employee_code: string;
  employee_name?: string;
  month_year: string;
  total_work_days: number;
  total_regular_hours: number;
  total_ot_hours: number;
  regular_salary: number;
  ot_salary: number;
  late_penalty: number;
  attendance_bonus: number;
  net_salary: number;
}

export interface ImportFileRecord {
  id: number;
  file_name: string;
  original_name: string;
  file_path: string;
  total_rows: number;
  imported_at: string;
}

export interface RawAttendanceRecord {
  id?: number;
  file_id?: number;
  employee_code: string;
  employee_name?: string;
  date_raw?: string;
  time_raw?: string;
  date_formatted: string;
  time_formatted: string;
  punch_type?: number;
  punch_source?: number;
  machine_number?: number;
  machine_name?: string;
  created_at?: string;
}

export interface ImportResult {
  success: boolean;
  message?: string;
  savedFileName?: string;
  totalRows?: number;
  totalRawRows?: number;
  newRawRows?: number;
  duplicateRawRows?: number;
  totalPunches?: number;
  totalDays?: number;
  uniqueEmployees?: number;
  dateRange?: { from: string; to: string };
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  todayAttended: number;
  todayLate: number;
  monthlyBonusEligible: number;
}

export interface ElectronAPI {
  ping: () => Promise<string>;
  login: (credentials: { username: string; password: string }) => Promise<{
    success: boolean;
    user?: User;
    message?: string;
  }>;
  onMenuNavigate?: (callback: (tab: string) => void) => () => void;

  downloadTemplate: () => Promise<{ success: boolean; filePath?: string; canceled?: boolean; message?: string }>;
  importExcel: (data: { fileBuffer: Uint8Array; originalName: string }) => Promise<ImportResult>;
  getImportHistory: () => Promise<ImportFileRecord[]>;

  getEmployees: () => Promise<Employee[]>;
  saveEmployee: (emp: Partial<Employee>) => Promise<{ success: boolean; message?: string }>;
  deleteEmployee: (id: number) => Promise<{ success: boolean; message?: string }>;

  getAttendances: (filter?: string | { date?: string; month?: string }) => Promise<AttendanceRecord[]>;
  getRawAttendances: (filters?: {
    date?: string;
    employee_code?: string;
    file_id?: number;
  }) => Promise<RawAttendanceRecord[]>;
  updateAttendanceStatus: (params: {
    id: number;
    late_permitted?: number;
    note?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  getLeaveRequests: () => Promise<AttendanceRecord[]>;

  getAttendanceBonuses: (month: string) => Promise<AttendanceBonusRow[]>;
  getMonthlySalaries: (month: string) => Promise<MonthlySalary[]>;
  getDashboardStats: (params?: { date?: string; month?: string }) => Promise<DashboardStats>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
