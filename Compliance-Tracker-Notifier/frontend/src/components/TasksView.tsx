import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getAllTasks } from '../api';
import { TaskInstance } from '../types';

type FilterType = 'all' | 'due-today' | 'this-week' | 'overdue' | 'completed';

function TasksView() {
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState<TaskInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  useEffect(() => {
    const filter = searchParams.get('filter') as FilterType;
    if (filter) {
      setActiveFilter(filter);
    }
  }, [searchParams]);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const tasksData = await getAllTasks();
      setTasks(tasksData);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const filterTasks = (tasks: TaskInstance[], filter: FilterType): TaskInstance[] => {
    const today = new Date();
    const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const inSevenDays = new Date(todayDay);
    inSevenDays.setDate(inSevenDays.getDate() + 7);

    switch (filter) {
      case 'due-today':
        return tasks.filter((task) => {
          if (task.status !== 'pending') return false;
          const dueDate = new Date(task.planned_date);
          const dueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
          return dueDay.getTime() === todayDay.getTime();
        });
      
      case 'this-week':
        return tasks.filter((task) => {
          if (task.status !== 'pending') return false;
          const dueDate = new Date(task.planned_date);
          return dueDate >= todayDay && dueDate <= inSevenDays;
        });
      
      case 'overdue':
        return tasks.filter((task) => {
          if (task.status !== 'pending') return false;
          const dueDate = new Date(task.planned_date);
          const dueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
          return dueDay.getTime() < todayDay.getTime();
        });
      
      case 'completed':
        return tasks.filter((task) => task.status === 'completed');
      
      case 'all':
      default:
        return tasks;
    }
  };

  const filteredTasks = filterTasks(tasks, activeFilter);

  const getFilterTitle = (filter: FilterType): string => {
    switch (filter) {
      case 'due-today': return 'Due Today';
      case 'this-week': return 'Due This Week';
      case 'overdue': return 'Overdue Tasks';
      case 'completed': return 'Completed Tasks';
      default: return 'All Tasks';
    }
  };

  if (loading) {
    return <div className="loading">Loading tasks...</div>;
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h2>📋 {getFilterTitle(activeFilter)}</h2>
          <p>View and manage compliance tasks across all projects</p>
        </div>
        <Link to="/">
          <button type="button" className="btn-secondary">
            Back to Dashboard
          </button>
        </Link>
      </div>

      <div className="filter-buttons">
        <button
          type="button"
          className={activeFilter === 'all' ? 'active' : ''}
          onClick={() => setActiveFilter('all')}
        >
          All Tasks ({tasks.length})
        </button>
        <button
          type="button"
          className={activeFilter === 'due-today' ? 'active' : ''}
          onClick={() => setActiveFilter('due-today')}
        >
          Due Today ({filterTasks(tasks, 'due-today').length})
        </button>
        <button
          type="button"
          className={activeFilter === 'this-week' ? 'active' : ''}
          onClick={() => setActiveFilter('this-week')}
        >
          This Week ({filterTasks(tasks, 'this-week').length})
        </button>
        <button
          type="button"
          className={activeFilter === 'overdue' ? 'active' : ''}
          onClick={() => setActiveFilter('overdue')}
        >
          Overdue ({filterTasks(tasks, 'overdue').length})
        </button>
        <button
          type="button"
          className={activeFilter === 'completed' ? 'active' : ''}
          onClick={() => setActiveFilter('completed')}
        >
          Completed ({filterTasks(tasks, 'completed').length})
        </button>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="empty-state">
          <p>No tasks found for this filter.</p>
          <span>Try selecting a different filter or create a project to generate tasks.</span>
        </div>
      ) : (
        <div className="task-list">
          {filteredTasks.map((task: TaskInstance) => (
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
  );
}

export default TasksView;

// Made with Bob