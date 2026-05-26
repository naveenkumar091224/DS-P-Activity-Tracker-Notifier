# System Notifications Guide

## Overview
The Compliance Tracker application includes an **automatic notification system** that alerts users about upcoming and overdue tasks. Notifications are **enabled by default** and work through both browser notifications and in-app toast messages.

## How It Works

### Automatic Notifications
The system automatically checks for tasks that need attention when you:
- Load the dashboard
- Refresh the page
- Return to the dashboard from another page

### Notification Triggers
You will receive notifications for tasks that are:
- **Due within 7 days** (168 hours)
- **Status: Pending** (not completed)
- **Not previously notified** in the current session

### Notification Types

#### 1. Browser System Notifications
- Native OS notifications that appear outside the browser
- Show task title, project code, and due date
- Persist even when browser is minimized
- Require user permission (requested automatically)

**Example:**
```
📋 Task Reminder
Submit Q4 Compliance Report
PROJECT-001 · Due 12/25/2026
```

#### 2. In-App Toast Notifications
- Appear in the top-right corner of the dashboard
- Show for 7 seconds then auto-dismiss
- Can be manually closed by clicking the × button
- Display up to 3 tasks at once

## Setup Instructions

### First-Time Setup

1. **Open the Application**
   - Navigate to http://localhost:3001
   - Log in with your credentials

2. **Grant Notification Permission**
   - When you first load the dashboard, the browser will ask:
     > "localhost:3001 wants to show notifications"
   - Click **"Allow"** to enable browser notifications
   - This permission is saved and only needs to be granted once

3. **Verify Notifications Work**
   - Click the **"Show Sample Popup"** button on the dashboard
   - You should see toast notifications appear in the top-right
   - If you have pending tasks, you'll also see browser notifications

### Browser-Specific Instructions

#### Google Chrome
1. Click the 🔒 or ⓘ icon in the address bar
2. Find "Notifications" in the permissions list
3. Set to "Allow"

#### Microsoft Edge
1. Click the 🔒 icon in the address bar
2. Click "Permissions for this site"
3. Set Notifications to "Allow"

#### Firefox
1. Click the 🔒 icon in the address bar
2. Click the arrow next to "Blocked" or "Allowed"
3. Find Notifications and set to "Allow"

## Notification Behavior

### When Notifications Appear
- **On Dashboard Load**: Checks all pending tasks and notifies about those due within 7 days
- **Automatic**: No manual action required
- **Smart Deduplication**: Won't notify about the same task twice in one session

### Notification Persistence
- **Session-Based**: Notified tasks are tracked per browser session
- **Reset on Logout**: Logging out clears the notification history
- **Reset on Browser Close**: Closing the browser clears the notification history

### Notification Limits
- **Maximum 3 notifications** shown at once
- **7-second display time** for toast notifications
- **Browser notifications** remain until dismissed by user

## Testing Notifications

### Method 1: Use Sample Button
1. Log in to the dashboard
2. Click **"Show Sample Popup"** button
3. Toast notifications will appear for the first 3 pending tasks

### Method 2: Create Test Tasks
1. Create a new project
2. Upload a compliance spreadsheet with tasks
3. Set some tasks to be due within the next 7 days
4. Refresh the dashboard
5. You should see notifications for those tasks

### Method 3: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for notification-related messages
4. Check for any permission errors

## Troubleshooting

### No Notifications Appearing

**Check 1: Browser Permissions**
- Verify notifications are allowed in browser settings
- Look for a blocked notification icon in the address bar
- Try clicking it and selecting "Always allow"

**Check 2: Notification Support**
- Open browser console (F12)
- Type: `'Notification' in window`
- Should return `true`
- Type: `Notification.permission`
- Should return `"granted"` (if allowed) or `"default"` (if not asked yet)

**Check 3: Tasks Exist**
- Verify you have pending tasks in the system
- Check that tasks are due within 7 days
- Ensure tasks haven't been notified already in this session

**Check 4: Browser Focus**
- Some browsers only show notifications when the tab is active
- Try switching to another tab and back

### Notifications Not Persisting

**This is expected behavior:**
- Notifications are session-based
- They reset when you log out or close the browser
- This prevents notification spam on subsequent logins

### Too Many Notifications

**Current Limits:**
- Maximum 3 notifications per dashboard load
- Only shows tasks due within 7 days
- Won't re-notify about the same task in one session

**To Reduce Notifications:**
- Complete tasks to remove them from pending
- Mark tasks as "in progress" or "completed"
- Adjust task due dates if needed

## Technical Details

### Notification Logic
```typescript
// Tasks are filtered by:
1. Status === 'pending'
2. Not already notified in this session
3. Due within 168 hours (7 days)
4. Limited to first 3 tasks
```

### Storage
- **sessionStorage**: Tracks notified task IDs
- **Key**: `'notified-tasks'`
- **Format**: JSON array of task IDs
- **Cleared**: On logout or browser close

### Notification Content
- **Title**: "📋 Task Reminder"
- **Body**: Task name, project code, due date
- **Icon**: `/icon.png` (if available)
- **Tag**: `task-{id}` (prevents duplicates)

## Privacy & Security

### Data Storage
- Notification history stored locally in browser
- No notification data sent to external servers
- Cleared when you log out

### Permissions
- Only requests notification permission when needed
- Permission is browser-specific (not account-specific)
- Can be revoked at any time in browser settings

### Content
- Notifications only show task information you already have access to
- No sensitive data exposed in notifications
- Notifications respect user-specific data isolation

## Best Practices

### For Users
1. **Keep browser notifications enabled** for timely reminders
2. **Check dashboard regularly** to stay updated
3. **Complete tasks promptly** to reduce notification volume
4. **Use the "Show Sample Popup" button** to test notifications

### For Administrators
1. **Educate users** about notification permissions
2. **Set realistic due dates** to avoid notification overload
3. **Monitor task completion rates** to ensure notifications are effective
4. **Consider notification timing** when scheduling tasks

## Future Enhancements

Potential improvements to the notification system:
- Email notifications for critical tasks
- Customizable notification timing (e.g., 1 day, 3 days, 7 days)
- Notification preferences per user
- Snooze functionality
- Notification history view
- Mobile push notifications
- Slack/Teams integration

## Support

If you encounter issues with notifications:
1. Check this guide for troubleshooting steps
2. Verify browser permissions are granted
3. Test with the "Show Sample Popup" button
4. Check browser console for errors
5. Contact your system administrator

---
*Last Updated: 2026-05-22*  
*Feature Status: Fully Implemented & Active*