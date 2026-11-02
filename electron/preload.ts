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
});

