# Compliance Tracker - Multi-Project Task Management System

A comprehensive application for managing compliance tasks across multiple projects with Excel import/export functionality.

## 🖥️ Now Available as Desktop Application!

**NEW:** Compliance Tracker is now available as a standalone desktop application for Windows, macOS, and Linux!

- 🚀 **One-Click Launch** - No Docker or server setup required
- 💾 **Local Data Storage** - All data stored securely on your computer
- 🔒 **Works Offline** - No internet required (except for Slack notifications)
- 🪟 **Native Experience** - Runs as a native desktop application

**[📥 Download Desktop App](DESKTOP_APP_GUIDE.md)** | **[🔨 Build Instructions](BUILD_INSTRUCTIONS.md)**

---

## 📦 Choose Your Version

| Feature | Desktop App | Docker/Web Version |
|---------|-------------|-------------------|
| **Setup** | One-click install | Requires Docker |
| **Best For** | End users, single machine | Teams, development |
| **Updates** | Auto-update | Manual rebuild |
| **Performance** | Native speed | Container overhead |
| **Documentation** | [Desktop Guide](DESKTOP_APP_GUIDE.md) | This README |

---

## Features

✅ **Multi-Project Management**
- Create, update, and delete projects dynamically
- No limit on number of projects
- Each project has its own task tracking

✅ **Excel Import/Export**
- Import SPL 2.1 DS&P Activity Tracker Excel files (.xlsx, .xlsm)
- Automatic control template creation
- Task instance generation for recurring tasks
- Support for Monthly, Quarterly, Annual, and Ongoing frequencies

✅ **Dashboard & Analytics**
- Portfolio overview with statistics
- Tasks due today, this week, and overdue tracking
- Project-specific task views
- Completion tracking

✅ **Task Management**
- Track planned vs actual completion dates
- Mark tasks as complete
- Filter by status (pending, completed)
- Evidence location tracking

## Technology Stack

### Backend
- **Python 3.11** with FastAPI
- **SQLAlchemy** ORM
- **SQLite** database
- **OpenPyXL** for Excel processing

### Frontend
- **React 18** with TypeScript
- **Vite** build tool
- **React Router** for navigation
- **Axios** for API calls

### DevOps
- **Docker** & **Docker Compose**
- Hot reload for development

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Git (to clone the repository)

### Installation & Running

1. **Navigate to the project directory:**
   ```bash
   cd task-notifier/compliance-tracker
   ```

2. **Start the application:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:8000
   - **API Documentation**: http://localhost:8000/docs

4. **Stop the application:**
   ```bash
   docker-compose down
   ```

## Usage Guide

### 1. Create a Project

1. Navigate to the **Projects** page
2. Click **"+ New Project"**
3. Fill in the project details:
   - Project Name (required)
   - Project Code (required)
   - Description (optional)
   - Start Date (required)
   - Client (optional)
4. Click **"Create Project"**

### 2. Upload Excel File

1. On the Projects page, find your project card
2. Click **"Choose File"** and select your SPL 2.1 Excel file
3. Click **"📤 Upload Excel"**
4. Wait for the import to complete
5. You'll see a success message with:
   - Number of controls created
   - Number of tasks created

### 3. View Project Tasks

1. Click on the project name to view details
2. See all tasks with:
   - Instance labels (Jan'26, Q1'26, etc.)
   - Planned dates
   - Actual completion dates
   - Status
3. Filter tasks by status (All, Pending, Completed)

### 4. Complete Tasks

1. In the project detail view
2. Find a pending task
3. Click **"✓ Complete"** button
4. The task will be marked as completed with the current date

### 5. Dashboard Overview

1. Navigate to the **Dashboard** (home page)
2. View portfolio statistics:
   - Total and active projects
   - Total and applicable controls
   - Tasks due today
   - Tasks due this week
   - Overdue tasks
   - Completed tasks
3. See upcoming tasks list

## Excel File Format

Your Excel file should have these columns:

| Column | Description | Example |
|--------|-------------|---------|
| Control Objective | High-level control goal | "Review risk log with management" |
| Control Execution Tasks | Detailed task description | "On a scheduled basis, review..." |
| Control Guidance | Reference code | "RSK 3.1" |
| Frequency - Event Driven | Trigger conditions | "When there is a change..." |
| Frequency - Scheduled | Regular schedule | "Monthly", "Quarterly", "Annually" |
| Planned Completion Date | Target deadline | "15-Feb-26" |
| Actual Completion Date | When completed | "6-Feb-26" |
| Assigned to | Team members | "DPE, PM, SE" |
| Evidence storage location | Where proof is stored | "IBM OneDrive" |

## API Endpoints

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/{id}` - Get project details
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project
- `POST /api/projects/{id}/import-excel` - Import Excel file

### Tasks
- `GET /api/projects/{id}/tasks` - Get project tasks
- `GET /api/tasks` - Get all tasks
- `PUT /api/tasks/{id}` - Update task
- `POST /api/tasks/{id}/complete` - Mark task complete

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Control Templates
- `GET /api/control-templates` - List all control templates

## Development

### Backend Development

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn server:app --reload
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
compliance-tracker/
├── backend/
│   ├── models.py              # Database models
│   ├── schemas.py             # Pydantic schemas
│   ├── db.py                  # Database connection
│   ├── server.py              # FastAPI application
│   ├── excel_service.py       # Excel import logic
│   ├── requirements.txt       # Python dependencies
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── ProjectList.tsx
│   │   │   └── ProjectDetail.tsx
│   │   ├── types.ts           # TypeScript types
│   │   ├── api.ts             # API client
│   │   ├── App.tsx            # Main app component
│   │   ├── App.css            # Styles
│   │   └── main.tsx           # Entry point
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Database Schema

### Projects
- Stores project information
- Links to project controls and tasks

### Control Templates
- Master library of all controls
- Reused across projects

### Project Controls
- Maps which controls apply to which projects
- Tracks applicability

### Task Instances
- Individual task occurrences
- Tracks planned vs actual dates
- Status tracking

## Troubleshooting

### Port Already in Use
If ports 3000 or 8000 are already in use:

```bash
# Stop the containers
docker-compose down

# Change ports in docker-compose.yml
# For example, change "3000:3000" to "3001:3000"
```

### Excel Import Fails
- Ensure your Excel file matches the expected format
- Check that all required columns are present
- Verify date formats (DD-MMM-YY, e.g., 15-Feb-26)

### Database Issues
To reset the database:

```bash
docker-compose down
rm backend/compliance_tracker.db
docker-compose up --build
```

## 🔔 Slack Integration

The Compliance Tracker includes Slack integration for automated notifications! Get alerts about:
- Tasks due today and overdue tasks
- Daily compliance summaries
- New projects and Excel imports
- Task completions

**Setup in 5 minutes:** See [`SLACK_INTEGRATION_GUIDE.md`](SLACK_INTEGRATION_GUIDE.md) for complete setup instructions.

Quick setup:
1. Create a Slack Incoming Webhook
2. Add webhook URL to `backend/.env`
3. Restart with `docker-compose restart backend`

## Future Enhancements

- [ ] Email notifications for upcoming deadlines
- [x] Desktop application ✅
- [x] Slack integration ✅
- [ ] Advanced reporting and analytics
- [ ] Bulk task operations
- [ ] Task comments and notes
- [ ] File attachments for evidence
- [ ] User authentication and roles
- [ ] Mobile responsive improvements
- [ ] Export to Excel functionality

## Support

For issues or questions, please refer to the planning documents:
- [`SLACK_INTEGRATION_GUIDE.md`](SLACK_INTEGRATION_GUIDE.md) - Slack bot setup and configuration
- `COMPLIANCE_TRACKER_PLAN.md` - Detailed implementation plan
- `MULTI_PROJECT_STRATEGY.md` - Multi-project architecture

## License

This project is created for internal use.

---

**Built with ❤️ for efficient compliance tracking**