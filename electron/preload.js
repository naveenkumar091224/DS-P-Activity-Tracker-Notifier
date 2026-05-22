const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Notification APIs
  showNotification: (title, body) => {
    ipcRenderer.send('show-notification', { title, body });
  },
  
  // App control
  minimizeToTray: () => {
    ipcRenderer.send('minimize-to-tray');
  },
  
  quitApp: () => {
    ipcRenderer.send('quit-app');
  },
  
  // Container management
  restartContainers: () => {
    ipcRenderer.send('restart-containers');
  },
  
  onContainersRestarted: (callback) => {
    ipcRenderer.on('containers-restarted', (event, data) => callback(data));
  }
});

// Made with Bob
