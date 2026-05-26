import axios from 'axios';
import {
  Project,
  ControlTemplate,
  TaskInstance,
  DashboardStats,
  ExcelWorkbookSheetsResponse,
  ExcelImportResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse
} from './types';

const API_BASE_URL = window.location.protocol === 'file:'
  ? 'http://localhost:8000/api'
  : '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Projects
export const getProjects = async (): Promise<Project[]> => {
  const response = await api.get('/projects');
  return response.data;
};

export const getProject = async (id: number): Promise<Project> => {
  const response = await api.get(`/projects/${id}`);
  return response.data;
};

export const createProject = async (project: Partial<Project>): Promise<Project> => {
  const response = await api.post('/projects', project);
  return response.data;
};

export const updateProject = async (id: number, project: Partial<Project>): Promise<Project> => {
  const response = await api.put(`/projects/${id}`, project);
  return response.data;
};

export const deleteProject = async (id: number): Promise<void> => {
  await api.delete(`/projects/${id}`);
};

export const listExcelSheets = async (file: File): Promise<ExcelWorkbookSheetsResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/excel/sheets', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const importExcel = async (
  projectId: number,
  fileToken: string,
  originalFilename: string,
  sheetName: string
): Promise<ExcelImportResponse> => {
  const formData = new FormData();
  formData.append('file_token', fileToken);
  formData.append('original_filename', originalFilename);
  formData.append('sheet_name', sheetName);

  const response = await api.post(`/projects/${projectId}/import-excel`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Control Templates
export const getControlTemplates = async (): Promise<ControlTemplate[]> => {
  const response = await api.get('/control-templates');
  return response.data;
};

// Tasks
export const getProjectTasks = async (projectId: number, status?: string): Promise<TaskInstance[]> => {
  const params = status ? { status_filter: status } : {};
  const response = await api.get(`/projects/${projectId}/tasks`, { params });
  return response.data;
};

export const getAllTasks = async (status?: string): Promise<TaskInstance[]> => {
  const params = status ? { status_filter: status } : {};
  const response = await api.get('/tasks', { params });
  return response.data;
};

export const updateTask = async (id: number, task: Partial<TaskInstance>): Promise<TaskInstance> => {
  const response = await api.put(`/tasks/${id}`, task);
  return response.data;
};

export const completeTask = async (id: number): Promise<TaskInstance> => {
  const response = await api.post(`/tasks/${id}/complete`);
  return response.data;
};

export const updateTaskActualDate = async (id: number, actualDate?: string): Promise<TaskInstance> => {
  const payload = actualDate
    ? {
        actual_date: new Date(actualDate).toISOString(),
        status: 'completed'
      }
    : {
        actual_date: null,
        status: 'pending'
      };

  const response = await api.put(`/tasks/${id}`, payload);
  return response.data;
};

// Dashboard
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get('/dashboard/stats');
  return response.data;
};

// Authentication
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const register = async (userData: RegisterRequest): Promise<RegisterResponse> => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export default api;

// Made with Bob
