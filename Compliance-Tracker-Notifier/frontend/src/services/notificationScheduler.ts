/**
 * Notification Scheduler Service
 * Handles scheduled notifications for tasks based on priority and time of day
 */

export interface ScheduledNotification {
  type: 'overdue' | 'due_today' | 'due_this_week';
  time: string; // Format: "HH:MM"
  lastRun: string | null; // ISO date string
}

export interface NotificationSchedule {
  overdue: ScheduledNotification;
  due_today: ScheduledNotification;
  due_this_week: ScheduledNotification;
}

// Default schedule configuration
export const DEFAULT_SCHEDULE: NotificationSchedule = {
  overdue: {
    type: 'overdue',
    time: '08:30',
    lastRun: null
  },
  due_today: {
    type: 'due_today',
    time: '09:00',
    lastRun: null
  },
  due_this_week: {
    type: 'due_this_week',
    time: '10:00',
    lastRun: null
  }
};

const STORAGE_KEY = 'notification-schedule';

/**
 * Get the current notification schedule from localStorage
 */
export function getSchedule(): NotificationSchedule {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse notification schedule:', e);
    }
  }
  return DEFAULT_SCHEDULE;
}

/**
 * Save the notification schedule to localStorage
 */
export function saveSchedule(schedule: NotificationSchedule): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule));
}

/**
 * Update the last run time for a specific notification type
 */
export function updateLastRun(type: 'overdue' | 'due_today' | 'due_this_week'): void {
  const schedule = getSchedule();
  schedule[type].lastRun = new Date().toISOString();
  saveSchedule(schedule);
}

/**
 * Check if it's a weekday (Monday-Friday)
 */
export function isWeekday(date: Date = new Date()): boolean {
  const day = date.getDay();
  return day >= 1 && day <= 5; // 1 = Monday, 5 = Friday
}

/**
 * Parse time string (HH:MM) and return hours and minutes
 */
export function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
}

/**
 * Check if current time matches the scheduled time (within 1 minute window)
 */
export function isScheduledTime(scheduledTime: string, now: Date = new Date()): boolean {
  const { hours, minutes } = parseTime(scheduledTime);
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  
  return currentHours === hours && currentMinutes === minutes;
}

/**
 * Check if notification should run based on schedule and last run time
 */
export function shouldRunNotification(
  type: 'overdue' | 'due_today' | 'due_this_week',
  now: Date = new Date()
): boolean {
  // Only run on weekdays
  if (!isWeekday(now)) {
    return false;
  }

  const schedule = getSchedule();
  const notification = schedule[type];
  
  // Check if it's the scheduled time
  if (!isScheduledTime(notification.time, now)) {
    return false;
  }

  // Check if already run today
  if (notification.lastRun) {
    const lastRun = new Date(notification.lastRun);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastRunDate = new Date(lastRun.getFullYear(), lastRun.getMonth(), lastRun.getDate());
    
    // If last run was today, don't run again
    if (lastRunDate.getTime() === today.getTime()) {
      return false;
    }
  }

  return true;
}

/**
 * Get tasks filtered by notification type
 */
export function filterTasksByType(
  tasks: any[],
  type: 'overdue' | 'due_today' | 'due_this_week'
): any[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (7 - today.getDay())); // End of current week (Sunday)

  return tasks.filter(task => {
    if (task.status !== 'pending') return false;

    const dueDate = new Date(task.planned_date);
    const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

    switch (type) {
      case 'overdue':
        return dueDateOnly < today;
      
      case 'due_today':
        return dueDateOnly.getTime() === today.getTime();
      
      case 'due_this_week':
        return dueDateOnly > today && dueDateOnly <= endOfWeek;
      
      default:
        return false;
    }
  });
}

/**
 * Get notification title based on type
 */
export function getNotificationTitle(type: 'overdue' | 'due_today' | 'due_this_week'): string {
  switch (type) {
    case 'overdue':
      return '🚨 Overdue Tasks';
    case 'due_today':
      return '📋 Tasks Due Today';
    case 'due_this_week':
      return '📅 Tasks Due This Week';
    default:
      return '📋 Task Reminder';
  }
}

/**
 * Get notification priority (for sorting)
 */
export function getNotificationPriority(type: 'overdue' | 'due_today' | 'due_this_week'): number {
  switch (type) {
    case 'overdue':
      return 1; // Highest priority
    case 'due_today':
      return 2;
    case 'due_this_week':
      return 3; // Lowest priority
    default:
      return 999;
  }
}

/**
 * Format time for display (e.g., "8:30 AM")
 */
export function formatTime(timeStr: string): string {
  const { hours, minutes } = parseTime(timeStr);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${period}`;
}

/**
 * Get next scheduled notification time
 */
export function getNextScheduledTime(): { type: string; time: string; formatted: string } | null {
  const schedule = getSchedule();
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const notifications = [
    { type: 'Overdue Tasks', time: schedule.overdue.time, minutes: 0 },
    { type: 'Tasks Due Today', time: schedule.due_today.time, minutes: 0 },
    { type: 'Tasks Due This Week', time: schedule.due_this_week.time, minutes: 0 }
  ];

  // Calculate minutes for each notification
  notifications.forEach(n => {
    const { hours, minutes } = parseTime(n.time);
    n.minutes = hours * 60 + minutes;
  });

  // Find next notification
  const upcoming = notifications
    .filter(n => n.minutes > currentMinutes)
    .sort((a, b) => a.minutes - b.minutes);

  if (upcoming.length > 0) {
    return {
      type: upcoming[0].type,
      time: upcoming[0].time,
      formatted: formatTime(upcoming[0].time)
    };
  }

  // If no more today, return first one tomorrow
  const first = notifications.sort((a, b) => a.minutes - b.minutes)[0];
  return {
    type: first.type,
    time: first.time,
    formatted: `Tomorrow at ${formatTime(first.time)}`
  };
}

// Made with Bob
