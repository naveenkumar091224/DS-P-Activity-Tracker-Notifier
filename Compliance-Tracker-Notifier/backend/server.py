from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, status, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import shutil
import secrets
from pathlib import Path

from db import get_db, init_db, SessionLocal
from models import Project, ControlTemplate, ProjectControl, TaskInstance
from schemas import (
    Project as ProjectSchema,
    ProjectCreate,
    ProjectUpdate,
    ControlTemplate as ControlTemplateSchema,
    TaskInstance as TaskInstanceSchema,
    TaskInstanceDetail as TaskInstanceDetailSchema,
    TaskInstanceUpdate,
    DashboardStats,
    ExcelImportResponse,
    ExcelWorkbookSheetsResponse,
    ExcelSheetInfo
)
from auth_schemas import (
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    ChangePasswordRequest,
    VerifyTokenResponse,
    UserProfile
)
from auth_service import (
    authenticate_user,
    register_user,
    initiate_password_reset,
    reset_password,
    change_password,
    user_to_profile,
    create_demo_users
)
from auth_utils import create_access_token, verify_token
from excel_service import ExcelImportService
from datetime import datetime, timedelta
from slack_service import get_slack_service
from notification_scheduler import start_scheduler, stop_scheduler

app = FastAPI(title="Compliance Tracker API", version="1.0.0")

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()
    print("Database initialized successfully")
    
    # Create demo users for testing
    db = SessionLocal()
    try:
        create_demo_users(db)
        print("Demo users created/verified")
    finally:
        db.close()
    
    # Start notification scheduler
    start_scheduler()
    print("Notification scheduler started")

@app.on_event("shutdown")
async def shutdown_event():
    stop_scheduler()
    print("Notification scheduler stopped")

# Health check endpoints
@app.get("/")
def read_root():
    return {"message": "Compliance Tracker API", "status": "running"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "message": "Backend is running"}

# ==================== AUTHENTICATION DEPENDENCY ====================

def get_current_user_id(authorization: Optional[str] = Header(None)) -> int:
    """Extract and validate user ID from JWT token in Authorization header"""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )
    
    # Extract token from "Bearer <token>" format
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication scheme"
            )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )
    
    # Verify and decode token
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    # Extract user_id from token
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    try:
        user_id = int(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token"
        )
    
    return user_id

# ==================== AUTHENTICATION ENDPOINTS ====================

@app.post("/api/auth/login", response_model=LoginResponse)
async def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user with username/email and password"""
    user = authenticate_user(db, credentials.username_or_email, credentials.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": str(user.id), "username": user.username})
    
    return LoginResponse(
        success=True,
        message="Login successful",
        user=user_to_profile(user),
        token=access_token
    )


@app.post("/api/auth/register", response_model=RegisterResponse)
async def register(registration: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user account"""
    user, error = register_user(db, registration)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error
        )
    
    return RegisterResponse(
        success=True,
        message="Registration successful! You can now log in.",
        user=user_to_profile(user)
    )


@app.post("/api/auth/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Initiate password reset process"""
    success, message, reset_token = initiate_password_reset(db, request.email)
    
    # In development, return the token (in production, send via email)
    if reset_token:
        message += f" [DEV MODE - Reset Token: {reset_token}]"
    
    return ForgotPasswordResponse(
        success=success,
        message=message
    )


@app.post("/api/auth/reset-password", response_model=ResetPasswordResponse)
async def reset_password_endpoint(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password using token"""
    success, message = reset_password(db, request.token, request.new_password)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    
    return ResetPasswordResponse(
        success=success,
        message=message
    )


@app.get("/api/auth/verify-token/{token}", response_model=VerifyTokenResponse)
async def verify_reset_token(token: str, db: Session = Depends(get_db)):
    """Verify if a reset token is valid"""
    from user_models import User
    from datetime import datetime
    
    user = db.query(User).filter(User.reset_token == token).first()
    
    if not user or user.reset_token_expiry < datetime.utcnow():
        return VerifyTokenResponse(
            valid=False,
            message="Invalid or expired token"
        )
    
    return VerifyTokenResponse(
        valid=True,
        message="Token is valid"
    )


@app.post("/api/auth/change-password")
async def change_password_endpoint(
    request: ChangePasswordRequest,
    user_id: int,  # In production, get from JWT token
    db: Session = Depends(get_db)
):
    """Change password for authenticated user"""
    success, message = change_password(db, user_id, request.old_password, request.new_password)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    
    return {"success": success, "message": message}

# ==================== PROJECT ENDPOINTS ====================

@app.post("/api/projects", response_model=ProjectSchema, status_code=status.HTTP_201_CREATED)
async def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Create a new project (user-specific)"""
    # Check if project code already exists for this user
    existing = db.query(Project).filter(
        Project.code == project.code,
        Project.user_id == current_user_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Project code already exists")

    # Create project with user_id
    project_data = project.dict()
    project_data['user_id'] = current_user_id
    db_project = Project(**project_data)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    
    # Send Slack notification
    slack_service = get_slack_service()
    await slack_service.notify_project_created(db_project)
    
    return db_project

@app.get("/api/projects", response_model=List[ProjectSchema])
def get_projects(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Get all projects for the current user"""
    projects = db.query(Project).filter(
        Project.user_id == current_user_id
    ).offset(skip).limit(limit).all()
    return projects

@app.get("/api/projects/{project_id}", response_model=ProjectSchema)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Get a specific project (must belong to current user)"""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user_id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@app.put("/api/projects/{project_id}", response_model=ProjectSchema)
def update_project(
    project_id: int,
    project_update: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Update a project (must belong to current user)"""
    db_project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user_id
    ).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")

    update_data = project_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_project, field, value)

    db_project.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_project)
    return db_project

@app.delete("/api/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Delete a project (must belong to current user)"""
    db_project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user_id
    ).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")

    db.delete(db_project)
    db.commit()
    return None

# ==================== EXCEL IMPORT ENDPOINTS ====================

@app.post("/api/excel/sheets", response_model=ExcelWorkbookSheetsResponse)
async def list_excel_sheets(file: UploadFile = File(...)):
    """Upload workbook temporarily and list sheet names for selection"""
    if not file.filename or not file.filename.endswith(('.xlsx', '.xlsm')):
        raise HTTPException(status_code=400, detail="Only .xlsx and .xlsm files are supported")

    file_token = secrets.token_hex(16)
    file_path = UPLOAD_DIR / f"{file_token}_{file.filename}"

    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        excel_service = ExcelImportService(None)
        sheet_names = excel_service.get_sheet_names(str(file_path))

        return ExcelWorkbookSheetsResponse(
            success=True,
            file_token=file_token,
            sheets=[ExcelSheetInfo(name=name, index=index) for index, name in enumerate(sheet_names)],
            message="Select the sheet from which tasks should be imported"
        )
    except Exception as e:
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=500, detail=f"Failed to inspect Excel workbook: {str(e)}")

@app.post("/api/projects/{project_id}/import-excel", response_model=ExcelImportResponse)
async def import_excel(
    project_id: int,
    sheet_name: str = Form(...),
    file_token: str = Form(...),
    original_filename: str = Form(...),
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Import Excel file for a project from a selected sheet (must belong to current user)"""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user_id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    matching_files = list(UPLOAD_DIR.glob(f"{file_token}_*"))
    if not matching_files:
        raise HTTPException(status_code=400, detail="Uploaded workbook session expired. Please upload the file again.")

    file_path = matching_files[0]

    try:
        excel_service = ExcelImportService(db)
        result = excel_service.import_to_project(project_id, str(file_path), sheet_name=sheet_name)

        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("message", "Import failed"))

        # Send Slack notification
        slack_service = get_slack_service()
        await slack_service.notify_excel_imported(
            project,
            result.get("controls_created", 0),
            result.get("tasks_created", 0)
        )

        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")
    finally:
        if file_path.exists():
            file_path.unlink()

# ==================== CONTROL TEMPLATE ENDPOINTS ====================

@app.get("/api/control-templates", response_model=List[ControlTemplateSchema])
def get_control_templates(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all control templates"""
    templates = db.query(ControlTemplate).filter(ControlTemplate.is_active == True).offset(skip).limit(limit).all()
    return templates

@app.get("/api/control-templates/{template_id}", response_model=ControlTemplateSchema)
def get_control_template(template_id: int, db: Session = Depends(get_db)):
    """Get a specific control template"""
    template = db.query(ControlTemplate).filter(ControlTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Control template not found")
    return template

# ==================== TASK INSTANCE ENDPOINTS ====================

def _serialize_task_detail(task: TaskInstance) -> TaskInstanceDetailSchema:
    control_template = task.project_control.control_template if task.project_control else None
    project_control = task.project_control

    raw_metadata = {}
    if task.completion_notes:
        for line in task.completion_notes.splitlines():
            if ": " not in line:
                continue
            key, value = line.split(": ", 1)
            raw_metadata[key.strip().lower().replace(" ", "_")] = value.strip()

    source_row_number = raw_metadata.get("source_row")
    try:
        parsed_source_row_number = int(source_row_number) if source_row_number else None
    except ValueError:
        parsed_source_row_number = None

    return TaskInstanceDetailSchema(
        id=task.id,
        project_control_id=task.project_control_id,
        project_id=task.project_id,
        control_template_id=task.control_template_id,
        instance_label=task.instance_label,
        planned_date=task.planned_date,
        actual_date=task.actual_date,
        status=task.status,
        completion_notes=task.completion_notes,
        evidence_uploaded=task.evidence_uploaded,
        created_at=task.created_at,
        updated_at=task.updated_at,
        control_title=control_template.title if control_template else None,
        control_description=control_template.description if control_template else None,
        control_code=control_template.control_code if control_template else None,
        scheduled_frequency=control_template.scheduled_frequency if control_template else None,
        assigned_to=project_control.assigned_to if project_control and project_control.assigned_to else [],
        evidence_location=project_control.evidence_location if project_control else None,
        project_code=task.project.code if task.project else None,
        source_sheet=raw_metadata.get("source_sheet"),
        source_row_number=parsed_source_row_number,
        raw_task_name=raw_metadata.get("task_name"),
        raw_task_description=raw_metadata.get("task_description"),
        raw_guidance=raw_metadata.get("guidance"),
        raw_frequency_event=raw_metadata.get("event_frequency"),
        raw_frequency_scheduled=raw_metadata.get("scheduled_frequency"),
        raw_assigned_to=raw_metadata.get("assigned_to"),
        raw_evidence_location=raw_metadata.get("evidence_location"),
        raw_planned_date=raw_metadata.get("planned_date_raw"),
        raw_actual_date=raw_metadata.get("actual_date_raw")
    )

@app.get("/api/projects/{project_id}/tasks", response_model=List[TaskInstanceDetailSchema])
def get_project_tasks(
    project_id: int,
    status_filter: str | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Get all tasks for a project (must belong to current user)"""
    # Verify project belongs to user
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user_id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    query = db.query(TaskInstance).filter(TaskInstance.project_id == project_id)

    if status_filter:
        query = query.filter(TaskInstance.status == status_filter)

    tasks = query.order_by(TaskInstance.planned_date).offset(skip).limit(limit).all()
    return [_serialize_task_detail(task) for task in tasks]

@app.get("/api/tasks", response_model=List[TaskInstanceDetailSchema])
def get_all_tasks(
    status_filter: str | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Get all tasks across all user's projects"""
    # Get user's project IDs
    user_project_ids = db.query(Project.id).filter(
        Project.user_id == current_user_id
    ).all()
    user_project_ids = [pid[0] for pid in user_project_ids]
    
    query = db.query(TaskInstance).filter(
        TaskInstance.project_id.in_(user_project_ids)
    )

    if status_filter:
        query = query.filter(TaskInstance.status == status_filter)

    tasks = query.order_by(TaskInstance.planned_date).offset(skip).limit(limit).all()
    return [_serialize_task_detail(task) for task in tasks]

@app.put("/api/tasks/{task_id}", response_model=TaskInstanceSchema)
def update_task(
    task_id: int,
    task_update: TaskInstanceUpdate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Update a task instance (must belong to user's project)"""
    db_task = db.query(TaskInstance).join(Project).filter(
        TaskInstance.id == task_id,
        Project.user_id == current_user_id
    ).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = task_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_task, field, value)

    if db_task.actual_date:
        db_task.status = "completed"
    elif db_task.status == "completed":
        db_task.status = "pending"

    db_task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_task)
    return db_task

@app.post("/api/tasks/{task_id}/complete", response_model=TaskInstanceSchema)
async def complete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Mark a task as complete (must belong to user's project)"""
    db_task = db.query(TaskInstance).join(Project).filter(
        TaskInstance.id == task_id,
        Project.user_id == current_user_id
    ).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    db_task.status = "completed"
    db_task.actual_date = datetime.utcnow()
    db_task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_task)
    
    # Send Slack notification
    slack_service = get_slack_service()
    await slack_service.notify_task_completed(db_task, db)
    
    return db_task

# ==================== DASHBOARD ENDPOINTS ====================

@app.get("/api/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Get dashboard statistics for current user"""
    # Get user's project IDs
    user_project_ids = db.query(Project.id).filter(
        Project.user_id == current_user_id
    ).all()
    user_project_ids = [pid[0] for pid in user_project_ids]
    
    # Count user's projects
    total_projects = db.query(Project).filter(
        Project.user_id == current_user_id
    ).count()
    active_projects = db.query(Project).filter(
        Project.user_id == current_user_id,
        Project.status == "active"
    ).count()

    # Control templates are global (not user-specific)
    total_controls = db.query(ControlTemplate).filter(ControlTemplate.is_active == True).count()
    
    # Count applicable controls for user's projects
    applicable_controls = db.query(ProjectControl).filter(
        ProjectControl.project_id.in_(user_project_ids),
        ProjectControl.is_applicable == True
    ).count()

    today = datetime.utcnow().date()
    tomorrow = today + timedelta(days=1)
    week_end = today + timedelta(days=7)

    # Count tasks for user's projects only
    tasks_due_today = db.query(TaskInstance).filter(
        TaskInstance.project_id.in_(user_project_ids),
        TaskInstance.status == "pending",
        TaskInstance.planned_date >= datetime.combine(today, datetime.min.time()),
        TaskInstance.planned_date < datetime.combine(tomorrow, datetime.min.time())
    ).count()

    tasks_due_this_week = db.query(TaskInstance).filter(
        TaskInstance.project_id.in_(user_project_ids),
        TaskInstance.status == "pending",
        TaskInstance.planned_date >= datetime.combine(today, datetime.min.time()),
        TaskInstance.planned_date < datetime.combine(week_end, datetime.min.time())
    ).count()

    overdue_tasks = db.query(TaskInstance).filter(
        TaskInstance.project_id.in_(user_project_ids),
        TaskInstance.status == "pending",
        TaskInstance.planned_date < datetime.combine(today, datetime.min.time())
    ).count()

    completed_tasks = db.query(TaskInstance).filter(
        TaskInstance.project_id.in_(user_project_ids),
        TaskInstance.status == "completed"
    ).count()

    return DashboardStats(
        total_projects=total_projects,
        active_projects=active_projects,
        total_controls=total_controls,
        applicable_controls=applicable_controls,
        tasks_due_today=tasks_due_today,
        tasks_due_this_week=tasks_due_this_week,
        overdue_tasks=overdue_tasks,
        completed_tasks=completed_tasks
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

# Made with Bob
