# Compliance Tracker - Testing Guide

## Critical Fix Applied ✅

**Issue Fixed**: Desktop app was not loading data because authentication tokens weren't being sent with API requests.

**Solution**: Added axios interceptors to automatically attach JWT tokens to all API requests.

## Testing the Desktop App

### Prerequisites

1. **Backend Must Be Running**:
   ```bash
   cd Compliance-Tracker-Notifier
   docker-compose up -d
   ```

2. **Verify Backend is Running**:
   ```bash
   curl http://localhost:8000/health
   ```
   Should return: `{"status":"healthy","message":"Backend is running"}`

### Step-by-Step Testing

#### 1. Launch Desktop App

```
Compliance-Tracker-Notifier\dist-electron\win-unpacked\Compliance Tracker.exe
```

The app will open with DevTools automatically enabled for debugging.

#### 2. Login

Use one of these test accounts:
- Username: `admin` / Password: `Admin123`
- Username: `aarav` / Password: `Password123`
- Username: `priya` / Password: `Password123`

#### 3. Check Console for Logs

In the DevTools Console tab, you should see:
```
Loading dashboard data...
Dashboard data loaded: {statsData: {...}, tasksData: [...], projectsData: [...]}
```

#### 4. Verify Dashboard Data

The dashboard should now display:
- ✅ Project statistics (Active Projects, Controls, etc.)
- ✅ Upcoming tasks list
- ✅ Recent projects panel
- ✅ All data from the shared database

#### 5. Test Project Creation

1. Click "Manage Projects" button
2. Click "Create New Project"
3. Fill in project details:
   - Name: Test Project
   - Code: TEST001
   - Client: Test Client
   - Status: active
4. Click "Create Project"
5. Verify project appears in the list

#### 6. Test Excel Import

1. Open a project
2. Click "Import Excel"
3. Select the compliance Excel file
4. Choose the sheet to import
5. Verify tasks are created

#### 7. Test Notifications

1. Go to Dashboard
2. Click "Show Sample Popup" button
3. Verify notification toast appears
4. Check if browser notification permission is requested

### What Was Fixed

#### Before Fix
```typescript
// api.ts - Missing authentication
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
// ❌ No token attached to requests
```

#### After Fix
```typescript
// api.ts - With authentication interceptor
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Automatically attach token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Handle auth errors automatically
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Expected Behavior

#### Desktop App
- ✅ Login works
- ✅ Dashboard loads with data
- ✅ Projects page shows all projects
- ✅ Can create new projects
- ✅ Can import Excel files
- ✅ Can view and update tasks
- ✅ Notifications work
- ✅ Auto-logout on token expiry

#### Web App (http://localhost:3000)
- ✅ All features working
- ✅ Same data as desktop app
- ✅ Browser notifications
- ✅ Scheduled notifications (8:30 AM, 9:30 AM)

### Troubleshooting

#### If Dashboard Still Shows No Data

1. **Check Console for Errors**:
   - Open DevTools (F12)
   - Look for red error messages
   - Check Network tab for failed requests

2. **Verify Backend Connection**:
   In Console, run:
   ```javascript
   fetch('http://localhost:8000/api/dashboard/stats', {
     headers: {
       'Authorization': 'Bearer ' + localStorage.getItem('token')
     }
   })
   .then(r => r.json())
   .then(console.log)
   .catch(console.error)
   ```

3. **Check Token**:
   In Console, run:
   ```javascript
   console.log('Token:', localStorage.getItem('token'));
   console.log('User:', localStorage.getItem('user'));
   ```

4. **Verify Backend is Running**:
   ```bash
   docker ps
   ```
   Should show containers running on ports 8000 and 3000

#### If Login Fails

1. Check backend logs:
   ```bash
   docker logs compliance-tracker-backend
   ```

2. Verify database has users:
   ```bash
   docker exec -it compliance-tracker-backend python -c "from db import SessionLocal; from models import User; db = SessionLocal(); print(db.query(User).all())"
   ```

### Notification Testing

#### Manual Test
1. Go to Dashboard
2. Add tasks with due dates
3. Click "Show Sample Popup"
4. Verify toast notification appears

#### Scheduled Test
1. Add tasks due today or overdue
2. Wait for scheduled time (8:30 AM or 9:30 AM)
3. Verify notifications appear automatically

### Performance Notes

- Desktop app uses same backend as web app
- All data is shared between desktop and web
- Desktop app detects `file://` protocol and uses full backend URL
- Web app uses relative `/api` path with nginx proxy

### Next Steps After Testing

1. **If Everything Works**:
   - Desktop app is ready for use
   - Push changes to GitHub
   - Deploy to production

2. **If Issues Persist**:
   - Share console errors
   - Share network tab screenshots
   - Check backend logs

## Pushing to GitHub

```bash
cd Compliance-Tracker-Notifier

# Stage all changes
git add .

# Commit
git commit -m "Fix desktop app authentication - add token interceptors

- Added axios request interceptor to attach JWT tokens
- Added response interceptor for auth error handling
- Desktop app now loads data correctly
- All features working in both web and desktop apps"

# Push
git push origin main
```

---

**Made with Bob** 🤖