"""
Notification Scheduler for Compliance Tracker
Schedules and sends periodic notifications about tasks and compliance status
"""

import logging
from datetime import datetime, timedelta, date
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from typing import Set

from db import SessionLocal
from models import TaskInstance, Project
from slack_service import get_slack_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Track notifications sent today to prevent duplicates
_notifications_sent_today: dict[str, Set[int]] = {
    'daily_summary': set(),
    'tasks_due_today': set(),
    'overdue_tasks': set(),
    'weekly_upcoming': set()
}
_last_notification_date: date = None


def reset_daily_tracking():
    """Reset notification tracking at start of new day"""
    global _notifications_sent_today, _last_notification_date
    today = datetime.now().date()
    
    if _last_notification_date != today:
        _notifications_sent_today = {
            'daily_summary': set(),
            'tasks_due_today': set(),
            'overdue_tasks': set(),
            'weekly_upcoming': set()
        }
        _last_notification_date = today
        logger.info(f"Reset notification tracking for {today}")


def should_send_notification(notification_type: str, task_id: int = None) -> bool:
    """Check if notification should be sent (once per day)"""
    reset_daily_tracking()
    
    if task_id is None:
        # For summary notifications, check if already sent today
        return notification_type not in _notifications_sent_today or \
               len(_notifications_sent_today[notification_type]) == 0
    else:
        # For task-specific notifications, check if this task was already notified
        return task_id not in _notifications_sent_today.get(notification_type, set())


def mark_notification_sent(notification_type: str, task_id: int = None):
    """Mark notification as sent"""
    reset_daily_tracking()
    
    if task_id is None:
        _notifications_sent_today[notification_type].add(0)  # Use 0 for summary notifications
    else:
        _notifications_sent_today[notification_type].add(task_id)


class NotificationScheduler:
    """Scheduler for automated compliance notifications"""
    
    def __init__(self):
        """Initialize the notification scheduler"""
        self.scheduler = AsyncIOScheduler()
        self.slack_service = get_slack_service()
        
    def start(self):
        """Start the notification scheduler"""
        if not self.slack_service.enabled:
            logger.warning("Slack notifications disabled. Scheduler will not start.")
            return
        
        # Daily summary at 8:30 AM (once per day)
        self.scheduler.add_job(
            self.send_daily_summary,
            CronTrigger(hour=8, minute=30),
            id='daily_summary',
            name='Send daily compliance summary at 8:30 AM',
            replace_existing=True
        )
        
        # Tasks due today - check at 8:30 AM (once per day)
        self.scheduler.add_job(
            self.notify_tasks_due_today,
            CronTrigger(hour=8, minute=30),
            id='tasks_due_today',
            name='Notify tasks due today at 8:30 AM',
            replace_existing=True
        )
        
        # Overdue tasks reminder - check at 9:30 AM (once per day)
        self.scheduler.add_job(
            self.notify_overdue_tasks,
            CronTrigger(hour=9, minute=30),
            id='overdue_tasks',
            name='Notify overdue tasks at 9:30 AM',
            replace_existing=True
        )
        
        # Weekly upcoming tasks - Monday at 8:30 AM (once per week)
        self.scheduler.add_job(
            self.notify_weekly_upcoming,
            CronTrigger(day_of_week='mon', hour=8, minute=30),
            id='weekly_upcoming',
            name='Notify weekly upcoming tasks on Monday at 8:30 AM',
            replace_existing=True
        )
        
        self.scheduler.start()
        logger.info("Notification scheduler started successfully with once-per-day tracking")
    
    def stop(self):
        """Stop the notification scheduler"""
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("Notification scheduler stopped")
    
    async def send_daily_summary(self):
        """Send daily compliance summary (once per day)"""
        if not should_send_notification('daily_summary'):
            logger.info("Daily summary already sent today, skipping...")
            return
            
        logger.info("Sending daily summary...")
        db = SessionLocal()
        
        try:
            today = datetime.now().date()
            week_from_now = today + timedelta(days=7)
            
            # Get statistics
            total_projects = db.query(Project).filter(Project.is_active == True).count()
            
            tasks_due_today = db.query(TaskInstance).filter(
                TaskInstance.planned_date == today,
                TaskInstance.actual_date.is_(None)
            ).count()
            
            tasks_due_this_week = db.query(TaskInstance).filter(
                TaskInstance.planned_date >= today,
                TaskInstance.planned_date <= week_from_now,
                TaskInstance.actual_date.is_(None)
            ).count()
            
            overdue_tasks = db.query(TaskInstance).filter(
                TaskInstance.planned_date < today,
                TaskInstance.actual_date.is_(None)
            ).count()
            
            completed_tasks = db.query(TaskInstance).filter(
                TaskInstance.actual_date.isnot(None)
            ).count()
            
            stats = {
                'active_projects': total_projects,
                'tasks_due_today': tasks_due_today,
                'tasks_due_this_week': tasks_due_this_week,
                'overdue_tasks': overdue_tasks,
                'completed_tasks': completed_tasks
            }
            
            await self.slack_service.send_daily_summary(stats)
            mark_notification_sent('daily_summary')
            logger.info("Daily summary sent successfully")
            
        except Exception as e:
            logger.error(f"Error sending daily summary: {str(e)}")
        finally:
            db.close()
    
    async def notify_tasks_due_today(self):
        """Notify about tasks due today (once per day per task)"""
        logger.info("Checking tasks due today...")
        db = SessionLocal()
        
        try:
            today = datetime.now().date()
            
            tasks = db.query(TaskInstance).filter(
                TaskInstance.planned_date == today,
                TaskInstance.actual_date.is_(None)
            ).all()
            
            # Filter out tasks already notified today
            tasks_to_notify = [t for t in tasks if should_send_notification('tasks_due_today', t.id)]
            
            if tasks_to_notify:
                await self.slack_service.notify_task_due_today(tasks_to_notify, db)
                # Mark all notified tasks
                for task in tasks_to_notify:
                    mark_notification_sent('tasks_due_today', task.id)
                logger.info(f"Notified about {len(tasks_to_notify)} tasks due today")
            else:
                if tasks:
                    logger.info(f"All {len(tasks)} tasks due today already notified")
                else:
                    logger.info("No tasks due today")
                
        except Exception as e:
            logger.error(f"Error notifying tasks due today: {str(e)}")
        finally:
            db.close()
    
    async def notify_overdue_tasks(self):
        """Notify about overdue tasks (once per day per task)"""
        logger.info("Checking overdue tasks...")
        db = SessionLocal()
        
        try:
            today = datetime.now().date()
            
            tasks = db.query(TaskInstance).filter(
                TaskInstance.planned_date < today,
                TaskInstance.actual_date.is_(None)
            ).all()
            
            # Filter out tasks already notified today
            tasks_to_notify = [t for t in tasks if should_send_notification('overdue_tasks', t.id)]
            
            if tasks_to_notify:
                await self.slack_service.notify_overdue_tasks(tasks_to_notify, db)
                # Mark all notified tasks
                for task in tasks_to_notify:
                    mark_notification_sent('overdue_tasks', task.id)
                logger.info(f"Notified about {len(tasks_to_notify)} overdue tasks")
            else:
                if tasks:
                    logger.info(f"All {len(tasks)} overdue tasks already notified today")
                else:
                    logger.info("No overdue tasks")
                
        except Exception as e:
            logger.error(f"Error notifying overdue tasks: {str(e)}")
        finally:
            db.close()
    
    async def notify_weekly_upcoming(self):
        """Notify about tasks due in the next 7 days (once per week)"""
        if not should_send_notification('weekly_upcoming'):
            logger.info("Weekly upcoming tasks already notified today, skipping...")
            return
            
        logger.info("Checking upcoming tasks for the week...")
        db = SessionLocal()
        
        try:
            today = datetime.now().date()
            week_from_now = today + timedelta(days=7)
            
            tasks = db.query(TaskInstance).filter(
                TaskInstance.planned_completion_date >= today,
                TaskInstance.planned_completion_date <= week_from_now,
                TaskInstance.actual_completion_date.is_(None)
            ).order_by(TaskInstance.planned_completion_date).all()
            
            if tasks:
                await self.slack_service.notify_upcoming_tasks(tasks, 7, db)
                mark_notification_sent('weekly_upcoming')
                logger.info(f"Notified about {len(tasks)} upcoming tasks")
            else:
                logger.info("No upcoming tasks this week")
                
        except Exception as e:
            logger.error(f"Error notifying upcoming tasks: {str(e)}")
        finally:
            db.close()


# Singleton instance
_scheduler: NotificationScheduler = None


def get_scheduler() -> NotificationScheduler:
    """Get or create notification scheduler instance"""
    global _scheduler
    if _scheduler is None:
        _scheduler = NotificationScheduler()
    return _scheduler


def start_scheduler():
    """Start the notification scheduler"""
    scheduler = get_scheduler()
    scheduler.start()


def stop_scheduler():
    """Stop the notification scheduler"""
    scheduler = get_scheduler()
    scheduler.stop()

# Made with Bob
