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
  attendance_date: string;
  check_in?: string | null;
  check_out?: string | null;
  regular_hours: number;
  ot_hours: number;
  is_late: number;
  late_permitted: number;
  is_leave: number;
  leave_permitted: number;
  note?: string;
}

export interface AttendanceBonus {
  id?: number;
  employee_code: string;
  employee_name?: string;
  month_year: string;
  consecutive_months: number;
  bonus_amount: number;
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

export interface ElectronAPI {
  ping: () => Promise<string>;
  login: (credentials: { username: string; password: string }) => Promise<{
    success: boolean;
    user?: User;
    message?: string;
  }>;
  onMenuNavigate?: (callback: (tab: string) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

