# Troubleshooting Guide

## 🚨 Login/Registration Failed Error

If you're getting "Login Failed" or "Registration Failed" errors, follow these steps:

### Solution 1: Set Up Environment Variables (Most Common Issue)

The backend requires a JWT secret key for authentication. Here's how to fix it:

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a `.env` file from the example:**
   ```bash
   # On Windows (PowerShell)
   Copy-Item .env.example .env
   
   # On Mac/Linux
   cp .env.example .env
   ```

3. **Generate a secure secret key:**
   ```bash
   # Using Python
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   
   # Or use any random string (at least 32 characters)
   ```

4. **Edit the `.env` file and update the SECRET_KEY:**
   ```env
   SECRET_KEY=your-generated-secret-key-here
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ```

5. **Restart Docker containers:**
   ```bash
   cd ..  # Back to project root
   docker-compose down
   docker-compose up -d
   ```

### Solution 2: Check Docker Containers

Verify all containers are running:

```bash
docker-compose ps
```

You should see:
- `compliance-tracker-backend` - running
- `compliance-tracker-frontend` - running

If any container is not running:
```bash
docker-compose logs backend    # Check backend logs
docker-compose logs frontend   # Check frontend logs
```

### Solution 3: Database Issues

If the database is corrupted or missing:

```bash
# Stop containers
docker-compose down

# Remove the database volume
docker volume rm compliance-tracker-notifier_backend-data

# Restart
docker-compose up -d
```

### Solution 4: Port Conflicts

Check if ports 3000 (frontend) and 8000 (backend) are already in use:

```bash
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :8000

# Mac/Linux
lsof -i :3000
lsof -i :8000
```

If ports are in use, either:
- Stop the conflicting application
- Or modify `docker-compose.yml` to use different ports

## 🔍 Common Issues

### Issue: "Cannot connect to backend"

**Symptoms:** Frontend loads but can't reach the API

**Solution:**
1. Check backend is running: `docker-compose logs backend`
2. Verify backend URL in browser: http://localhost:8000/docs
3. Check CORS settings in `backend/server.py`

### Issue: "Docker Desktop not running"

**Symptoms:** `docker-compose` commands fail

**Solution:**
1. Start Docker Desktop
2. Wait for it to fully initialize (whale icon in system tray)
3. Try the command again

### Issue: "Permission denied" errors

**Symptoms:** Can't create files or directories

**Solution:**
```bash
# Windows: Run PowerShell as Administrator
# Mac/Linux: Use sudo
sudo docker-compose up -d
```

### Issue: Frontend shows blank page

**Symptoms:** Page loads but nothing displays

**Solution:**
1. Check browser console for errors (F12)
2. Clear browser cache
3. Rebuild frontend:
   ```bash
   docker-compose down
   docker-compose build frontend
   docker-compose up -d
   ```

## 📋 Quick Diagnostic Commands

Run these to diagnose issues:

```bash
# Check Docker is running
docker --version
docker-compose --version

# Check containers status
docker-compose ps

# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend

# Check backend health
curl http://localhost:8000/docs

# Check frontend
curl http://localhost:3000
```

## 🔧 Complete Reset

If nothing works, perform a complete reset:

```bash
# Stop everything
docker-compose down

# Remove all volumes and images
docker-compose down -v
docker system prune -a

# Pull fresh code
git pull origin main

# Set up environment
cd backend
cp .env.example .env
# Edit .env and add SECRET_KEY

# Rebuild and start
cd ..
docker-compose build
docker-compose up -d
```

## 📞 Getting Help

If you're still having issues:

1. **Check the logs:**
   ```bash
   docker-compose logs > debug.log
   ```

2. **Share the error message** with the team

3. **Include your environment:**
   - OS version
   - Docker Desktop version
   - Node.js version (if running desktop app)

## 🎯 Desktop Application Issues

### Issue: "Docker Desktop not found"

**Solution:**
1. Install Docker Desktop from https://www.docker.com/products/docker-desktop
2. Start Docker Desktop
3. Restart the application

### Issue: "Application won't start"

**Solution:**
1. Check Docker Desktop is running
2. Run as Administrator (Windows)
3. Check logs in the application menu

### Issue: "Containers won't start"

**Solution:**
1. Open Docker Desktop
2. Check for port conflicts
3. Ensure enough disk space (10GB minimum)

## ✅ Verification Steps

After fixing issues, verify everything works:

1. **Backend Health Check:**
   - Visit: http://localhost:8000/docs
   - Should see FastAPI documentation

2. **Frontend Access:**
   - Visit: http://localhost:3000
   - Should see login page

3. **Registration Test:**
   - Create a new user
   - Should redirect to login

4. **Login Test:**
   - Log in with created user
   - Should see dashboard

## 📝 Environment Variables Reference

Required variables in `backend/.env`:

```env
# Authentication (REQUIRED)
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Database (Optional - uses default)
DATABASE_URL=sqlite:////app/data/compliance_tracker.db

# Slack (Optional)
SLACK_WEBHOOK_URL=

# Notifications (Optional)
DAILY_SUMMARY_HOUR=9
DAILY_SUMMARY_MINUTE=0
```

## 🔐 Security Notes

- **Never commit `.env` files to Git**
- **Use strong SECRET_KEY in production**
- **Change default passwords**
- **Keep Docker Desktop updated**

---

**Still having issues?** Contact the development team or create an issue on GitHub.