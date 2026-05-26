# Scheduled Notifications Guide

## Overview
The Compliance Tracker now includes **scheduled notifications** that automatically alert users about tasks at specific times during weekdays. Notifications are categorized by priority and delivered at optimal times throughout the workday.

## Notification Schedule

### 🚨 Overdue Tasks
- **Time**: Monday-Friday at 8:30 AM
- **Priority**: Highest
- **Description**: Tasks that have passed their due date
- **Action Required**: Immediate attention needed

### 📋 Tasks Due Today
- **Time**: Monday-Friday at 9:00 AM
- **Priority**: High
- **Description**: Tasks that are due on the current day
- **Action Required**: Complete today

### 📅 Tasks Due This Week
- **Time**: Monday-Friday at 10:00 AM
- **Priority**: Medium
- **Description**: Tasks due within the current week (excluding today)
- **Action Required**: Plan and schedule completion

## How It Works

### Automatic Scheduling
The system automatically checks for tasks every minute and triggers notifications at the scheduled times. No manual configuration is required.

### Weekday Only
Notifications only run on **Monday through Friday**. No notifications are sent on weekends.

### Once Per Day
Each notification type runs **only once per day** at its scheduled time. If you miss a notification, it will run again the next business day.

### Smart Filtering
- Only **pending tasks** are included in notifications
- Tasks are automatically categorized by their due date
- Up to **5 tasks** are shown in browser notifications
- Up to **3 tasks** are shown in toast notifications

## Notification Types

### Browser System Notifications
- Native OS notifications that appear outside the browser
- Persist until dismissed by user
- **Overdue tasks** require user interaction to dismiss
- Show task title, project code, and due date

### In-App Toast Notifications
- Appear in the top-right corner of the dashboard
- Auto-dismiss after 10 seconds
- Can be manually closed by clicking the × button
- Display up to 3 tasks at once

## Setup Instructions

### First-Time Setup

1. **Open the Application**
   ```
   http://localhost:3001
   ```

2. **Log In**
   - Use your credentials or demo account
   - Example: `admin` / `Admin123`

3. **Grant Notification Permission**
   - Browser will prompt: "localhost:3001 wants to show notifications"
   - Click **"Allow"**
   - This permission is saved permanently

4. **Verify Schedule**
   - Look for the "📅 Scheduled Notifications" panel on the dashboard
   - Shows all scheduled times and next notification

### Testing Notifications

#### Method 1: Wait for Scheduled Time
- Notifications will automatically appear at:
  - 8:30 AM (Overdue)
  - 9:00 AM (Due Today)
  - 10:00 AM (Due This Week)

#### Method 2: Use Sample Button
- Click "Show Sample Popup" button on dashboard
- This triggers immediate test notifications
- Does not affect scheduled notifications

#### Method 3: Adjust System Time (Development Only)
- Change your computer's time to 8:30 AM, 9:00 AM, or 10:00 AM
- Refresh the dashboard
- Scheduled notification should trigger
- **Note**: Only for testing purposes

## Notification Schedule Panel

The dashboard displays a schedule panel showing:

```
📅 Scheduled Notifications

🚨 Overdue Tasks:      Mon-Fri 8:30 AM
📋 Due Today:          Mon-Fri 9:00 AM
📅 Due This Week:      Mon-Fri 10:00 AM

Next notification: Tasks Due Today at 9:00 AM
```

### Next Notification Indicator
- Shows which notification will run next
- Updates automatically throughout the day
- Displays "Tomorrow at [time]" after last notification of the day

## Technical Details

### Notification Logic

```typescript
// Overdue Tasks (8:30 AM)
- Status: pending
- Due date: < today
- Runs: Mon-Fri at 8:30 AM

// Tasks Due Today (9:00 AM)
- Status: pending
- Due date: = today
- Runs: Mon-Fri at 9:00 AM

// Tasks Due This Week (10:00 AM)
- Status: pending
- Due date: > today AND <= end of week
- Runs: Mon-Fri at 10:00 AM
```

### Storage
- **localStorage**: Stores notification schedule and last run times
- **sessionStorage**: Tracks notified task IDs (prevents duplicates)
- **Cleared**: On logout or browser close

### Checking Interval
- System checks every **60 seconds** for scheduled times
- Minimal performance impact
- Runs in background while dashboard is open

### Time Zone
- Uses **local system time** (Asia/Calcutta, UTC+5:30)
- Notifications trigger based on user's local time
- No server-side scheduling required

## Customization (Future)

Currently, notification times are fixed. Future versions may include:
- Custom notification times per user
- Additional notification categories
- Email notifications
- Slack/Teams integration
- Snooze functionality
- Notification history

## Troubleshooting

### Notifications Not Appearing

**Check 1: Browser Permissions**
```
1. Click lock icon in address bar
2. Find "Notifications" permission
3. Ensure it's set to "Allow"
```

**Check 2: Correct Time**
```
1. Verify system time is correct
2. Check if it's a weekday (Mon-Fri)
3. Confirm it's at or past scheduled time
```

**Check 3: Tasks Exist**
```
1. Verify you have pending tasks
2. Check task due dates match notification type
3. Ensure tasks haven't been notified already today
```

**Check 4: Dashboard Open**
```
1. Notifications only work when dashboard is open
2. Keep browser tab active
3. Don't minimize or close the tab
```

### Duplicate Notifications

**This should not happen**, but if it does:
1. Clear browser cache and localStorage
2. Log out and log back in
3. Refresh the dashboard

### Wrong Time Zone

Notifications use your **local system time**. If times seem incorrect:
1. Check your computer's time zone settings
2. Verify system time is accurate
3. Restart browser after time zone changes

## Best Practices

### For Users
1. **Keep dashboard open** during work hours for notifications
2. **Grant notification permission** when prompted
3. **Check schedule panel** to know when next notification arrives
4. **Complete tasks promptly** to reduce notification volume
5. **Use "Show Sample Popup"** to test notifications

### For Administrators
1. **Educate users** about notification schedule
2. **Set realistic due dates** to avoid overdue notifications
3. **Monitor task completion rates** to ensure effectiveness
4. **Consider user time zones** when assigning tasks
5. **Review notification logs** for system health

## Privacy & Security

### Data Storage
- Notification schedule stored locally in browser
- No notification data sent to external servers
- Last run times tracked per browser session

### Permissions
- Only requests notification permission when needed
- Permission is browser-specific (not account-specific)
- Can be revoked at any time in browser settings

### Content
- Notifications only show task information you have access to
- No sensitive data exposed in notifications
- Respects user-specific data isolation

## Comparison: Scheduled vs. Immediate

### Scheduled Notifications (New)
- ✅ Run at specific times (8:30 AM, 9:00 AM, 10:00 AM)
- ✅ Categorized by priority (Overdue, Today, This Week)
- ✅ Once per day per category
- ✅ Weekdays only (Mon-Fri)
- ✅ Predictable and consistent

### Immediate Notifications (Old)
- ❌ Triggered on dashboard load
- ❌ No specific timing
- ❌ Could appear at any time
- ❌ Less predictable
- ❌ Removed in favor of scheduled approach

## Implementation Files

### Core Files
- **`notificationScheduler.ts`**: Scheduling logic and utilities
- **`Dashboard.tsx`**: Notification checking and display
- **`App.css`**: Notification schedule panel styling

### Key Functions
- `shouldRunNotification()`: Checks if notification should run
- `filterTasksByType()`: Filters tasks by notification type
- `getNotificationTitle()`: Gets title for notification type
- `getNextScheduledTime()`: Calculates next notification time

## Support

If you encounter issues with scheduled notifications:
1. Check this guide for troubleshooting steps
2. Verify browser permissions are granted
3. Test with "Show Sample Popup" button
4. Check browser console for errors
5. Contact your system administrator

---
*Last Updated: 2026-05-22*  
*Feature Status: Fully Implemented & Active*  
*Schedule: Mon-Fri 8:30 AM, 9:00 AM, 10:00 AM*