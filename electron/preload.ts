import { ipcRenderer, contextBridge } from 'electron';

// contextBridge: Tạo cầu nối bảo mật, gắn đối tượng "electronAPI" vào "window" để React gọi được.
// ipcRenderer: Bộ bưu tá ở phía Web dùng để:
//   - Gửi yêu cầu (request) từ Web -> Main Process (ipcMain) và nhận kết quả trả về (response).
//   - Lắng nghe các sự kiện chủ động được phát từ Main Process xuống Web (như click Menu).
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
});

