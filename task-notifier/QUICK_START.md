# Task Notifier - Quick Start Guide

## What This Application Does

The Task Notifier is an automated reminder system that:
- ✅ Sends you a reminder **10 days before** a task is due
- ✅ Continues reminding you **every 2 days** until the task is completed
- ✅ Supports multiple notification channels (Email, SMS, Slack, Console)
- ✅ Provides a modern web interface to manage your tasks
- ✅ Automatically stops reminders when tasks are completed or cancelled

## Example Reminder Schedule

If you create a task due on **June 1st, 2026**:

| Date | Days Before Due | Reminder # |
|------|----------------|------------|
| May 22 | 10 days | 1st reminder |
| May 24 | 8 days | 2nd reminder |
| May 26 | 6 days | 3rd reminder |
| May 28 | 4 days | 4th reminder |
| May 30 | 2 days | 5th reminder |
| June 1 | Due date | Final reminder |

## Key Features

### 1. Task Management
- Create tasks with title, description, and due date
- View all tasks in a clean interface
- Update task details
- Mark tasks as completed or cancelled
- Delete tasks

### 2. Automatic Reminders
- Reminders are automatically calculated when you create a task
- First reminder: 10 days before due date
- Subsequent reminders: Every 2 days
- Reminders stop when task is completed/cancelled

### 3. Multiple Notification Channels
- **Email**: Get reminders via email (requires SMTP setup)
- **SMS**: Text message notifications (requires Twilio/AWS SNS)
- **Slack**: Notifications in your Slack workspace
- **Console**: Always-on logging for development/testing

### 4. Notification History
- View all sent notifications
- Track delivery status
- See which channel was used

## Architecture Overview

```
┌─────────────────┐
│  React Frontend │ ← You interact here
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Express API    │ ← Manages tasks & reminders
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ SQLite Database │ ← Stores everything
└─────────────────┘

┌─────────────────┐
│  Cron Scheduler │ ← Runs every hour
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Notification    │ ← Sends reminders
│ Service         │
└─────────────────┘
```

## Next Steps

Once the implementation is complete, you'll be able to:

1. **Install dependencies**
   ```bash
   cd task-notifier/backend && npm install
   cd ../frontend && npm install
   ```

2. **Configure notifications**
   - Copy `.env.example` to `.env`
   - Add your email SMTP credentials
   - Enable desired notification channels

3. **Start the application**
   ```bash
   # Backend
   cd backend && npm run dev
   
   # Frontend (in another terminal)
   cd frontend && npm run dev
   ```

4. **Access the web interface**
   - Open http://localhost:5173
   - Create your first task
   - Watch the reminders get scheduled!

## Technology Stack

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + TypeScript + Vite
- **Database**: SQLite (no setup required!)
- **Scheduler**: node-cron
- **Notifications**: Nodemailer (email) + extensible architecture

## Project Status

This is the planning phase. The detailed implementation plan is in [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md).

Ready to proceed with implementation? The next step is to switch to Code mode to build the application!