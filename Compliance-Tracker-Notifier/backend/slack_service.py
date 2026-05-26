"""
Slack Notification Service for Compliance Tracker
Sends notifications about tasks, deadlines, and project updates to Slack
"""

import os
import json
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, date
import httpx
from sqlalchemy.orm import Session

from models import TaskInstance, Project, ControlTemplate

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SlackNotificationService:
    """Service for sending notifications to Slack via Incoming Webhooks"""
    
    def __init__(self, webhook_url: Optional[str] = None):
        """
        Initialize Slack notification service
        
        Args:
            webhook_url: Slack webhook URL. If not provided, reads from SLACK_WEBHOOK_URL env var
        """
        self.webhook_url = webhook_url or os.getenv("SLACK_WEBHOOK_URL")
        self.enabled = bool(self.webhook_url)
        
        if not self.enabled:
            logger.warning("Slack notifications disabled: SLACK_WEBHOOK_URL not configured")
    
    async def send_message(self, blocks: List[Dict[str, Any]], text: str = "") -> bool:
        """
        Send a message to Slack using Block Kit
        
        Args:
            blocks: List of Slack Block Kit blocks
            text: Fallback text for notifications
            
        Returns:
            True if message sent successfully, False otherwise
        """
        if not self.enabled:
            logger.info(f"Slack disabled. Would have sent: {text}")
            return False
        
        payload = {
            "text": text,
            "blocks": blocks
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.webhook_url,
                    json=payload,
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    logger.info(f"Slack notification sent successfully: {text}")
                    return True
                else:
                    logger.error(f"Slack notification failed: {response.status_code} - {response.text}")
                    return False
                    
        except Exception as e:
            logger.error(f"Error sending Slack notification: {str(e)}")
            return False
    
    def _format_date(self, date_obj: Optional[date]) -> str:
        """Format date for display"""
        if not date_obj:
            return "Not set"
        return date_obj.strftime("%d-%b-%Y")
    
    def _get_priority_emoji(self, days_until_due: int) -> str:
        """Get emoji based on urgency"""
        if days_until_due < 0:
            return "🔴"  # Overdue
        elif days_until_due == 0:
            return "🟠"  # Due today
        elif days_until_due <= 3:
            return "🟡"  # Due soon
        else:
            return "🟢"  # Not urgent
    
    async def notify_task_due_today(self, tasks: List[TaskInstance], db: Session) -> bool:
        """
        Send notification for tasks due today
        
        Args:
            tasks: List of TaskInstance objects due today
            db: Database session
            
        Returns:
            True if notification sent successfully
        """
        if not tasks:
            return False
        
        # Build task list
        task_lines = []
        for task in tasks[:10]:  # Limit to 10 tasks
            project = db.query(Project).filter(Project.id == task.project_id).first()
            control = db.query(ControlTemplate).filter(
                ControlTemplate.id == task.control_template_id
            ).first()
            
            project_name = project.name if project else "Unknown Project"
            task_desc = control.control_objective if control else "Unknown Task"
            
            task_lines.append(f"• *{project_name}*: {task_desc[:80]}...")
        
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "🟠 Tasks Due Today",
                    "emoji": True
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"You have *{len(tasks)} task(s)* due today:\n\n" + "\n".join(task_lines)
                }
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"📅 {datetime.now().strftime('%A, %B %d, %Y')}"
                    }
                ]
            }
        ]
        
        if len(tasks) > 10:
            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"_...and {len(tasks) - 10} more tasks_"
                }
            })
        
        return await self.send_message(
            blocks=blocks,
            text=f"Tasks Due Today: {len(tasks)} task(s) need attention"
        )
    
    async def notify_overdue_tasks(self, tasks: List[TaskInstance], db: Session) -> bool:
        """
        Send notification for overdue tasks
        
        Args:
            tasks: List of overdue TaskInstance objects
            db: Database session
            
        Returns:
            True if notification sent successfully
        """
        if not tasks:
            return False
        
        # Build task list
        task_lines = []
        for task in tasks[:10]:  # Limit to 10 tasks
            project = db.query(Project).filter(Project.id == task.project_id).first()
            control = db.query(ControlTemplate).filter(
                ControlTemplate.id == task.control_template_id
            ).first()
            
            project_name = project.name if project else "Unknown Project"
            task_desc = control.control_objective if control else "Unknown Task"
            days_overdue = (datetime.now().date() - task.planned_completion_date).days
            
            task_lines.append(
                f"• *{project_name}*: {task_desc[:60]}... "
                f"(_Overdue by {days_overdue} day(s)_)"
            )
        
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "🔴 Overdue Tasks Alert",
                    "emoji": True
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"⚠️ You have *{len(tasks)} overdue task(s)*:\n\n" + "\n".join(task_lines)
                }
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": "Please review and complete these tasks as soon as possible"
                    }
                ]
            }
        ]
        
        if len(tasks) > 10:
            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"_...and {len(tasks) - 10} more overdue tasks_"
                }
            })
        
        return await self.send_message(
            blocks=blocks,
            text=f"Overdue Tasks: {len(tasks)} task(s) need immediate attention"
        )
    
    async def notify_upcoming_tasks(self, tasks: List[TaskInstance], days: int, db: Session) -> bool:
        """
        Send notification for tasks due in the next N days
        
        Args:
            tasks: List of TaskInstance objects
            days: Number of days to look ahead
            db: Database session
            
        Returns:
            True if notification sent successfully
        """
        if not tasks:
            return False
        
        # Build task list
        task_lines = []
        for task in tasks[:10]:  # Limit to 10 tasks
            project = db.query(Project).filter(Project.id == task.project_id).first()
            control = db.query(ControlTemplate).filter(
                ControlTemplate.id == task.control_template_id
            ).first()
            
            project_name = project.name if project else "Unknown Project"
            task_desc = control.control_objective if control else "Unknown Task"
            due_date = self._format_date(task.planned_completion_date)
            days_until = (task.planned_completion_date - datetime.now().date()).days
            emoji = self._get_priority_emoji(days_until)
            
            task_lines.append(
                f"{emoji} *{project_name}*: {task_desc[:60]}... "
                f"(_Due: {due_date}_)"
            )
        
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"📅 Tasks Due in Next {days} Days",
                    "emoji": True
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"You have *{len(tasks)} task(s)* coming up:\n\n" + "\n".join(task_lines)
                }
            }
        ]
        
        if len(tasks) > 10:
            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"_...and {len(tasks) - 10} more tasks_"
                }
            })
        
        return await self.send_message(
            blocks=blocks,
            text=f"Upcoming Tasks: {len(tasks)} task(s) due in next {days} days"
        )
    
    async def notify_task_completed(self, task: TaskInstance, db: Session) -> bool:
        """
        Send notification when a task is completed
        
        Args:
            task: Completed TaskInstance object
            db: Database session
            
        Returns:
            True if notification sent successfully
        """
        project = db.query(Project).filter(Project.id == task.project_id).first()
        control = db.query(ControlTemplate).filter(
            ControlTemplate.id == task.control_template_id
        ).first()
        
        project_name = project.name if project else "Unknown Project"
        task_desc = control.control_objective if control else "Unknown Task"
        
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "✅ Task Completed",
                    "emoji": True
                }
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": f"*Project:*\n{project_name}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Completed:*\n{self._format_date(task.actual_completion_date)}"
                    }
                ]
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Task:*\n{task_desc}"
                }
            }
        ]
        
        return await self.send_message(
            blocks=blocks,
            text=f"Task Completed: {task_desc[:100]}"
        )
    
    async def notify_project_created(self, project: Project) -> bool:
        """
        Send notification when a new project is created
        
        Args:
            project: New Project object
            
        Returns:
            True if notification sent successfully
        """
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "🆕 New Project Created",
                    "emoji": True
                }
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": f"*Project Name:*\n{project.name}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Project Code:*\n{project.code}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Start Date:*\n{self._format_date(project.start_date)}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Client:*\n{project.client or 'Not specified'}"
                    }
                ]
            }
        ]
        
        if project.description:
            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Description:*\n{project.description}"
                }
            })
        
        return await self.send_message(
            blocks=blocks,
            text=f"New Project Created: {project.name}"
        )
    
    async def notify_excel_imported(self, project: Project, controls_count: int, tasks_count: int) -> bool:
        """
        Send notification when Excel file is imported
        
        Args:
            project: Project object
            controls_count: Number of controls imported
            tasks_count: Number of tasks created
            
        Returns:
            True if notification sent successfully
        """
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "📤 Excel Import Completed",
                    "emoji": True
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"Excel file successfully imported for *{project.name}*"
                }
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": f"*Controls:*\n{controls_count}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Tasks:*\n{tasks_count}"
                    }
                ]
            }
        ]
        
        return await self.send_message(
            blocks=blocks,
            text=f"Excel Import: {controls_count} controls, {tasks_count} tasks for {project.name}"
        )
    
    async def send_daily_summary(self, stats: Dict[str, Any]) -> bool:
        """
        Send daily summary of compliance status
        
        Args:
            stats: Dictionary containing dashboard statistics
            
        Returns:
            True if notification sent successfully
        """
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "📊 Daily Compliance Summary",
                    "emoji": True
                }
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": f"*Active Projects:*\n{stats.get('active_projects', 0)}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Total Controls:*\n{stats.get('total_controls', 0)}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Due Today:*\n{stats.get('tasks_due_today', 0)}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Due This Week:*\n{stats.get('tasks_due_this_week', 0)}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Overdue:*\n🔴 {stats.get('overdue_tasks', 0)}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Completed:*\n✅ {stats.get('completed_tasks', 0)}"
                    }
                ]
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"📅 {datetime.now().strftime('%A, %B %d, %Y')}"
                    }
                ]
            }
        ]
        
        return await self.send_message(
            blocks=blocks,
            text=f"Daily Summary: {stats.get('tasks_due_today', 0)} due today, {stats.get('overdue_tasks', 0)} overdue"
        )


# Singleton instance
_slack_service: Optional[SlackNotificationService] = None


def get_slack_service() -> SlackNotificationService:
    """Get or create Slack notification service instance"""
    global _slack_service
    if _slack_service is None:
        _slack_service = SlackNotificationService()
    return _slack_service

# Made with Bob
