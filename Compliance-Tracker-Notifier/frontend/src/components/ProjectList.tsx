import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjects, createProject, deleteProject, importExcel, listExcelSheets } from '../api';
import { Project, ExcelWorkbookSelection } from '../types';

function formatStatusLabel(status: string) {
  return status
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function ProjectList() {
  const initialFormData = {
    name: '',
    code: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    status: 'active',
    team_members: [] as string[],
    client: ''
  };

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [teamMembersInput, setTeamMembersInput] = useState('');
  const navigate = useNavigate();
  const [projectImports, setProjectImports] = useState<Record<number, ExcelWorkbookSelection>>({});
  const [createImport, setCreateImport] = useState<ExcelWorkbookSelection>({
    file: null,
    sheets: [],
    selectedSheet: '',
    fileToken: '',
    loading: false
  });
  const [uploadingProjectId, setUploadingProjectId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const parsedTeamMembers = teamMembersInput
      .split(',')
      .map((member: string) => member.trim())
      .filter(Boolean);

    setSubmitting(true);
    try {
      const createdProject = await createProject({
        ...formData,
        team_members: parsedTeamMembers,
        start_date: new Date(formData.start_date).toISOString()
      });

      if (createImport.file) {
        const imported = await handleImportForProject(createdProject.id, createImport);
        if (!imported) {
          return;
        }
      }

      setShowForm(false);
      setFormData(initialFormData);
      setTeamMembersInput('');
      setCreateImport(resetWorkbookSelection());
      await loadProjects();
      navigate(`/projects/${createdProject.id}`);
    } catch (error: any) {
      console.error('Error creating project:', error);
      alert(error?.response?.data?.detail || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (e: any, id: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await deleteProject(id);
      loadProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project');
    }
  };

  const resetWorkbookSelection = (): ExcelWorkbookSelection => ({
    file: null,
    sheets: [],
    selectedSheet: '',
    fileToken: '',
    loading: false
  });

  const handleProjectFileSelection = async (projectId: number, file: File | null) => {
    setProjectImports((current: Record<number, ExcelWorkbookSelection>) => ({
      ...current,
      [projectId]: {
        file,
        sheets: [],
        selectedSheet: '',
        fileToken: '',
        loading: Boolean(file)
      }
    }));

    if (!file) {
      return;
    }

    try {
      const workbookInfo = await listExcelSheets(file);
      setProjectImports((current: Record<number, ExcelWorkbookSelection>) => ({
        ...current,
        [projectId]: {
          file,
          sheets: workbookInfo.sheets,
          selectedSheet: workbookInfo.sheets[0]?.name || '',
          fileToken: workbookInfo.file_token,
          loading: false
        }
      }));
    } catch (error: any) {
      console.error('Error reading workbook sheets:', error);
      setProjectImports((current: Record<number, ExcelWorkbookSelection>) => ({
        ...current,
        [projectId]: resetWorkbookSelection()
      }));
      alert(error?.response?.data?.detail || 'Failed to inspect Excel workbook');
    }
  };

  const handleCreateFileSelection = async (file: File | null) => {
    setCreateImport({
      file,
      sheets: [],
      selectedSheet: '',
      fileToken: '',
      loading: Boolean(file)
    });

    if (!file) {
      return;
    }

    try {
      const workbookInfo = await listExcelSheets(file);
      setCreateImport({
        file,
        sheets: workbookInfo.sheets,
        selectedSheet: workbookInfo.sheets[0]?.name || '',
        fileToken: workbookInfo.file_token,
        loading: false
      });
    } catch (error: any) {
      console.error('Error reading workbook sheets for new project:', error);
      setCreateImport(resetWorkbookSelection());
      alert(error?.response?.data?.detail || 'Failed to inspect Excel workbook');
    }
  };

  const handleImportForProject = async (projectId: number, workbookSelection: ExcelWorkbookSelection) => {
    if (!workbookSelection.file) {
      alert('Please select a file first');
      return false;
    }

    if (!workbookSelection.selectedSheet) {
      alert('Please select the tab from which tasks need to be imported');
      return false;
    }

    if (!workbookSelection.fileToken) {
      alert('Workbook session missing. Please choose the file again.');
      return false;
    }

    setUploadingProjectId(projectId);
    try {
      const result = await importExcel(
        projectId,
        workbookSelection.fileToken,
        workbookSelection.file.name,
        workbookSelection.selectedSheet
      );
      const errorMessage = result.errors && result.errors.length > 0
        ? `\nWarnings:\n- ${result.errors.join('\n- ')}`
        : '';
      alert(
        `Import successful!\n${result.message}\nControls: ${result.controls_created}\nTasks: ${result.tasks_created}${errorMessage}`
      );
      return true;
    } catch (error: any) {
      console.error('Error uploading file:', error);
      alert(error?.response?.data?.detail || 'Failed to upload Excel file');
      return false;
    } finally {
      setUploadingProjectId(null);
    }
  };

  const handleFileUpload = async (e: any, projectId: number) => {
    e.preventDefault();
    e.stopPropagation();

    const imported = await handleImportForProject(projectId, projectImports[projectId] || resetWorkbookSelection());
    if (imported) {
      setProjectImports((current: Record<number, ExcelWorkbookSelection>) => ({
        ...current,
        [projectId]: resetWorkbookSelection()
      }));
      await loadProjects();
    }
  };

  if (loading) {
    return <div className="loading">Loading projects...</div>;
  }

  return (
    <div className="project-list">
      <div className="page-header">
        <h2>📁 Projects</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : '+ New Project'}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h3>Create New Project</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Project Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Project Code *</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e: any) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e: any) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>Start Date *</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e: any) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="on-hold">On Hold</option>
                <option value="closed">Closed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="form-group">
              <label>Client</label>
              <input
                type="text"
                value={formData.client}
                onChange={(e: any) => setFormData({ ...formData, client: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Team Members</label>
              <input
                type="text"
                placeholder="Comma separated, e.g. DPE, PM, SE"
                value={teamMembersInput}
                onChange={(e: any) => setTeamMembersInput(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Upload Excel Workbook (Optional)</label>
              <input
                type="file"
                accept=".xlsx,.xlsm"
                onChange={(e: any) => handleCreateFileSelection(e.target.files?.[0] || null)}
                disabled={submitting || createImport.loading}
              />
            </div>

            {createImport.file && (
              <div className="form-group">
                <label>Select Workbook Tab</label>
                <select
                  value={createImport.selectedSheet}
                  onChange={(e: any) => setCreateImport((current: ExcelWorkbookSelection) => ({
                    ...current,
                    selectedSheet: e.target.value
                  }))}
                  disabled={submitting || createImport.loading}
                >
                  {createImport.loading ? (
                    <option value="">Reading workbook tabs...</option>
                  ) : createImport.sheets.length ? (
                    createImport.sheets.map((sheet) => (
                      <option key={sheet.name} value={sheet.name}>
                        {sheet.name}
                      </option>
                    ))
                  ) : (
                    <option value="">No tabs found</option>
                  )}
                </select>
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : createImport.file ? 'Create Project & Import Tab' : 'Create Project'}
            </button>
          </form>
        </div>
      )}

      <div className="projects-list">
        {projects.length === 0 ? (
          <p>No projects yet. Create your first project to get started!</p>
        ) : (
          projects.map((project: Project) => (
            <div key={project.id} className="project-row-card">
              <div
                className="project-row-main project-row-link"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/projects/${project.id}`)}
                onKeyDown={(e: any) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/projects/${project.id}`);
                  }
                }}
              >
                <div className="project-row-title">
                  <h3>{project.name}</h3>
                  <span className="project-row-code">{project.code}</span>
                </div>

                <div className="project-row-meta">
                  {project.description && <p>{project.description}</p>}
                  <div className="project-row-details">
                    {project.client && <span><strong>Client:</strong> {project.client}</span>}
                    <span><strong>Started:</strong> {new Date(project.start_date).toLocaleDateString()}</span>
                    {project.team_members?.length > 0 && (
                      <span><strong>Team:</strong> {project.team_members.join(', ')}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="project-row-side">
                <span className={`status-badge ${project.status}`}>
                  {formatStatusLabel(project.status)}
                </span>

                <div
                  className="project-actions"
                  onClick={(e: any) => e.stopPropagation()}
                  onMouseDown={(e: any) => e.stopPropagation()}
                  onPointerDown={(e: any) => e.stopPropagation()}
                >
                  <div className="upload-section upload-stack">
                    <input
                      type="file"
                      accept=".xlsx,.xlsm"
                      onChange={(e: any) => handleProjectFileSelection(project.id, e.target.files?.[0] || null)}
                      onClick={(e: any) => e.stopPropagation()}
                      disabled={uploadingProjectId === project.id || projectImports[project.id]?.loading}
                    />

                    {projectImports[project.id]?.file && (
                      <div
                        className="sheet-picker"
                        onClick={(e: any) => e.stopPropagation()}
                        onMouseDown={(e: any) => e.stopPropagation()}
                        onPointerDown={(e: any) => e.stopPropagation()}
                      >
                        <label>Select the tab from which tasks need to be imported</label>
                        <select
                          value={projectImports[project.id]?.selectedSheet || ''}
                          onChange={(e: any) =>
                            setProjectImports((current: Record<number, ExcelWorkbookSelection>) => ({
                              ...current,
                              [project.id]: {
                                ...(current[project.id] || resetWorkbookSelection()),
                                selectedSheet: e.target.value
                              }
                            }))
                          }
                          onClick={(e: any) => e.stopPropagation()}
                          onMouseDown={(e: any) => e.stopPropagation()}
                          onPointerDown={(e: any) => e.stopPropagation()}
                          disabled={projectImports[project.id]?.loading}
                        >
                          {projectImports[project.id]?.loading ? (
                            <option value="">Reading workbook tabs...</option>
                          ) : projectImports[project.id]?.sheets?.length ? (
                            projectImports[project.id].sheets.map((sheet) => (
                              <option key={sheet.name} value={sheet.name}>
                                {sheet.name}
                              </option>
                            ))
                          ) : (
                            <option value="">No tabs found</option>
                          )}
                        </select>
                      </div>
                    )}

                    <button
                      onClick={(e: any) => handleFileUpload(e, project.id)}
                      onMouseDown={(e: any) => e.stopPropagation()}
                      onPointerDown={(e: any) => e.stopPropagation()}
                      disabled={
                        !projectImports[project.id]?.file ||
                        !projectImports[project.id]?.selectedSheet ||
                        uploadingProjectId === project.id ||
                        projectImports[project.id]?.loading
                      }
                      className="btn-secondary"
                    >
                      {uploadingProjectId === project.id ? 'Importing...' : '📤 Import Selected Tab'}
                    </button>
                  </div>

                  <button
                    onClick={(e: any) => handleDelete(e, project.id)}
                    className="btn-danger"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ProjectList;

// Made with Bob
