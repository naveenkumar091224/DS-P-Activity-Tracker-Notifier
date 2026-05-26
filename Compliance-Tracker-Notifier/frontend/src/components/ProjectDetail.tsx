import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getProject, getProjectTasks, completeTask, updateProject, updateTaskActualDate } from '../api';
import { Project, TaskInstance } from '../types';

const STATUS_OPTIONS = ['active', 'on-hold', 'closed', 'archived'];

function formatDateInput(value?: string) {
  if (!value) return '';
  return new Date(value).toISOString().split('T')[0];
}

function formatStatusLabel(status: string) {
  return status
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<TaskInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [projectForm, setProjectForm] = useState({
    name: '',
    code: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'active',
    client: '',
    team_members: ''
  });
  const [savingProject, setSavingProject] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [taskActualDateInput, setTaskActualDateInput] = useState('');

  useEffect(() => {
    if (id) {
      loadProjectData(parseInt(id));
    }
  }, [id]);

  const syncProjectForm = (projectData: Project) => {
    setProjectForm({
      name: projectData.name || '',
      code: projectData.code || '',
      description: projectData.description || '',
      start_date: formatDateInput(projectData.start_date),
      end_date: formatDateInput(projectData.end_date),
      status: projectData.status || 'active',
      client: projectData.client || '',
      team_members: projectData.team_members?.join(', ') || ''
    });
  };

  const loadProjectData = async (projectId: number) => {
    try {
      const [projectData, tasksData] = await Promise.all([
        getProject(projectId),
        getProjectTasks(projectId)
      ]);
      setProject(projectData);
      syncProjectForm(projectData);
      setTasks(tasksData);
    } catch (error) {
      console.error('Error loading project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: number) => {
    try {
      await completeTask(taskId);
      if (id) {
        loadProjectData(parseInt(id));
      }
    } catch (error) {
      console.error('Error completing task:', error);
      alert('Failed to complete task');
    }
  };

  const handleTaskActualDateSave = async (taskId: number) => {
    try {
      await updateTaskActualDate(taskId, taskActualDateInput || undefined);
      setEditingTaskId(null);
      setTaskActualDateInput('');
      if (id) {
        loadProjectData(parseInt(id));
      }
    } catch (error) {
      console.error('Error updating task actual completion date:', error);
      alert('Failed to update actual completion date');
    }
  };

  const handleStatusChange = async (nextStatus: string) => {
    if (!project || !id) return;

    try {
      setSavingProject(true);
      const updatedProject = await updateProject(project.id, { status: nextStatus });
      setProject(updatedProject);
      syncProjectForm(updatedProject);
    } catch (error) {
      console.error('Error updating project status:', error);
      alert('Failed to update project status');
    } finally {
      setSavingProject(false);
    }
  };

  const handleSaveProject = async (e: any) => {
    e.preventDefault();
    if (!project) return;

    try {
      setSavingProject(true);
      const updatedProject = await updateProject(project.id, {
        name: projectForm.name,
        code: projectForm.code,
        description: projectForm.description || undefined,
        start_date: projectForm.start_date ? new Date(projectForm.start_date).toISOString() : undefined,
        end_date: projectForm.end_date ? new Date(projectForm.end_date).toISOString() : undefined,
        status: projectForm.status,
        client: projectForm.client || undefined,
        team_members: projectForm.team_members
          .split(',')
          .map((member: string) => member.trim())
          .filter(Boolean)
      });
      setProject(updatedProject);
      syncProjectForm(updatedProject);
      setIsEditingProject(false);
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Failed to save project details');
    } finally {
      setSavingProject(false);
    }
  };

  const filteredTasks = tasks.filter((task: TaskInstance) => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  if (loading) {
    return <div className="loading">Loading project...</div>;
  }

  if (!project) {
    return <div className="error">Project not found</div>;
  }

  const pendingTasks = tasks.filter((t: TaskInstance) => t.status === 'pending').length;
  const completedTasks = tasks.filter((t: TaskInstance) => t.status === 'completed').length;
  const overdueTasks = tasks.filter(
    (t: TaskInstance) =>
      t.status === 'pending' &&
      (!t.raw_planned_date || !['na', 'n/a'].includes(t.raw_planned_date.trim().toLowerCase())) &&
      new Date(t.planned_date) < new Date()
  ).length;

  return (
    <div className="project-detail">
      <div className="project-header-detail">
        <div className="project-identity">
          {isEditingProject ? (
            <form className="project-edit-form" onSubmit={handleSaveProject}>
              <div className="project-edit-grid">
                <div className="form-group">
                  <label>Project Name *</label>
                  <input
                    type="text"
                    value={projectForm.name}
                    onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Project Code *</label>
                  <input
                    type="text"
                    value={projectForm.code}
                    onChange={(e) => setProjectForm({ ...projectForm, code: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group project-edit-full">
                  <label>Description</label>
                  <textarea
                    rows={3}
                    value={projectForm.description}
                    onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Client</label>
                  <input
                    type="text"
                    value={projectForm.client}
                    onChange={(e) => setProjectForm({ ...projectForm, client: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={projectForm.start_date}
                    onChange={(e) => setProjectForm({ ...projectForm, start_date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={projectForm.end_date}
                    onChange={(e) => setProjectForm({ ...projectForm, end_date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Team Members</label>
                  <input
                    type="text"
                    placeholder="Comma separated names or roles"
                    value={projectForm.team_members}
                    onChange={(e) => setProjectForm({ ...projectForm, team_members: e.target.value })}
                  />
                </div>
              </div>

              <div className="project-edit-actions">
                <button type="submit" className="btn-primary" disabled={savingProject}>
                  {savingProject ? 'Saving...' : 'Save Details'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={savingProject}
                  onClick={() => {
                    syncProjectForm(project);
                    setIsEditingProject(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <button
                type="button"
                className="project-title-button"
                onClick={() => setIsEditingProject(true)}
              >
                <h2>{project.name}</h2>
              </button>
              <p className="project-code">Code: {project.code}</p>
              {project.description && <p>{project.description}</p>}
              <div className="project-meta-list">
                {project.client && <span><strong>Client:</strong> {project.client}</span>}
                {project.end_date && (
                  <span><strong>End Date:</strong> {new Date(project.end_date).toLocaleDateString()}</span>
                )}
                {project.team_members?.length > 0 && (
                  <span><strong>Team:</strong> {project.team_members.join(', ')}</span>
                )}
              </div>
            </>
          )}
        </div>

        <div className="project-status-panel">
          <span className="project-side-label">Project Status</span>
          <select
            className={`status-select ${project.status}`}
            value={projectForm.status}
            onChange={(e) => {
              setProjectForm({ ...projectForm, status: e.target.value });
              handleStatusChange(e.target.value);
            }}
            disabled={savingProject}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {formatStatusLabel(status)}
              </option>
            ))}
          </select>
          <span className={`status-badge ${project.status}`}>{formatStatusLabel(project.status)}</span>
        </div>
      </div>

      <div className="project-stats">
        <div className="stat-item">
          <span className="stat-label">Total Tasks</span>
          <span className="stat-value">{tasks.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Pending</span>
          <span className="stat-value warning">{pendingTasks}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Completed</span>
          <span className="stat-value success">{completedTasks}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Overdue</span>
          <span className="stat-value danger">{overdueTasks}</span>
        </div>
      </div>

      <div className="tasks-section">
        <div className="tasks-header">
          <h3>📋 Tasks</h3>
          <div className="filter-buttons">
            <button
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={filter === 'pending' ? 'active' : ''}
              onClick={() => setFilter('pending')}
            >
              Pending
            </button>
            <button
              className={filter === 'completed' ? 'active' : ''}
              onClick={() => setFilter('completed')}
            >
              Completed
            </button>
          </div>
        </div>

        <div className="tasks-table">
          {filteredTasks.length === 0 ? (
            <p>No tasks found</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Excel Details</th>
                  <th>Dates</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => {
                  const displayTaskTitle = task.raw_task_name || task.control_title || task.instance_label;
                  const displayTaskDescription = task.raw_task_description || task.control_description;
                  const displayGuidance = task.raw_guidance || task.control_code;
                  const displayFrequency = task.raw_frequency_scheduled || task.scheduled_frequency || task.raw_frequency_event;
                  const displayAssignedTo = task.raw_assigned_to || task.assigned_to?.join(', ');
                  const displayEvidence = task.raw_evidence_location || task.evidence_location;

                  return (
                    <tr key={task.id}>
                      <td>
                        <div className="task-cell-primary">
                          <div className="task-cell-title">{displayTaskTitle}</div>
                          {displayTaskDescription && (
                            <div className="task-cell-description">{displayTaskDescription}</div>
                          )}
                          <div className="task-cell-submeta">
                            {task.source_sheet && <span>Sheet: {task.source_sheet}</span>}
                            {task.source_row_number && <span>Row: {task.source_row_number}</span>}
                            <span>Label: {task.instance_label}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="task-detail-stack">
                          {displayGuidance && (
                            <div><strong>Guidance:</strong> {displayGuidance}</div>
                          )}
                          {displayFrequency && (
                            <div><strong>Frequency:</strong> {displayFrequency}</div>
                          )}
                          {displayAssignedTo && (
                            <div><strong>Assigned To:</strong> {displayAssignedTo}</div>
                          )}
                          {displayEvidence && (
                            <div><strong>Evidence:</strong> {displayEvidence}</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="task-detail-stack">
                          <div>
                            <strong>Planned:</strong>{' '}
                            {task.raw_planned_date || new Date(task.planned_date).toLocaleDateString()}
                          </div>
                          <div>
                            <strong>Actual:</strong>{' '}
                            {editingTaskId === task.id ? (
                              <div className="task-date-edit">
                                <input
                                  type="date"
                                  value={taskActualDateInput}
                                  onChange={(e: any) => setTaskActualDateInput(e.target.value)}
                                />
                                <div className="task-date-edit-actions">
                                  <button
                                    onClick={() => handleTaskActualDateSave(task.id)}
                                    className="btn-success-sm"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingTaskId(null);
                                      setTaskActualDateInput('');
                                    }}
                                    className="btn-secondary"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              task.raw_actual_date || (
                                task.actual_date ? new Date(task.actual_date).toLocaleDateString() : '-'
                              )
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${task.status}`}>
                          {task.status}
                        </span>
                      </td>
                      <td>
                        <div className="task-action-stack">
                          {task.status === 'pending' && (
                            <button
                              onClick={() => handleCompleteTask(task.id)}
                              className="btn-success-sm"
                            >
                              ✓ Complete
                            </button>
                          )}
                          {task.status !== 'not-applicable' && editingTaskId !== task.id && (
                            <button
                              onClick={() => {
                                setEditingTaskId(task.id);
                                setTaskActualDateInput(formatDateInput(task.actual_date));
                              }}
                              className="btn-secondary"
                            >
                              Edit Actual Date
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProjectDetail;

// Made with Bob
