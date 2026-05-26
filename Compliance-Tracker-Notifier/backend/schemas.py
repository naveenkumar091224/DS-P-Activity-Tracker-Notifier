from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# Project Schemas
class ProjectBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    status: str = "active"
    team_members: Optional[List[str]] = []
    client: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[str] = None
    team_members: Optional[List[str]] = None
    client: Optional[str] = None


class Project(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Control Template Schemas
class ControlTemplateBase(BaseModel):
    title: str
    description: Optional[str] = None
    control_code: str
    category: str
    frequency_type: Optional[str] = None
    event_trigger: Optional[str] = None
    scheduled_frequency: Optional[str] = None
    default_assignees: Optional[List[str]] = []
    evidence_required: bool = True
    is_active: bool = True


class ControlTemplateCreate(ControlTemplateBase):
    pass


class ControlTemplate(ControlTemplateBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Project Control Schemas
class ProjectControlBase(BaseModel):
    project_id: int
    control_template_id: int
    is_applicable: bool = True
    applicability_reason: Optional[str] = None
    custom_frequency: Optional[str] = None
    custom_due_day: Optional[int] = None
    assigned_to: Optional[List[str]] = []
    evidence_location: Optional[str] = None
    notes: Optional[str] = None


class ProjectControlCreate(ProjectControlBase):
    pass


class ProjectControl(ProjectControlBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Task Instance Schemas
class TaskInstanceBase(BaseModel):
    project_control_id: int
    project_id: int
    control_template_id: int
    instance_label: str
    planned_date: datetime
    actual_date: Optional[datetime] = None
    status: str = "pending"
    completion_notes: Optional[str] = None
    evidence_uploaded: bool = False


class TaskInstanceCreate(TaskInstanceBase):
    pass


class TaskInstanceUpdate(BaseModel):
    actual_date: Optional[datetime] = None
    status: Optional[str] = None
    completion_notes: Optional[str] = None
    evidence_uploaded: Optional[bool] = None


class TaskInstance(TaskInstanceBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TaskInstanceDetail(TaskInstance):
    control_title: Optional[str] = None
    control_description: Optional[str] = None
    control_code: Optional[str] = None
    scheduled_frequency: Optional[str] = None
    assigned_to: Optional[List[str]] = []
    evidence_location: Optional[str] = None
    project_code: Optional[str] = None
    source_sheet: Optional[str] = None
    source_row_number: Optional[int] = None
    raw_task_name: Optional[str] = None
    raw_task_description: Optional[str] = None
    raw_guidance: Optional[str] = None
    raw_frequency_event: Optional[str] = None
    raw_frequency_scheduled: Optional[str] = None
    raw_assigned_to: Optional[str] = None
    raw_evidence_location: Optional[str] = None
    raw_planned_date: Optional[str] = None
    raw_actual_date: Optional[str] = None



# Excel Import Schemas
class ExcelImportRequest(BaseModel):
    project_id: int


class ExcelSheetInfo(BaseModel):
    name: str
    index: int


class ExcelWorkbookSheetsResponse(BaseModel):
    success: bool
    file_token: str
    sheets: List[ExcelSheetInfo]
    message: Optional[str] = None


class ExcelImportResponse(BaseModel):
    success: bool
    message: str
    controls_created: int
    tasks_created: int
    errors: Optional[List[str]] = []


# Dashboard Stats Schema
class DashboardStats(BaseModel):
    total_projects: int
    active_projects: int
    total_controls: int
    applicable_controls: int
    tasks_due_today: int
    tasks_due_this_week: int
    overdue_tasks: int
    completed_tasks: int


# Made with Bob
