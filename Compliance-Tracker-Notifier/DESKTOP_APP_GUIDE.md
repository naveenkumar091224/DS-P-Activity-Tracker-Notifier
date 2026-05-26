# Compliance Tracker Desktop Application Guide

## Overview

This guide explains how to build, run, and distribute the Compliance Tracker as a Windows desktop application using Electron and Docker.

## Architecture

The desktop application uses:
- **Electron**: Cross-platform desktop framework
- **Docker Desktop**: Runs backend (FastAPI) and frontend (Vite/React) containers
- **dockerode**: Node.js Docker API client for container management
- **electron-builder**: Packages the app as a Windows installer (.exe)

## Prerequisites

### Required Software
1. **Node.js** (v18 or higher)
2. **Docker Desktop** for Windows
3. **npm** (comes with Node.js)

### Installation Steps
```bash
# Install Node.js from https://nodejs.org/
# Install Docker Desktop from https://www.docker.com/products/docker-desktop/

# Verify installations
node --version
npm --version
docker --version
```

## Project Structure

```
Compliance-Tracker-Notifier/
├── electron/                    # Electron main process files
│   ├── main.js                 # Main Electron process
│   ├── preload.js              # Security bridge (context isolation)
│   └── docker-manager.js       # Docker Desktop & container management
├── resources/                   # Application icons
│   ├── icon.ico                # Windows app icon (256x256)
│   ├── icon.png                # High-res icon (512x512)
│   └── tray-icon.png           # System tray icon (16x16 or 32x32)
├── frontend/                    # React frontend (Vite)
├── backend/                     # FastAPI backend
├── docker-compose.yml          # Docker services configuration
└── package.json                # Electron project configuration
```

## Building the Desktop Application

### Step 1: Install Dependencies

```bash
# Navigate to project root
cd Compliance-Tracker-Notifier

# Install Electron dependencies
npm install
```

### Step 2: Build Frontend for Production

```bash
# Navigate to frontend directory
cd frontend

# Build production bundle
npm run build

# Return to root
cd ..
```

### Step 3: Create Application Icons

Create the following icons in the `resources/` directory:

1. **icon.ico** (256x256 or multi-resolution)
   - Main application icon for Windows
   - Should contain: 16x16, 32x32, 48x48, 256x256

2. **icon.png** (512x512)
   - High-resolution PNG for installer
   - Transparent background recommended

3. **tray-icon.png** (16x16 or 32x32)
   - System tray icon
   - Simple, recognizable design
   - Visible on both light and dark backgrounds

**Icon Creation Tools:**
- Online: https://www.icoconverter.com/
- Desktop: GIMP, Photoshop, Paint.NET
- Quick test: Copy any .ico from `C:\Windows\System32\`

### Step 4: Test in Development Mode

```bash
# Start Electron in development mode
npm run dev
```

**What happens:**
1. Electron checks if Docker Desktop is installed
2. Starts Docker Desktop if not running
3. Launches backend and frontend containers via docker-compose
4. Opens application window loading http://localhost:3001
5. Creates system tray icon

**Development Mode Features:**
- Hot reload for Electron code changes
- DevTools enabled (F12)
- Console logs visible
- Container logs accessible via tray menu

### Step 5: Build Windows Installer

```bash
# Build .exe installer
npm run build:win
```

**Build Output:**
```
dist-electron/
├── win-unpacked/                    # Unpacked application files
│   └── Compliance Tracker.exe       # Executable (not installer)
└── Compliance Tracker Setup 1.0.0.exe  # Windows installer
```

**Installer Size:** ~150-200 MB (includes Electron runtime)

## Running the Desktop Application

### First-Time Setup

1. **Install Docker Desktop**
   - Download from https://www.docker.com/products/docker-desktop/
   - Run installer and restart computer
   - Launch Docker Desktop and wait for it to start

2. **Install Compliance Tracker**
   - Run `Compliance Tracker Setup 1.0.0.exe`
   - Follow installation wizard
   - Choose installation directory
   - Create desktop shortcut (optional)

3. **Launch Application**
   - Double-click desktop shortcut or
   - Find in Start Menu: "Compliance Tracker"

### Application Startup Flow

1. **Docker Check**
   - App verifies Docker Desktop is installed
   - If not found, shows error dialog with download link

2. **Docker Startup**
   - If Docker Desktop is not running, app starts it automatically
   - Shows "Starting Docker Desktop..." message
   - Waits up to 60 seconds for Docker to be ready

3. **Container Launch**
   - Runs `docker-compose up -d` in project directory
   - Starts backend (FastAPI on port 8000)
   - Starts frontend (Nginx on port 3001)
   - Waits for backend health check

4. **Window Display**
   - Opens Electron window loading http://localhost:3001
   - Window size: 1280x800
   - Minimum size: 800x600

5. **System Tray**
   - App minimizes to system tray when closed
   - Right-click tray icon for menu:
     - Show/Hide Window
     - View Container Logs
     - Restart Containers
     - Quit Application

## Features

### Auto-Launch on Windows Startup
- Enabled by default
- App starts minimized to tray
- Containers start automatically
- Disable in system tray menu

### System Tray Integration
- **Show/Hide**: Toggle main window visibility
- **View Logs**: Opens terminal with container logs
- **Restart**: Restarts Docker containers
- **Quit**: Stops containers and exits app

### Native Notifications
- Windows 10/11 notification support
- Task reminders at scheduled times
- Login notifications
- Clickable notifications (focus app window)

### Container Management
- Automatic Docker Desktop startup
- Health checks for backend readiness
- Graceful container shutdown on exit
- Error handling and retry logic

## Configuration

### Electron Configuration (package.json)

```json
{
  "name": "compliance-tracker-desktop",
  "version": "1.0.0",
  "main": "electron/main.js",
  "scripts": {
    "dev": "electron .",
    "build:win": "electron-builder --win"
  },
  "build": {
    "appId": "com.compliancetracker.app",
    "productName": "Compliance Tracker",
    "win": {
      "target": "nsis",
      "icon": "resources/icon.ico"
    }
  }
}
```

### Docker Configuration (docker-compose.yml)

```yaml
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=sqlite:///./compliance.db
    volumes:
      - ./backend:/app
      - ./backend/compliance.db:/app/compliance.db

  frontend:
    build: ./frontend
    ports:
      - "3001:80"
    depends_on:
      - backend
```

## Troubleshooting

### Docker Desktop Not Starting

**Problem:** "Docker Desktop is not running"

**Solutions:**
1. Manually start Docker Desktop from Start Menu
2. Restart computer
3. Reinstall Docker Desktop
4. Check Windows Services: "Docker Desktop Service" should be running

### Containers Not Starting

**Problem:** "Failed to start containers"

**Solutions:**
1. Check Docker Desktop is running
2. Open terminal and run: `docker-compose up`
3. Check for port conflicts (8000, 3001)
4. View logs: Right-click tray icon → View Container Logs

### Port Already in Use

**Problem:** "Port 8000 or 3001 already in use"

**Solutions:**
1. Stop other applications using these ports
2. Change ports in docker-compose.yml
3. Restart Docker Desktop

### Application Won't Start

**Problem:** App crashes on startup

**Solutions:**
1. Check Docker Desktop is installed and running
2. Delete `node_modules` and run `npm install`
3. Rebuild frontend: `cd frontend && npm run build`
4. Check logs in: `%APPDATA%\compliance-tracker-desktop\logs\`

### Icons Not Showing

**Problem:** Default Electron icon appears

**Solutions:**
1. Ensure icons exist in `resources/` directory
2. Rebuild application: `npm run build:win`
3. Clear icon cache: Delete `%LOCALAPPDATA%\IconCache.db`

## Development

### Modifying the Desktop App

1. **Edit Electron Code**
   ```bash
   # Edit files in electron/ directory
   # Test changes
   npm run dev
   ```

2. **Edit Frontend**
   ```bash
   cd frontend
   # Make changes to React components
   npm run dev  # Test in browser
   npm run build  # Build for Electron
   ```

3. **Edit Backend**
   ```bash
   cd backend
   # Make changes to FastAPI code
   # Restart containers via tray menu
   ```

### Debugging

**Enable DevTools:**
```javascript
// In electron/main.js
mainWindow.webContents.openDevTools();
```

**View Electron Logs:**
```bash
# Windows
%APPDATA%\compliance-tracker-desktop\logs\main.log
```

**View Container Logs:**
```bash
docker-compose logs -f
```

## Distribution

### Creating Installer

```bash
# Build Windows installer
npm run build:win

# Output: dist-electron/Compliance Tracker Setup 1.0.0.exe
```

### Installer Features
- NSIS-based Windows installer
- Automatic uninstaller creation
- Start Menu shortcuts
- Desktop shortcut (optional)
- Add/Remove Programs entry

### Sharing the Application

1. **Share Installer**
   - Distribute `Compliance Tracker Setup 1.0.0.exe`
   - Users need Docker Desktop installed
   - ~150-200 MB file size

2. **Requirements for Users**
   - Windows 10/11 (64-bit)
   - Docker Desktop for Windows
   - 4GB RAM minimum
   - 2GB free disk space

3. **Installation Instructions**
   - Install Docker Desktop first
   - Run Compliance Tracker installer
   - Launch application
   - Wait for containers to start

## Security Considerations

### Context Isolation
- Enabled by default in preload.js
- Prevents renderer process from accessing Node.js APIs directly
- Uses contextBridge for safe IPC

### Docker Security
- Containers run with user permissions
- No privileged mode required
- Data persisted in Docker volumes

### Network Security
- Backend API only accessible on localhost
- No external network exposure
- CORS configured for localhost only

## Performance

### Startup Time
- Cold start: 30-60 seconds (Docker + containers)
- Warm start: 10-20 seconds (Docker running)
- Container restart: 5-10 seconds

### Resource Usage
- RAM: 500MB-1GB (Electron + containers)
- CPU: Low (idle), Medium (startup)
- Disk: 2GB (app + Docker images)

### Optimization Tips
1. Keep Docker Desktop running
2. Enable auto-launch for faster access
3. Use SSD for better container performance
4. Close unused containers

## Future Enhancements

### Planned Features
- [ ] Auto-update functionality
- [ ] Offline mode support
- [ ] Custom notification sounds
- [ ] Multiple database profiles
- [ ] Export/import data
- [ ] Dark mode toggle
- [ ] Keyboard shortcuts
- [ ] Multi-language support

### Known Limitations
- Requires Docker Desktop (large dependency)
- Windows-only (can be extended to macOS/Linux)
- No offline functionality
- Large installer size

## Support

### Getting Help
1. Check this guide first
2. View container logs for errors
3. Check Docker Desktop status
4. Restart application and containers

### Common Issues
- Docker not installed → Install Docker Desktop
- Containers not starting → Check Docker Desktop
- Port conflicts → Change ports in docker-compose.yml
- Slow startup → Normal for first launch

## License

This desktop application is part of the Compliance Tracker project.
See main project LICENSE file for details.

## Credits

Built with:
- Electron (https://www.electronjs.org/)
- Docker (https://www.docker.com/)
- React (https://react.dev/)
- FastAPI (https://fastapi.tiangolo.com/)