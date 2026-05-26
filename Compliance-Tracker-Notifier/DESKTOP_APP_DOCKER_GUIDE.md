# Compliance Tracker Desktop Application with Docker

## Overview

This guide outlines building a Windows desktop application (.exe) that bundles Docker containers internally, avoiding Python packaging issues while maintaining a clean, isolated environment.

## Architecture: Electron + Docker Desktop

### Why Docker Instead of PyInstaller?

**Advantages:**
✅ No Python packaging issues or dependency conflicts
✅ Exact same environment as development
✅ Easier to maintain and update
✅ Better isolation and security
✅ Simpler deployment process
✅ Works with existing docker-compose.yml

**Requirements:**
- Docker Desktop for Windows must be installed on user's machine
- OR bundle Docker Desktop installer with the app
- OR use embedded Docker engine (advanced)

---

## Solution Options

### Option 1: Require Docker Desktop (Recommended for MVP)
**Pros:** Simple, reliable, smaller installer (~50 MB)
**Cons:** Users must install Docker Desktop separately

### Option 2: Bundle Docker Desktop Installer
**Pros:** One-click installation
**Cons:** Large installer (~500 MB), requires admin rights

### Option 3: Embedded Docker Engine (Advanced)
**Pros:** No external dependencies, portable
**Cons:** Complex setup, licensing considerations

**Recommended:** Start with **Option 1** for MVP, then consider Option 2 for production.

---

## Desktop Application Architecture

```
Compliance-Tracker-Desktop/
├── electron/
│   ├── main.js                 # Main Electron process
│   ├── preload.js              # Preload script
│   ├── docker-manager.js       # Docker container management
│   └── tray.js                 # System tray
├── frontend/                    # React frontend (existing)
│   ├── dist/                   # Built frontend
│   └── package.json
├── backend/                     # FastAPI backend (existing)
│   ├── Dockerfile
│   └── requirements.txt
├── docker/
│   ├── docker-compose.yml      # Container orchestration
│   └── .env.example            # Environment template
├── resources/
│   ├── icon.ico               # Windows icon
│   └── tray-icon.png          # System tray icon
├── scripts/
│   ├── check-docker.js        # Docker Desktop check
│   └── install-docker.ps1     # Docker installation script
├── package.json               # Root package.json
└── electron-builder.yml       # Build configuration
```

---

## Implementation Plan

### Phase 1: Docker Management in Electron

#### 1.1 Install Dependencies
```bash
cd Compliance-Tracker-Notifier
npm init -y
npm install --save-dev electron electron-builder electron-is-dev
npm install dockerode  # Docker API for Node.js
npm install --save-dev concurrently wait-on cross-env
```

#### 1.2 Docker Manager Module
**File: `electron/docker-manager.js`**

```javascript
const Docker = require('dockerode');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

class DockerManager {
  constructor() {
    this.docker = new Docker();
    this.containerName = 'compliance-tracker-backend';
    this.frontendContainerName = 'compliance-tracker-frontend';
    this.networkName = 'compliance-network';
  }

  // Check if Docker Desktop is running
  async isDockerRunning() {
    try {
      await this.docker.ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Start Docker Desktop
  async startDockerDesktop() {
    return new Promise((resolve, reject) => {
      exec('start "" "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe"', (error) => {
        if (error) {
          reject(error);
        } else {
          // Wait for Docker to be ready
          this.waitForDocker().then(resolve).catch(reject);
        }
      });
    });
  }

  // Wait for Docker to be ready
  async waitForDocker(maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      if (await this.isDockerRunning()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    throw new Error('Docker failed to start');
  }

  // Check if containers are running
  async areContainersRunning() {
    try {
      const containers = await this.docker.listContainers();
      const backendRunning = containers.some(c => 
        c.Names.some(name => name.includes(this.containerName))
      );
      return backendRunning;
    } catch (error) {
      return false;
    }
  }

  // Start containers using docker-compose
  async startContainers(appPath) {
    return new Promise((resolve, reject) => {
      const composePath = path.join(appPath, 'docker', 'docker-compose.yml');
      const cmd = `docker-compose -f "${composePath}" up -d`;
      
      exec(cmd, { cwd: path.dirname(composePath) }, (error, stdout, stderr) => {
        if (error) {
          console.error('Docker compose error:', stderr);
          reject(error);
        } else {
          console.log('Containers started:', stdout);
          resolve();
        }
      });
    });
  }

  // Stop containers
  async stopContainers(appPath) {
    return new Promise((resolve, reject) => {
      const composePath = path.join(appPath, 'docker', 'docker-compose.yml');
      const cmd = `docker-compose -f "${composePath}" down`;
      
      exec(cmd, { cwd: path.dirname(composePath) }, (error, stdout, stderr) => {
        if (error) {
          console.error('Docker compose stop error:', stderr);
          reject(error);
        } else {
          console.log('Containers stopped:', stdout);
          resolve();
        }
      });
    });
  }

  // Get container logs
  async getContainerLogs(containerName) {
    try {
      const container = this.docker.getContainer(containerName);
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail: 100
      });
      return logs.toString();
    } catch (error) {
      return `Error getting logs: ${error.message}`;
    }
  }
}

module.exports = DockerManager;
```

#### 1.3 Main Electron Process
**File: `electron/main.js`**

```javascript
const { app, BrowserWindow, Tray, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const DockerManager = require('./docker-manager');

let mainWindow;
let tray;
let dockerManager;

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
        dialog.showErrorBox('Error', 'Failed to start Docker Desktop. Please start it manually.');
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
      await dockerManager.startContainers(appPath);
      
      // Wait for backend to be ready
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      dialog.showErrorBox('Error', `Failed to start containers: ${error.message}`);
      app.quit();
      return;
    }
  }

  createWindow();
  createTray();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(__dirname, '../resources/icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load frontend from Docker container
  mainWindow.loadURL('http://localhost:3001');

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  const iconPath = path.join(__dirname, '../resources/tray-icon.png');
  tray = new Tray(iconPath);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => mainWindow.show()
    },
    {
      label: 'Hide App',
      click: () => mainWindow.hide()
    },
    { type: 'separator' },
    {
      label: 'View Logs',
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
    { type: 'separator' },
    {
      label: 'Quit',
      click: async () => {
        app.isQuitting = true;
        
        // Stop containers
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
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
}

app.whenReady().then(startApplication);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Don't quit, just hide
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
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
    event.reply('containers-restarted', { success: true });
  } catch (error) {
    event.reply('containers-restarted', { success: false, error: error.message });
  }
});
```

---

### Phase 2: Docker Compose Configuration

#### 2.1 Update docker-compose.yml for Desktop
**File: `docker/docker-compose.yml`**

```yaml
version: '3.8'

services:
  backend:
    build: ../backend
    container_name: compliance-tracker-backend
    ports:
      - "8000:8000"
    volumes:
      - backend-data:/app/data
    environment:
      - DATABASE_URL=sqlite:////app/data/compliance_tracker.db
      - SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL:-}
    networks:
      - compliance-network
    restart: unless-stopped

  frontend:
    build: ../frontend
    container_name: compliance-tracker-frontend
    ports:
      - "3001:3000"
    depends_on:
      - backend
    networks:
      - compliance-network
    restart: unless-stopped

networks:
  compliance-network:
    driver: bridge

volumes:
  backend-data:
    driver: local
```

---

### Phase 3: Electron Builder Configuration

#### 3.1 Package.json Scripts
**File: `package.json`**

```json
{
  "name": "compliance-tracker-desktop",
  "version": "1.0.0",
  "description": "Compliance Tracker Desktop Application",
  "main": "electron/main.js",
  "scripts": {
    "start": "electron .",
    "dev": "electron .",
    "build": "electron-builder",
    "build:win": "electron-builder --win --x64",
    "pack": "electron-builder --dir"
  },
  "dependencies": {
    "dockerode": "^4.0.0",
    "electron-is-dev": "^2.0.0"
  },
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.9.1"
  }
}
```

#### 3.2 Electron Builder Configuration
**File: `electron-builder.yml`**

```yaml
appId: com.companyname.compliancetracker
productName: Compliance Tracker
copyright: Copyright © 2024

directories:
  buildResources: resources
  output: dist-electron

files:
  - electron/**/*
  - docker/**/*
  - backend/**/*
  - frontend/**/*
  - resources/**/*
  - package.json
  - "!**node_modules/**"
  - "!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}"

extraResources:
  - from: docker
    to: docker
  - from: backend
    to: backend
  - from: frontend/dist
    to: frontend/dist

win:
  target:
    - nsis
  icon: resources/icon.ico
  artifactName: ${productName}-Setup-${version}.${ext}

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  createStartMenuShortcut: true
  shortcutName: Compliance Tracker
  runAfterFinish: true
  installerIcon: resources/icon.ico
  uninstallerIcon: resources/icon.ico
  license: LICENSE
  include: scripts/installer.nsh

publish:
  provider: generic
  url: https://your-update-server.com
```

#### 3.3 NSIS Installer Script
**File: `scripts/installer.nsh`**

```nsis
!macro customInstall
  ; Check if Docker Desktop is installed
  ReadRegStr $0 HKLM "SOFTWARE\Docker Inc.\Docker\1.0" "AppPath"
  ${If} $0 == ""
    MessageBox MB_YESNO "Docker Desktop is not installed. Would you like to download it now?" IDYES download IDNO skip
    download:
      ExecShell "open" "https://www.docker.com/products/docker-desktop"
    skip:
  ${EndIf}
!macroend

!macro customUnInstall
  ; Stop Docker containers
  nsExec::ExecToLog 'docker-compose -f "$INSTDIR\resources\docker\docker-compose.yml" down'
!macroend
```

---

### Phase 4: Auto-Start Configuration

#### 4.1 Windows Auto-Start
```javascript
// In electron/main.js
const AutoLaunch = require('auto-launch');

const autoLauncher = new AutoLaunch({
  name: 'Compliance Tracker',
  path: app.getPath('exe'),
  isHidden: true  // Start minimized to tray
});

app.whenReady().then(() => {
  // Enable auto-start
  autoLauncher.isEnabled().then((isEnabled) => {
    if (!isEnabled) {
      autoLauncher.enable();
    }
  });
});
```

Install dependency:
```bash
npm install --save auto-launch
```

---

### Phase 5: Build Process

#### 5.1 Pre-Build Steps
```bash
# 1. Build frontend
cd frontend
npm install
npm run build
cd ..

# 2. Ensure Docker images are built
cd docker
docker-compose build
cd ..

# 3. Install Electron dependencies
npm install
```

#### 5.2 Build Desktop App
```bash
# Build installer
npm run build:win

# Output: dist-electron/Compliance Tracker-Setup-1.0.0.exe
```

---

## User Installation Flow

### First-Time Setup

1. **User runs installer** (`Compliance Tracker-Setup-1.0.0.exe`)
2. **Installer checks for Docker Desktop**
   - If not installed: Prompts to download
   - If installed: Continues
3. **Application installs** to `C:\Program Files\Compliance Tracker`
4. **Desktop shortcut created**
5. **Auto-start configured**

### Application Startup

1. **User launches app** (or auto-starts on boot)
2. **App checks Docker Desktop status**
   - If not running: Starts Docker Desktop automatically
   - Waits for Docker to be ready
3. **App starts Docker containers**
   - Backend container (FastAPI)
   - Frontend container (React)
4. **Main window opens** loading `http://localhost:3001`
5. **System tray icon appears**

### Daily Usage

- **Minimize to tray**: App runs in background
- **Native notifications**: Windows notifications for tasks
- **Quick access**: Click tray icon to show/hide
- **Auto-updates**: Check for updates on startup

---

## Advantages of Docker Approach

| Feature | Docker Approach | PyInstaller Approach |
|---------|----------------|---------------------|
| **Reliability** | ✅ Exact dev environment | ⚠️ Packaging issues |
| **Updates** | ✅ Easy container updates | ⚠️ Full rebuild needed |
| **Dependencies** | ✅ Isolated in containers | ⚠️ Dependency conflicts |
| **Database** | ✅ Volume persistence | ✅ File-based |
| **Debugging** | ✅ Easy with logs | ⚠️ Harder to debug |
| **Size** | ~50 MB + Docker | ~150-200 MB |
| **Setup** | Requires Docker Desktop | Standalone |

---

## Troubleshooting

### Docker Desktop Not Starting
```javascript
// Add retry logic in docker-manager.js
async startDockerDesktop(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await this._startDocker();
      return true;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}
```

### Containers Not Starting
```javascript
// Add health check
async waitForBackend(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch('http://localhost:8000/health');
      if (response.ok) return true;
    } catch (error) {
      // Continue waiting
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  throw new Error('Backend failed to start');
}
```

### Port Conflicts
```javascript
// Check if ports are available
async checkPorts() {
  const ports = [8000, 3001];
  for (const port of ports) {
    const inUse = await this.isPortInUse(port);
    if (inUse) {
      throw new Error(`Port ${port} is already in use`);
    }
  }
}
```

---

## Testing Checklist

- [ ] Docker Desktop detection works
- [ ] Docker Desktop auto-start works
- [ ] Containers start successfully
- [ ] Frontend loads correctly
- [ ] Backend API responds
- [ ] Database persists data
- [ ] System tray icon appears
- [ ] Minimize to tray works
- [ ] Native notifications work
- [ ] Auto-start on boot works
- [ ] Installer creates shortcuts
- [ ] Uninstaller stops containers
- [ ] App updates work
- [ ] Logs are accessible

---

## Distribution

### Installer Package Contents
- Electron application (~50 MB)
- Docker Compose files
- Frontend build
- Backend source (for Docker build)
- Resources (icons, etc.)

### System Requirements
- Windows 10/11 (64-bit)
- Docker Desktop for Windows
- 4 GB RAM minimum
- 2 GB disk space

---

## Next Steps

1. ✅ Review this Docker-based approach
2. Set up Electron project structure
3. Implement Docker manager
4. Configure docker-compose for desktop
5. Build and test installer
6. Create user documentation
7. Deploy and distribute

---

## Estimated Timeline

- **Phase 1**: Docker Manager - 2-3 hours
- **Phase 2**: Docker Compose Config - 1 hour
- **Phase 3**: Electron Builder - 2 hours
- **Phase 4**: Auto-Start - 1 hour
- **Phase 5**: Build & Test - 2-3 hours
- **Total**: 8-10 hours

---

**This approach is more reliable than PyInstaller and leverages your existing Docker setup!**

Ready to implement?