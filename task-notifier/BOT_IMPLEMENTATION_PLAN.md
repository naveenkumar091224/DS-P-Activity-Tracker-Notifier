# Task Reminder Bot - Implementation Plan

## Overview
A lightweight desktop notification bot that sends task reminders as system notifications (pop-ups) and/or Slack messages. Reminders start 10 days before the due date and repeat every 2 days.

## Key Features

### 1. Desktop Notifications (Pop-ups)
- Native system notifications on Windows/Mac/Linux
- Shows task title and due date
- Clickable notifications (optional: open task details)
- Customizable notification sound

### 2. Slack Integration
- Send reminders to your Slack workspace
- Direct messages or channel notifications
- Rich formatting with task details
- Interactive buttons (mark as complete, snooze)

### 3. Simple Task Management
- CLI commands to add/view/complete tasks
- Optional: System tray icon for quick access
- JSON file storage (no database setup needed)

## System Architecture

```mermaid
graph TB
    subgraph "Task Reminder Bot"
        CLI[CLI Interface] --> TS[Task Storage JSON]
        TRAY[System Tray Icon] --> TS
        
        SCHEDULER[Cron Scheduler] --> TS
        SCHEDULER --> |Check Reminders| NOTIFIER[Notification Manager]
        
        NOTIFIER --> DESKTOP[Desktop Notifications]
        NOTIFIER --> SLACK[Slack Bot]
        
        TS --> |Read/Write| FILE[tasks.json]
    end
    
    DESKTOP --> |Pop-up| USER[Your Screen]
    SLACK --> |Message| SLACKWS[Slack Workspace]
```

## Reminder Logic

### Schedule Calculation
For a task due on **June 1st, 2026**:

| Date | Time | Days Before | Action |
|------|------|-------------|--------|
| May 22 | 9:00 AM | 10 days | 🔔 First reminder |
| May 24 | 9:00 AM | 8 days | 🔔 Second reminder |
| May 26 | 9:00 AM | 6 days | 🔔 Third reminder |
| May 28 | 9:00 AM | 4 days | 🔔 Fourth reminder |
| May 30 | 9:00 AM | 2 days | 🔔 Fifth reminder |
| June 1 | 9:00 AM | Due date | 🔔 Final reminder |

### Notification Content
**Desktop Pop-up:**
```
🔔 Task Reminder
Title: Complete project report
Due: June 1, 2026 (2 days remaining)
[View] [Snooze] [Complete]
```

**Slack Message:**
```
🔔 *Task Reminder*
*Task:* Complete project report
*Due Date:* June 1, 2026
*Status:* 2 days remaining

[Mark Complete] [Snooze 1 day] [View Details]
```

## Technology Stack

### Core
- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Scheduler**: node-cron
- **Storage**: JSON file (simple and portable)

### Desktop Notifications
- **Library**: node-notifier (cross-platform)
- **Features**: Native OS notifications, sounds, actions

### Slack Integration
- **Library**: @slack/bolt (official Slack SDK)
- **Features**: Webhooks, interactive messages, bot commands

### Optional UI
- **System Tray**: electron or node-systray
- **CLI**: commander.js for command-line interface

## Project Structure

```
task-reminder-bot/
├── src/
│   ├── index.ts                 # Main entry point
│   ├── scheduler.ts             # Cron job scheduler
│   ├── taskManager.ts           # Task CRUD operations
│   ├── reminderCalculator.ts   # Calculate reminder dates
│   ├── notifiers/
│   │   ├── desktopNotifier.ts  # Desktop notifications
│   │   └── slackNotifier.ts    # Slack integration
│   ├── cli.ts                   # CLI commands
│   └── types.ts                 # TypeScript interfaces
├── data/
│   └── tasks.json              # Task storage
├── config/
│   └── config.json             # Bot configuration
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Data Structure

### tasks.json
```json
{
  "tasks": [
    {
      "id": "uuid-1",
      "title": "Complete project report",
      "description": "Finish Q4 report",
      "dueDate": "2026-06-01T09:00:00Z",
      "createdAt": "2026-05-15T10:00:00Z",
      "status": "pending",
      "reminders": [
        {
          "date": "2026-05-22T09:00:00Z",
          "sent": false
        },
        {
          "date": "2026-05-24T09:00:00Z",
          "sent": false
        }
      ]
    }
  ]
}
```

### config.json
```json
{
  "notifications": {
    "desktop": {
      "enabled": true,
      "sound": true,
      "reminderTime": "09:00"
    },
    "slack": {
      "enabled": true,
      "botToken": "xoxb-your-token",
      "channel": "#reminders",
      "userId": "@username"
    }
  },
  "scheduler": {
    "checkInterval": "0 * * * *",
    "timezone": "Asia/Calcutta"
  }
}
```

## CLI Commands

### Task Management
```bash
# Add a new task
task-bot add "Complete report" --due "2026-06-01" --desc "Q4 report"

# List all tasks
task-bot list

# List pending tasks only
task-bot list --pending

# View task details
task-bot view <task-id>

# Mark task as complete
task-bot complete <task-id>

# Delete a task
task-bot delete <task-id>

# Edit a task
task-bot edit <task-id> --title "New title" --due "2026-06-15"
```

### Bot Control
```bash
# Start the reminder bot
task-bot start

# Stop the bot
task-bot stop

# Check bot status
task-bot status

# Test notifications
task-bot test-notification

# Configure Slack
task-bot config slack --token "xoxb-..." --channel "#reminders"
```

## Implementation Phases

### Phase 1: Core Functionality
1. Set up TypeScript project structure
2. Implement task storage (JSON file)
3. Create task manager (CRUD operations)
4. Build reminder calculation logic
5. Add CLI interface for task management

### Phase 2: Desktop Notifications
1. Integrate node-notifier
2. Implement desktop notification service
3. Add notification scheduling
4. Test on Windows/Mac/Linux

### Phase 3: Slack Integration
1. Set up Slack app and bot token
2. Implement Slack notifier
3. Add interactive message buttons
4. Test Slack notifications

### Phase 4: Scheduler
1. Implement cron-based scheduler
2. Add reminder checking logic
3. Integrate with notifiers
4. Add error handling and logging

### Phase 5: Polish & Deploy
1. Add system tray icon (optional)
2. Create startup script
3. Add configuration wizard
4. Write comprehensive documentation
5. Package for distribution

## Setup Instructions

### Prerequisites
- Node.js 20+ installed
- Slack workspace (for Slack notifications)

### Installation
```bash
# Clone or create project
mkdir task-reminder-bot
cd task-reminder-bot

# Install dependencies
npm install

# Build TypeScript
npm run build

# Configure
cp .env.example .env
# Edit .env with your settings

# Initialize
npm run init

# Start the bot
npm start
```

### Slack Setup
1. Create a Slack app at api.slack.com/apps
2. Add Bot Token Scopes: `chat:write`, `im:write`
3. Install app to workspace
4. Copy Bot User OAuth Token
5. Configure bot: `task-bot config slack --token "xoxb-..."`

## Configuration Options

### Environment Variables
```env
# Bot Settings
BOT_NAME=TaskReminderBot
CHECK_INTERVAL=0 * * * *
TIMEZONE=Asia/Calcutta
REMINDER_TIME=09:00

# Desktop Notifications
DESKTOP_ENABLED=true
DESKTOP_SOUND=true

# Slack Integration
SLACK_ENABLED=true
SLACK_BOT_TOKEN=xoxb-your-token-here
SLACK_CHANNEL=#reminders
SLACK_USER_ID=@yourusername

# Storage
DATA_PATH=./data/tasks.json
CONFIG_PATH=./config/config.json
```

## Desktop Notification Examples

### Windows
- Uses Windows 10/11 Action Center
- Native toast notifications
- Supports action buttons

### macOS
- Uses Notification Center
- Native banner notifications
- Supports actions and sounds

### Linux
- Uses libnotify (notify-send)
- Desktop environment integration
- Supports urgency levels

## Slack Bot Features

### Basic Notifications
```
🔔 Task Reminder
Task: Complete project report
Due: June 1, 2026 (2 days)
Priority: High
```

### Interactive Messages
- **Mark Complete**: Updates task status
- **Snooze**: Delays next reminder
- **View Details**: Shows full task info
- **Edit**: Opens task editor

### Slash Commands (Optional)
```
/task-add Complete report --due 2026-06-01
/task-list
/task-complete <id>
```

## Running as Background Service

### Windows (Task Scheduler)
```powershell
# Create scheduled task
schtasks /create /tn "TaskReminderBot" /tr "node C:\path\to\bot\dist\index.js" /sc onstart
```

### macOS (launchd)
```bash
# Create plist file
~/Library/LaunchAgents/com.taskbot.reminder.plist
```

### Linux (systemd)
```bash
# Create service file
/etc/systemd/system/task-reminder-bot.service
```

## Testing Strategy

### Unit Tests
- Task CRUD operations
- Reminder calculation logic
- Notification formatting

### Integration Tests
- Desktop notification delivery
- Slack message sending
- Scheduler execution

### Manual Testing
1. Add task with near-future due date
2. Verify reminders are calculated correctly
3. Test desktop notification appears
4. Test Slack message is sent
5. Mark task complete and verify reminders stop

## Advantages of This Approach

✅ **Lightweight**: No web server, no database  
✅ **Native**: Uses OS notification system  
✅ **Portable**: JSON file storage, easy backup  
✅ **Flexible**: Desktop + Slack notifications  
✅ **Simple**: CLI interface, no complex UI  
✅ **Reliable**: Runs in background, auto-starts  

## Future Enhancements

1. **Mobile Notifications**: Push to phone via Pushover/Pushbullet
2. **Voice Reminders**: Text-to-speech announcements
3. **Calendar Integration**: Sync with Google Calendar
4. **Smart Scheduling**: ML-based optimal reminder times
5. **Team Features**: Share tasks with others
6. **Analytics**: Track completion rates
7. **Templates**: Pre-defined task templates
8. **Recurring Tasks**: Daily/weekly/monthly tasks
9. **Priority Levels**: Urgent/high/medium/low
10. **Custom Sounds**: Different sounds per priority

## Comparison: Bot vs Web App

| Feature | Desktop Bot | Web App |
|---------|------------|---------|
| Setup Complexity | Low | Medium |
| Always Running | Yes (background) | Requires server |
| Notifications | Native OS | Email/Push |
| UI | CLI/Tray | Full web interface |
| Resource Usage | Minimal | Higher |
| Accessibility | Local only | Anywhere |
| Best For | Personal use | Team/Multi-user |

## Recommended Approach

For your use case (personal task reminders), the **Desktop Bot** is ideal because:
- ✅ Simpler to set up and maintain
- ✅ Native notifications are more noticeable
- ✅ Runs locally, no server needed
- ✅ Lightweight and fast
- ✅ Easy to backup (just copy JSON file)