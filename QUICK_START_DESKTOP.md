# Quick Start Guide - Desktop Application

## 🚀 Running the Desktop Application

### Option 1: Development Mode (Recommended for Testing)

**Prerequisites:**
- Docker Desktop installed and running
- Node.js installed

**Steps:**
```bash
# Navigate to project directory
cd C:\Users\002KZQ744\Downloads\bob-demo\Compliance-Tracker-Notifier

# Run in development mode
npm run dev
```

**What happens:**
1. Electron starts and checks for Docker Desktop
2. If Docker isn't running, it starts automatically
3. Backend and frontend containers launch via docker-compose
4. Application window opens at http://localhost:3001
5. System tray icon appears

**Development Features:**
- Hot reload enabled
- DevTools accessible (F12)
- Console logs visible
- Easy debugging

---

### Option 2: Production Installer (For Distribution)

**Build the installer:**
```bash
cd C:\Users\002KZQ744\Downloads\bob-demo\Compliance-Tracker-Notifier
npm run build:win
```

**Installer location:**
```
C:\Users\002KZQ744\Downloads\bob-demo\Compliance-Tracker-Notifier\dist-electron\Compliance Tracker-Setup-1.0.0.exe
```

**Installation:**
1. Double-click the installer
2. Follow installation wizard
3. Choose installation directory
4. Create desktop shortcut (optional)
5. Launch application

---

## 📁 Project Structure

```
Compliance-Tracker-Notifier/
├── electron/                    # Desktop app code
│   ├── main.js                 # Main Electron process
│   ├── preload.js              # Security bridge
│   └── docker-manager.js       # Docker management
├── frontend/                    # React web app
│   └── dist/                   # Production build
├── backend/                     # FastAPI backend
├── resources/                   # App icons
│   ├── icon.png                # Main icon (512x512)
│   └── tray-icon.png           # Tray icon (32x32)
├── docker-compose.yml          # Container configuration
└── package.json                # Electron configuration
```

---

## 🎯 Key Features

### 1. Auto Docker Management
- Automatically starts Docker Desktop if not running
- Launches backend and frontend containers
- Health checks ensure services are ready
- Graceful shutdown on exit

### 2. System Tray Integration
Right-click tray icon for:
- **Show/Hide** - Toggle window visibility
- **View Logs** - See container logs
- **Restart** - Restart containers
- **Quit** - Stop containers and exit

### 3. Native Notifications
- Task reminders at scheduled times
- Login notifications
- Windows 10/11 notification center integration

### 4. Auto-Launch
- Starts with Windows (optional)
- Minimizes to tray on startup
- Containers start automatically

---

## 🔧 Troubleshooting

### Docker Desktop Not Starting
**Problem:** "Docker Desktop is not running"

**Solution:**
1. Manually start Docker Desktop from Start Menu
2. Wait for Docker to fully start (whale icon in tray)
3. Restart the application

### Port Conflicts
**Problem:** "Port 8000 or 3001 already in use"

**Solution:**
1. Stop other applications using these ports
2. Or modify ports in `docker-compose.yml`
3. Restart containers

### Application Won't Start
**Problem:** App crashes on startup

**Solution:**
1. Ensure Docker Desktop is installed
2. Check Docker Desktop is running
3. Try: `npm run dev` to see error messages
4. Check logs in system tray menu

---

## 📊 System Requirements

**Minimum:**
- Windows 10/11 (64-bit)
- 4GB RAM
- 2GB free disk space
- Docker Desktop for Windows

**Recommended:**
- Windows 11 (64-bit)
- 8GB RAM
- SSD storage
- Docker Desktop running

---

## 🎨 Customization

### Change Application Icon
1. Replace `resources/icon.png` (512x512)
2. Replace `resources/tray-icon.png` (32x32)
3. Rebuild: `npm run build:win`

### Modify Ports
Edit `docker-compose.yml`:
```yaml
services:
  backend:
    ports:
      - "8000:8000"  # Change first number
  frontend:
    ports:
      - "3001:80"    # Change first number
```

### Disable Auto-Launch
Right-click system tray icon → Uncheck "Launch on Startup"

---

## 📝 Development Commands

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build frontend only
npm run build:frontend

# Build Windows installer
npm run build:win

# Package without installer
npm run pack
```

---

## 🔐 Security Notes

- Application uses context isolation for security
- Docker containers run with user permissions
- Backend API only accessible on localhost
- No external network exposure by default

---

## 📚 Additional Resources

- Full documentation: `DESKTOP_APP_GUIDE.md`
- Web app features: `README.md`
- Docker configuration: `docker-compose.yml`
- Electron configuration: `package.json`

---

## 🆘 Getting Help

1. Check `DESKTOP_APP_GUIDE.md` for detailed information
2. View container logs via system tray menu
3. Check Docker Desktop status
4. Try restarting application and containers

---

## 📦 Distribution

To share the application:

1. Build installer: `npm run build:win`
2. Share file: `dist-electron/Compliance Tracker-Setup-1.0.0.exe`
3. Users need Docker Desktop installed
4. Installer size: ~150-200 MB

---

## ✅ Quick Checklist

Before running:
- [ ] Docker Desktop installed
- [ ] Docker Desktop running
- [ ] Node.js installed (for dev mode)
- [ ] Ports 8000 and 3001 available

For production:
- [ ] Build completed successfully
- [ ] Installer tested
- [ ] Docker Desktop requirement communicated to users

---

**Version:** 1.0.0  
**Last Updated:** 2026-05-22