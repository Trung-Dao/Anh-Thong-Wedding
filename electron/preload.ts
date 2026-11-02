import { ipcRenderer, contextBridge } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  ping: () => ipcRenderer.invoke('ping'),
  login: (credentials: { username: string; password: string }) =>
    ipcRenderer.invoke('login', credentials),
});

