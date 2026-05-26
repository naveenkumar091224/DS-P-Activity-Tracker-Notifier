from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime)
    status = Column(String(20), default="active")  # active, on-hold, completed, archived
    team_members = Column(JSON)  # ["DPE", "PM", "SE"]
    client = Column(String(255))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Owner of the project
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    owner = relationship("User", back_populates="projects")
    project_controls = relationship("ProjectControl", back_populates="project", cascade="all, delete-orphan")
    task_instances = relationship("TaskInstance", back_populates="project", cascade="all, delete-orphan")

class ControlTemplate(Base):
    __tablename__ = "control_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    control_code = Column(String(50), nullable=False)
    category = Column(String(100), nullable=False)
    frequency_type = Column(String(20))  # event-driven, scheduled, both
    event_trigger = Column(Text)
    scheduled_frequency = Column(String(20))  # monthly, quarterly, annually, ongoing
    default_assignees = Column(JSON)  # ["DPE", "PM", "SE"]
    evidence_required = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    project_controls = relationship("ProjectControl", back_populates="control_template", cascade="all, delete-orphan")

class ProjectControl(Base):
    __tablename__ = "project_controls"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    control_template_id = Column(Integer, ForeignKey("control_templates.id", ondelete="CASCADE"), nullable=False)
    is_applicable = Column(Boolean, nullable=False, default=True)
    applicability_reason = Column(Text)
    custom_frequency = Column(String(20))
    custom_due_day = Column(Integer)
    assigned_to = Column(JSON)  # Project-specific team
    evidence_location = Column(String(500))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    project = relationship("Project", back_populates="project_controls")
    control_template = relationship("ControlTemplate", back_populates="project_controls")
    task_instances = relationship("TaskInstance", back_populates="project_control", cascade="all, delete-orphan")

class TaskInstance(Base):
    __tablename__ = "task_instances"
    
    id = Column(Integer, primary_key=True, index=True)
    project_control_id = Column(Integer, ForeignKey("project_controls.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    control_template_id = Column(Integer, ForeignKey("control_templates.id"), nullable=False)
    instance_label = Column(String(50), nullable=False)  # "Jan'26", "Q1'26"
    planned_date = Column(DateTime, nullable=False)
    actual_date = Column(DateTime)
    status = Column(String(20), default="pending")  # pending, completed, overdue, not-applicable, skipped
    completion_notes = Column(Text)
    evidence_uploaded = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    project_control = relationship("ProjectControl", back_populates="task_instances")
    project = relationship("Project", back_populates="task_instances")
    reminders = relationship("Reminder", back_populates="task_instance", cascade="all, delete-orphan")

class Reminder(Base):
    __tablename__ = "reminders"
    
    id = Column(Integer, primary_key=True, index=True)
    task_instance_id = Column(Integer, ForeignKey("task_instances.id", ondelete="CASCADE"), nullable=False)
    reminder_date = Column(DateTime, nullable=False)
    sent = Column(Boolean, default=False)
    sent_at = Column(DateTime)
    notification_channels = Column(JSON)  # ["desktop", "email", "slack"]
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    task_instance = relationship("TaskInstance", back_populates="reminders")
    notification_logs = relationship("NotificationLog", back_populates="reminder", cascade="all, delete-orphan")

class NotificationLog(Base):
    __tablename__ = "notification_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    reminder_id = Column(Integer, ForeignKey("reminders.id", ondelete="CASCADE"))
    channel = Column(String(20), nullable=False)  # desktop, email, slack
    status = Column(String(20), nullable=False)  # success, failed
    message = Column(Text)
    sent_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    reminder = relationship("Reminder", back_populates="notification_logs")

# Made with Bob
