# Setup Guide - DS&P Activity Tracker Notifier

This repository contains the **Compliance Tracker** application - a comprehensive multi-project task management system for tracking compliance activities.

## 📋 Prerequisites

Before your teammates can run this application, they need to have the following installed:

### Required Software

1. **Docker Desktop** (Required for running the application)
   - Windows: [Download Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
   - Mac: [Download Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/)
   - Linux: [Install Docker Engine](https://docs.docker.com/engine/install/)
   
2. **Git** (For cloning the repository)
   - [Download Git](https://git-scm.com/downloads)

3. **Node.js** (Optional - only needed for desktop app development)
   - [Download Node.js LTS](https://nodejs.org/)

## 🚀 Quick Start for Teammates

### Step 1: Clone the Repository

```bash
git clone https://github.com/naveenkumar091224/DS-P-Activity-Tracker-Notifier.git
cd DS-P-Activity-Tracker-Notifier
```

### Step 2: Navigate to the Application Directory

```bash
cd Compliance-Tracker-Notifier
```

### Step 3: Start the Application with Docker

**For Windows (PowerShell):**
```powershell
docker-compose up --build
```

**For Mac/Linux (Terminal):**
```bash
docker-compose up --build
```

> **Note:** First-time startup may take 3-5 minutes to download and build Docker images.

### Step 4: Access the Application

Once the containers are running, open your browser and navigate to:

- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### Step 5: Stop the Application

Press `Ctrl+C` in the terminal, then run:

```bash
docker-compose down
```

## 📁 Project Structure

```
DS-P-Activity-Tracker-Notifier/
├── Compliance-Tracker-Notifier/    # Main application
│   ├── backend/                     # Python FastAPI backend
│   ├── frontend/                    # React TypeScript frontend
│   ├── electron/                    # Desktop app (optional)
│   ├── docker-compose.yml          # Docker configuration
│   ├── README.md                   # Detailed documentation
│   └── QUICK_START.md              # Quick start guide
├── bob-get-started/                # Demo projects
├── galaxium-travels/               # Sample travel booking system
└── task-notifier/                  # Legacy compliance tracker
```

## 🎯 What Your Teammates Can Do

### 1. Run the Web Application (Recommended)
- Uses Docker Compose
- No additional setup required
- Works on Windows, Mac, and Linux
- Access via browser at http://localhost:3000

### 2. Run the Desktop Application (Advanced)
- Requires Node.js installation
- See `Compliance-Tracker-Notifier/DESKTOP_APP_GUIDE.md`
- Standalone executable for Windows

## 📖 Detailed Documentation

For comprehensive documentation, refer to:

1. **Main Application Guide**: `Compliance-Tracker-Notifier/README.md`
2. **Quick Start**: `Compliance-Tracker-Notifier/QUICK_START.md`
3. **Desktop App**: `Compliance-Tracker-Notifier/DESKTOP_APP_GUIDE.md`
4. **Troubleshooting**: `Compliance-Tracker-Notifier/TROUBLESHOOTING.md`

## 🔧 Common Issues and Solutions

### Issue 1: Port Already in Use

**Problem:** Error message about port 3000 or 8000 already in use.

**Solution:**
```bash
# Stop the application
docker-compose down

# Edit docker-compose.yml and change the ports
# Change "3000:3000" to "3001:3000" for frontend
# Change "8000:8000" to "8001:8000" for backend
```

### Issue 2: Docker Not Running

**Problem:** "Cannot connect to Docker daemon" error.

**Solution:**
- Ensure Docker Desktop is running
- On Windows: Check system tray for Docker icon
- On Mac: Check menu bar for Docker icon
- Restart Docker Desktop if needed

### Issue 3: Permission Denied (Linux)

**Problem:** Permission errors when running Docker commands.

**Solution:**
```bash
# Add your user to the docker group
sudo usermod -aG docker $USER

# Log out and log back in for changes to take effect
```

### Issue 4: Excel Import Fails

**Problem:** Excel file upload doesn't work.

**Solution:**
- Ensure Excel file matches the expected format
- Check that all required columns are present
- Verify date format is DD-MMM-YY (e.g., 15-Feb-26)
- See `Compliance-Tracker-Notifier/README.md` for column details

## 🔄 Updating the Application

When you pull new changes from the repository:

```bash
# Pull latest changes
git pull origin main

# Navigate to application directory
cd Compliance-Tracker-Notifier

# Rebuild and restart containers
docker-compose down
docker-compose up --build
```

## 💾 Data Persistence

- All data is stored in Docker volumes
- Data persists between container restarts
- To reset the database:
  ```bash
  docker-compose down
  docker volume rm compliance-tracker-notifier_backend-data
  docker-compose up --build
  ```

## 🤝 Team Collaboration

### For Development Work

1. **Create a new branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**

3. **Commit and push:**
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin feature/your-feature-name
   ```

4. **Create a Pull Request** on GitHub

### For Using the Application

- Simply clone and run with Docker
- No code changes needed
- All teammates can use the same setup

## 📞 Support

If your teammates encounter issues:

1. Check the troubleshooting section above
2. Review `Compliance-Tracker-Notifier/TROUBLESHOOTING.md`
3. Check Docker Desktop is running and up to date
4. Ensure all prerequisites are installed
5. Try rebuilding containers: `docker-compose up --build`

## ✅ Verification Checklist

Before reporting issues, verify:

- [ ] Docker Desktop is installed and running
- [ ] Git is installed
- [ ] Repository is cloned successfully
- [ ] You're in the `Compliance-Tracker-Notifier` directory
- [ ] Ports 3000 and 8000 are not in use
- [ ] Docker containers are running (`docker ps`)
- [ ] You can access http://localhost:3000

## 🎓 Learning Resources

- **Docker Basics**: https://docs.docker.com/get-started/
- **React Documentation**: https://react.dev/
- **FastAPI Documentation**: https://fastapi.tiangolo.com/

---

**Built with ❤️ for efficient compliance tracking**

*Last Updated: May 2026*