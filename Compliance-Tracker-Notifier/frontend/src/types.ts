export interface Project {
  id: number;
  name: string;
  code: string;
  description?: string;
  start_date: string;
  end_date?: string;
  status: string;
  team_members: string[];
  client?: string;
  created_at: string;
  updated_at: string;
}

export interface ControlTemplate {
  id: number;
  title: string;
  description?: string;
  control_code: string;
  category: string;
  frequency_type?: string;
  event_trigger?: string;
  scheduled_frequency?: string;
  default_assignees: string[];
  evidence_required: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskInstance {
  id: number;
  project_control_id: number;
  project_id: number;
  control_template_id: number;
  instance_label: string;
  planned_date: string;
  actual_date?: string;
  status: string;
  completion_notes?: string;
  evidence_uploaded: boolean;
  created_at: string;
  updated_at: string;
  control_title?: string;
  control_description?: string;
  control_code?: string;
  scheduled_frequency?: string;
  assigned_to?: string[];
  evidence_location?: string;
  project_code?: string;
  source_sheet?: string;
  source_row_number?: number;
  raw_task_name?: string;
  raw_task_description?: string;
  raw_guidance?: string;
  raw_frequency_event?: string;
  raw_frequency_scheduled?: string;
  raw_assigned_to?: string;
  raw_evidence_location?: string;
  raw_planned_date?: string;
  raw_actual_date?: string;
}

export interface ExcelWorkbookSelection {
  file: File | null;
  sheets: ExcelSheetInfo[];
  selectedSheet: string;
  fileToken: string;
  loading: boolean;
}

export interface DashboardStats {
  total_projects: number;
  active_projects: number;
  total_controls: number;
  applicable_controls: number;
  tasks_due_today: number;
  tasks_due_this_week: number;
  overdue_tasks: number;
  completed_tasks: number;
}

export interface ExcelSheetInfo {
  name: string;
  index: number;
}

export interface ExcelWorkbookSheetsResponse {
  success: boolean;
  file_token: string;
  sheets: ExcelSheetInfo[];
  message?: string;
}

export interface ExcelImportResponse {
  success: boolean;
  message: string;
  controls_created: number;
  tasks_created: number;
  errors?: string[];
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  created_at?: string;
}

export interface LoginRequest {
  username_or_email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: UserProfile;
  token?: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user?: UserProfile;
}

// Made with Bob
