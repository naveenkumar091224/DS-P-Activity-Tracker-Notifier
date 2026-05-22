import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats, getAllTasks, getProjects } from '../api';
import { DashboardStats, TaskInstance, Project } from '../types';
import {
  shouldRunNotification,
  updateLastRun,
  filterTasksByType,
  getNotificationTitle,
  getNextScheduledTime
} from '../services/notificationScheduler';

type DashboardProps = {
  onChatContextChange?: (context: {
    upcomingTasks: TaskInstance[];
    projects: Project[];
  }) => void;
};

function Dashboard({ onChatContextChange }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcomingTasks, setUpcomingTasks] = useState<TaskInstance[]>([]);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled] = useState(true); // Enabled by default, no toggle needed
  const [toastTaskIds, setToastTaskIds] = useState<number[]>([]);
  const [notifiedTaskIds, setNotifiedTaskIds] = useState<Set<number>>(() => {
    // Load previously notified tasks from sessionStorage
    const stored = sessionStorage.getItem('notified-tasks');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  // Persist notified tasks to sessionStorage
  useEffect(() => {
    if (notifiedTaskIds.size > 0) {
      sessionStorage.setItem('notified-tasks', JSON.stringify(Array.from(notifiedTaskIds)));
    }
  }, [notifiedTaskIds]);

  // Scheduled notification checker
  const checkScheduledNotifications = useCallback(() => {
    if (!notificationsEnabled || upcomingTasks.length === 0) {
      return;
    }

    // Request notification permission if needed
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const notificationTypes: Array<'overdue' | 'due_today' | 'due_this_week'> = [
      'overdue',
      'due_today',
      'due_this_week'
    ];

    // Check each notification type
    notificationTypes.forEach(type => {
      if (shouldRunNotification(type)) {
        const tasksToNotify = filterTasksByType(upcomingTasks, type);
        
        if (tasksToNotify.length > 0) {
          const title = getNotificationTitle(type);
          
          // Show browser notifications
          if ('Notification' in window && Notification.permission === 'granted') {
            tasksToNotify.slice(0, 5).forEach((task: TaskInstance) => {
              const taskTitle = task.raw_task_name || task.control_title || task.instance_label;
              const dueDate = new Date(task.planned_date).toLocaleDateString();
              const projectInfo = task.project_code ? `${task.project_code} · ` : '';
              
              new Notification(title, {
                body: `${taskTitle}\n${projectInfo}Due ${dueDate}`,
                icon: '/icon.png',
                tag: `task-${type}-${task.id}`,
                requireInteraction: type === 'overdue' // Overdue tasks require interaction
              });
            });
          }

          // Show toast notifications
          const taskIds = tasksToNotify.slice(0, 3).map((task: TaskInstance) => task.id);
          setToastTaskIds(taskIds);

          // Mark these tasks as notified
          setNotifiedTaskIds(prev => {
            const newSet = new Set(prev);
            tasksToNotify.forEach(task => newSet.add(task.id));
            return newSet;
          });

          // Update last run time for this notification type
          updateLastRun(type);

          // Auto-dismiss toast after 10 seconds (longer for scheduled notifications)
          setTimeout(() => {
            setToastTaskIds([]);
          }, 10000);
        }
      }
    });
  }, [notificationsEnabled, upcomingTasks, notifiedTaskIds]);

  // Check for scheduled notifications every minute
  useEffect(() => {
    // Initial check
    checkScheduledNotifications();

    // Set up interval to check every minute
    const interval = setInterval(() => {
      checkScheduledNotifications();
    }, 60000); // Check every 60 seconds

    return () => clearInterval(interval);
  }, [checkScheduledNotifications]);

  const loadDashboard = async () => {
    try {
      console.log('Loading dashboard data...');
      const [statsData, tasksData, projectsData] = await Promise.all([
        getDashboardStats(),
        getAllTasks('pending'),
        getProjects()
      ]);
      console.log('Dashboard data loaded:', { statsData, tasksData, projectsData });
      setStats(statsData);
      setUpcomingTasks(tasksData.slice(0, 8));
      setRecentProjects(projectsData.slice(0, 4));
      
      // Show immediate notifications only on first load (not on refresh)
      const hasShownLoginNotifications = sessionStorage.getItem('login-notifications-shown');
      if (!hasShownLoginNotifications) {
        showLoginNotifications(tasksData);
        sessionStorage.setItem('login-notifications-shown', 'true');
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      // Show error details
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
    } finally {
      setLoading(false);
    }
  };

  // Show notifications immediately on login
  const showLoginNotifications = async (tasks: TaskInstance[]) => {
    if (!notificationsEnabled || tasks.length === 0) {
      return;
    }

    // Get overdue, due today, and due this week tasks
    const overdueTasks = filterTasksByType(tasks, 'overdue');
    const dueTodayTasks = filterTasksByType(tasks, 'due_today');
    const dueThisWeekTasks = filterTasksByType(tasks, 'due_this_week');

    // Show all tasks for each category (no limit)
    const allNotificationTasks = [
      ...overdueTasks,
      ...dueTodayTasks,
      ...dueThisWeekTasks
    ];

    if (allNotificationTasks.length === 0) {
      return;
    }

    // Request notification permission if needed and wait for response
    if ('Notification' in window) {
      let permission = Notification.permission;
      
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }

      // Show browser notifications if permission granted
      if (permission === 'granted') {
        allNotificationTasks.forEach((task: TaskInstance) => {
          const taskTitle = task.raw_task_name || task.control_title || task.instance_label;
          const dueDate = new Date(task.planned_date).toLocaleDateString();
          const projectInfo = task.project_code ? `${task.project_code} · ` : '';
          
          // Determine notification type
          let title = '📋 Task Reminder';
          const today = new Date();
          const taskDueDate = new Date(task.planned_date);
          const dueDateOnly = new Date(taskDueDate.getFullYear(), taskDueDate.getMonth(), taskDueDate.getDate());
          const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          
          if (dueDateOnly < todayOnly) {
            title = '🚨 Overdue Task';
          } else if (dueDateOnly.getTime() === todayOnly.getTime()) {
            title = '📋 Task Due Today';
          } else {
            title = '📅 Upcoming Task';
          }
          
          new Notification(title, {
            body: `${taskTitle}\n${projectInfo}Due ${dueDate}`,
            icon: '/icon.png',
            tag: `login-task-${task.id}`,
            requireInteraction: dueDateOnly < todayOnly // Overdue tasks require interaction
          });
        });
      } else if (permission === 'denied') {
        console.warn('Desktop notifications are blocked. Please enable them in your browser settings.');
      }
    }

    // Show toast notifications
    const taskIds = allNotificationTasks.slice(0, 3).map((task: TaskInstance) => task.id);
    setToastTaskIds(taskIds);

    // Auto-dismiss toast after 10 seconds
    setTimeout(() => {
      setToastTaskIds([]);
    }, 10000);
  };

  useEffect(() => {
    onChatContextChange?.({
      upcomingTasks,
      projects: recentProjects
    });
  }, [onChatContextChange, upcomingTasks, recentProjects]);

  const getTaskTimingLabel = (plannedDate: string) => {
    const dueDate = new Date(plannedDate);
    const today = new Date();
    const dueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffDays = Math.round((dueDay.getTime() - todayDay.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)} day(s) overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} day(s)`;
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <section className="hero-card">
        <div>
          <p className="eyebrow">DS&P Activity operations</p>
          <h2>📊 DS&P Activity Dashboard</h2>
          <p className="hero-text">
            Track active projects, upcoming evidence submissions, and overdue controls from one place.
          </p>
        </div>
        <Link to="/projects" className="hero-link">
          <button type="button" className="btn-primary hero-button">
            Manage Projects
          </button>
        </Link>
      </section>

      {stats && (
        <div className="stats-grid">
          <Link to="/projects" className="stat-card">
            <h3>Projects</h3>
            <div className="stat-value">{stats.active_projects}</div>
            <div className="stat-label">Active / {stats.total_projects} Total</div>
          </Link>

          <Link to="/tasks?filter=all" className="stat-card">
            <h3>Controls</h3>
            <div className="stat-value">{stats.applicable_controls}</div>
            <div className="stat-label">Applicable / {stats.total_controls} Total</div>
          </Link>

          <Link to="/tasks?filter=due-today" className="stat-card urgent">
            <h3>Due Today</h3>
            <div className="stat-value">{stats.tasks_due_today}</div>
            <div className="stat-label">Tasks</div>
          </Link>

          <Link to="/tasks?filter=this-week" className="stat-card warning">
            <h3>This Week</h3>
            <div className="stat-value">{stats.tasks_due_this_week}</div>
            <div className="stat-label">Tasks</div>
          </Link>

          <Link to="/tasks?filter=overdue" className="stat-card danger">
            <h3>Overdue</h3>
            <div className="stat-value">{stats.overdue_tasks}</div>
            <div className="stat-label">Tasks</div>
          </Link>

          <Link to="/tasks?filter=completed" className="stat-card success">
            <h3>Completed</h3>
            <div className="stat-value">{stats.completed_tasks}</div>
            <div className="stat-label">Tasks</div>
          </Link>
        </div>
      )}

      {notificationsEnabled && toastTaskIds.length > 0 && (
        <div className="notification-stack">
          {upcomingTasks
            .filter((task: TaskInstance) => toastTaskIds.includes(task.id))
            .map((task: TaskInstance) => (
              <div key={task.id} className="notification-toast">
                <div className="notification-toast-header">
                  <strong>Reminder</strong>
                  <button
                    type="button"
                    className="notification-toast-close"
                    onClick={() => setToastTaskIds((current: number[]) => current.filter((id: number) => id !== task.id))}
                  >
                    ×
                  </button>
                </div>
                <div className="notification-toast-title">
                  {task.raw_task_name || task.control_title || task.instance_label}
                </div>
                <div className="notification-toast-body">
                  {task.project_code && <span>{task.project_code} · </span>}
                  Due {new Date(task.planned_date).toLocaleDateString()}
                </div>
              </div>
            ))}
        </div>
      )}

      <div className="dashboard-grid">
        <div className="upcoming-tasks">
          <div className="section-heading">
            <h3>📅 Upcoming Tasks</h3>
            <span className="section-subtitle">Next pending activities</span>
          </div>
          <div className="notification-demo-bar">
            <button
              type="button"
              className="btn-primary"
              onClick={() =>
                setToastTaskIds(
                  upcomingTasks
                    .filter((task: TaskInstance) => task.status === 'pending')
                    .slice(0, 3)
                    .map((task: TaskInstance) => task.id)
                )
              }
              disabled={upcomingTasks.length === 0}
            >
              Show Sample Popup
            </button>
          </div>
          <div className="notification-schedule-info">
            <div className="schedule-info-header">
              <strong>📅 Scheduled Notifications</strong>
            </div>
            <div className="schedule-info-body">
              <div className="schedule-item">
                <span className="schedule-icon">🚨</span>
                <span className="schedule-label">Overdue Tasks:</span>
                <span className="schedule-time">Mon-Fri 8:30 AM</span>
              </div>
              <div className="schedule-item">
                <span className="schedule-icon">📋</span>
                <span className="schedule-label">Due Today:</span>
                <span className="schedule-time">Mon-Fri 9:00 AM</span>
              </div>
              <div className="schedule-item">
                <span className="schedule-icon">📅</span>
                <span className="schedule-label">Due This Week:</span>
                <span className="schedule-time">Mon-Fri 10:00 AM</span>
              </div>
              {(() => {
                const next = getNextScheduledTime();
                return next ? (
                  <div className="schedule-next">
                    <span className="schedule-next-label">Next notification:</span>
                    <span className="schedule-next-time">{next.type} at {next.formatted}</span>
                  </div>
                ) : null;
              })()}
            </div>
          </div>
          {upcomingTasks.length === 0 ? (
            <div className="empty-state">
              <p>No upcoming tasks yet.</p>
              <span>Create a project and import the compliance spreadsheet to generate task schedules.</span>
            </div>
          ) : (
            <div className="task-list">
              {upcomingTasks.map((task: TaskInstance) => (
                <Link
                  key={task.id}
                  to={`/projects/${task.project_id}`}
                  className="task-item task-item-link"
                >
                  <div className="task-info">
                    <div className="task-label">
                      {task.raw_task_name || task.control_title || task.instance_label}
                    </div>
                    {(task.project_code || task.control_description) && (
                      <div className="task-description">
                        {task.project_code && <strong>{task.project_code}</strong>}
                        {task.project_code && task.control_description ? ' · ' : ''}
                        {task.control_description}
                      </div>
                    )}
                    <div className="task-date">
                      Due: {new Date(task.planned_date).toLocaleDateString()} · {getTaskTimingLabel(task.planned_date)}
                    </div>
                    <div className="task-meta-inline">
                      {task.control_code && <span>{task.control_code}</span>}
                      {task.scheduled_frequency && <span>{task.scheduled_frequency}</span>}
                      {task.assigned_to && task.assigned_to.length > 0 && (
                        <span>Owner: {task.assigned_to.join(', ')}</span>
                      )}
                    </div>
                  </div>
                  <div className={`task-status ${task.status}`}>
                    {task.status}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="side-panel">
          <div className="quick-panel">
            <div className="section-heading">
              <h3>📁 Recent Projects</h3>
              <span className="section-subtitle">Jump back into active work</span>
            </div>
            {recentProjects.length === 0 ? (
              <div className="empty-state compact">
                <p>No projects created</p>
              </div>
            ) : (
              <div className="mini-project-list">
                {recentProjects.map((project: Project) => (
                  <Link key={project.id} to={`/projects/${project.id}`} className="mini-project-card">
                    <div className="mini-project-top">
                      <strong>{project.name}</strong>
                      <span className={`status-badge ${project.status}`}>{project.status}</span>
                    </div>
                    <span>{project.code}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="quick-panel">
            <div className="section-heading">
              <h3>⚡ Quick Start</h3>
              <span className="section-subtitle">Recommended workflow</span>
            </div>
            <ol className="quick-steps">
              <li>Create a project with client and team details.</li>
              <li>Upload the compliance Excel workbook for that project.</li>
              <li>Review planned tasks and mark evidence completion over time.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

// Made with Bob
