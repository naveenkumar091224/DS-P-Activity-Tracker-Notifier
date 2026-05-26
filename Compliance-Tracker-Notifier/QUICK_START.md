# Quick Start Guide - Compliance Tracker

## 🚀 Get Started in 3 Steps

### Step 1: Start the Application

Open PowerShell/Terminal and run:

```powershell
cd task-notifier/compliance-tracker
docker-compose up --build
```

Wait for the containers to start (first time may take 2-3 minutes).

### Step 2: Access the Application

Open your browser and go to:

**🌐 http://localhost:3000**

You should see the Compliance Tracker dashboard!

### Step 3: Create Your First Project

1. Click **"Projects"** in the navigation
2. Click **"+ New Project"**
3. Fill in:
   - **Name**: "Project Alpha"
   - **Code**: "PROJ-001"
   - **Start Date**: Today's date
4. Click **"Create Project"**

### Step 4: Upload Your Excel File

1. On the Projects page, find your new project
2. Click **"Choose File"** and select your SPL 2.1 Excel file
3. Click **"📤 Upload Excel"**
4. Wait for the success message

### Step 5: View Your Tasks

1. Click on the project name
2. See all imported tasks with their due dates
3. Click **"✓ Complete"** to mark tasks as done

## 📊 What You Can Do

### Dashboard
- View portfolio statistics
- See tasks due today and this week
- Track overdue tasks
- Monitor completion rates

### Projects
- Create unlimited projects
- Upload Excel files per project
- Delete projects when done
- Track project status

### Tasks
- View all tasks by project
- Filter by status (pending/completed)
- Mark tasks complete
- Track planned vs actual dates

## 🛑 Stop the Application

Press `Ctrl+C` in the terminal, then run:

```powershell
docker-compose down
```

## 📝 Excel File Format

Your Excel should have these columns:
- Control Objective
- Control Execution Tasks
- Control Guidance
- Frequency - Event Driven
- Frequency - Scheduled
- Planned Completion Date
- Actual Completion Date
- Assigned to
- Evidence storage location

## 🔗 Useful Links

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## ❓ Troubleshooting

**Port already in use?**
- Change ports in `docker-compose.yml`
- Use `3001:3000` instead of `3000:3000`

**Import fails?**
- Check Excel file format
- Ensure all columns are present
- Verify date format (DD-MMM-YY)

**Need to reset?**
```powershell
docker-compose down
Remove-Item backend/compliance_tracker.db
docker-compose up --build
```

## 🎯 Next Steps

1. Import all your project Excel files
2. Explore the dashboard
3. Mark completed tasks
4. Track your compliance progress!

---

**Need help?** Check the full README.md for detailed documentation.