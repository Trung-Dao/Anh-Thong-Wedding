import { ipcRenderer, contextBridge } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  ping: () => ipcRenderer.invoke('ping'),
  login: (credentials: { username: string; password: string }) =>
    ipcRenderer.invoke('login', credentials),
  onMenuNavigate: (callback: (tab: string) => void) => {
    const subscription = (_event: any, tab: string) => callback(tab);
    ipcRenderer.on('menu-navigate', subscription);
    return () => {
      ipcRenderer.removeListener('menu-navigate', subscription);
    };
  },

  // 1. Tải file mẫu Template.xlsx
  downloadTemplate: () => ipcRenderer.invoke('template:download'),

  // 2. Nhập file Excel & lấy lịch sử file
  importExcel: (data: { fileBuffer: Uint8Array; originalName: string }) =>
    ipcRenderer.invoke('excel:import', data),
  getImportHistory: () => ipcRenderer.invoke('excel:getHistory'),

  // 3. Quản lý nhân viên
  getEmployees: () => ipcRenderer.invoke('employees:getAll'),
  saveEmployee: (emp: any) => ipcRenderer.invoke('employees:save', emp),
  deleteEmployee: (id: number) => ipcRenderer.invoke('employees:delete', id),

  // 4. Chấm công & duyệt phép
  getAttendances: (date?: string) => ipcRenderer.invoke('attendance:getByDate', date),
  getRawAttendances: (filters?: { date?: string; employee_code?: string; file_id?: number }) =>
    ipcRenderer.invoke('attendance:getRaw', filters),
  updateAttendanceStatus: (params: {
    id: number;
    late_permitted?: number;
    leave_permitted?: number;
    note?: string;
  }) => ipcRenderer.invoke('attendance:updateStatus', params),
  getLeaveRequests: () => ipcRenderer.invoke('attendance:getLeaveRequests'),

  // 5. Thưởng chuyên cần & Lương tháng
  getAttendanceBonuses: (month: string) => ipcRenderer.invoke('bonus:getByMonth', month),
  getMonthlySalaries: (month: string) => ipcRenderer.invoke('salary:getByMonth', month),

  // 6. Thống kê Dashboard
  getDashboardStats: (params?: { date?: string; month?: string }) =>
    ipcRenderer.invoke('dashboard:getStats', params),
});
