const { app, BrowserWindow, Tray, Menu, dialog, ipcMain, nativeImage } = require('electron');
const path = require('path');
const DockerManager = require('./docker-manager');
const AutoLaunch = require('auto-launch');

const isDev = !app.isPackaged;

let mainWindow;
let tray;
let dockerManager;
let autoLauncher;

function getAutoLauncher() {
  if (!autoLauncher) {
    autoLauncher = new AutoLaunch({
      name: 'Compliance Tracker',
      path: app.getPath('exe'),
      isHidden: false
    });
  }

  return autoLauncher;
}

async function checkDockerInstallation() {
  dockerManager = new DockerManager();
  
  const isRunning = await dockerManager.isDockerRunning();
  
  if (!isRunning) {
    const result = await dialog.showMessageBox({
      type: 'warning',
      title: 'Docker Desktop Required',
      message: 'Docker Desktop is not running or not installed.',
      detail: 'This application requires Docker Desktop to run. Would you like to start Docker Desktop?',
      buttons: ['Start Docker Desktop', 'Exit', 'Install Docker Desktop'],
      defaultId: 0,
      cancelId: 1
    });

    if (result.response === 0) {
      // Start Docker Desktop
      try {
        await dockerManager.startDockerDesktop();
      } catch (error) {
        dialog.showErrorBox('Error', 'Failed to start Docker Desktop. Please start it manually and restart the application.');
        app.quit();
        return false;
      }
    } else if (result.response === 2) {
      // Open Docker Desktop download page
      require('electron').shell.openExternal('https://www.docker.com/products/docker-desktop');
      app.quit();
      return false;
    } else {
      app.quit();
      return false;
    }
  }
  
  return true;
}

async function startApplication() {
  const dockerReady = await checkDockerInstallation();
  if (!dockerReady) return;

  // Check if containers are running
  const containersRunning = await dockerManager.areContainersRunning();
  
  if (!containersRunning) {
    // Start containers
    const appPath = isDev 
      ? path.join(__dirname, '..')
      : process.resourcesPath;
    
    try {
      console.log('Starting Docker containers...');
      await dockerManager.startContainers(appPath);
      
      // Wait for backend to be ready
      console.log('Waiting for backend to be ready...');
      await dockerManager.waitForBackend();
      
      console.log('Application is ready!');
    } catch (error) {
      dialog.showErrorBox('Error', `Failed to start containers: ${error.message}`);
      app.quit();
      return;
    }
  }

  createWindow();
  createTray();
  
  // Enable auto-launch
  const launcher = getAutoLauncher();
  launcher.isEnabled().then((isEnabled) => {
    if (!isEnabled) {
      launcher.enable();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(__dirname, '../resources/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false
  });

  const startUrl = 'http://localhost:3000';
  const bundledFrontendPath = path.join(process.resourcesPath, 'frontend', 'dist', 'index.html');
  const localFrontendPath = path.join(__dirname, '..', 'frontend', 'dist', 'index.html');
  const frontendPath = isDev ? localFrontendPath : bundledFrontendPath;
  
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error(`Electron failed to load ${validatedURL}: [${errorCode}] ${errorDescription}`);
  });

  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    console.log(`Renderer console [${level}] ${sourceId}:${line} - ${message}`);
  });

  if (isDev) {
    mainWindow.loadURL(startUrl);
  } else {
    mainWindow.loadFile(frontendPath);
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    console.log(`Electron window ready: ${isDev ? startUrl : frontendPath}`);
    mainWindow.show();
  });

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  const iconPath = path.join(__dirname, '../resources/tray-icon.png');
  const trayIcon = nativeImage.createFromPath(iconPath);
  
  tray = new Tray(trayIcon.resize({ width: 16, height: 16 }));
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        }
      }
    },
    {
      label: 'Hide App',
      click: () => {
        if (mainWindow) {
          mainWindow.hide();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'View Backend Logs',
      click: async () => {
        const logs = await dockerManager.getContainerLogs('compliance-tracker-backend');
        dialog.showMessageBox({
          type: 'info',
          title: 'Backend Logs',
          message: logs,
          buttons: ['OK']
        });
      }
    },
    {
      label: 'Restart Containers',
      click: async () => {
        const isDev = !app.isPackaged;
        const appPath = isDev
          ? path.join(__dirname, '..')
          : process.resourcesPath;
        
        try {
          await dockerManager.stopContainers(appPath);
          await dockerManager.startContainers(appPath);
          await dockerManager.waitForBackend();
          
          dialog.showMessageBox({
            type: 'info',
            title: 'Success',
            message: 'Containers restarted successfully!',
            buttons: ['OK']
          });
        } catch (error) {
          dialog.showErrorBox('Error', `Failed to restart containers: ${error.message}`);
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: async () => {
        app.isQuitting = true;
        
        // Stop containers
        const isDev = !app.isPackaged;
        const appPath = isDev
          ? path.join(__dirname, '..')
          : process.resourcesPath;
        
        try {
          await dockerManager.stopContainers(appPath);
        } catch (error) {
          console.error('Error stopping containers:', error);
        }
        
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('Compliance Tracker');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    }
  });
}

app.whenReady().then(startApplication);

app.on('window-all-closed', () => {
  // Don't quit on window close, just hide
  if (process.platform !== 'darwin') {
    // Keep app running in tray
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else if (mainWindow) {
    mainWindow.show();
  }
});

app.on('before-quit', async () => {
  app.isQuitting = true;
  
  // Stop containers
  const isDev = !app.isPackaged;
  const appPath = isDev
    ? path.join(__dirname, '..')
    : process.resourcesPath;
  
  try {
    await dockerManager.stopContainers(appPath);
  } catch (error) {
    console.error('Error stopping containers:', error);
  }
});

// Handle IPC messages
ipcMain.on('restart-containers', async (event) => {
  const appPath = isDev 
    ? path.join(__dirname, '..')
    : process.resourcesPath;
  
  try {
    await dockerManager.stopContainers(appPath);
    await dockerManager.startContainers(appPath);
    await dockerManager.waitForBackend();
    event.reply('containers-restarted', { success: true });
  } catch (error) {
    event.reply('containers-restarted', { success: false, error: error.message });
  }
});

// Made with Bob
