import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Project, TaskInstance } from '../types';

type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
};

type ChatbotWidgetProps = {
  upcomingTasks: TaskInstance[];
  projects: Project[];
};

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

function ChatbotWidget({ upcomingTasks, projects }: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: createId(),
      role: 'assistant',
      content: 'Hi, I\'m your DS&P Activity Assistant demo. Ask about overdue work, this week\'s tasks, Excel import steps, or project status.',
      timestamp: new Date().toISOString()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const pendingTasks = useMemo(
    () => upcomingTasks.filter((task: TaskInstance) => task.status === 'pending'),
    [upcomingTasks]
  );

  const overdueTasks = useMemo(
    () =>
      pendingTasks.filter((task: TaskInstance) => {
        const planned = new Date(task.planned_date);
        const today = new Date();
        return planned.getTime() < today.getTime();
      }),
    [pendingTasks]
  );

  const demoPrompts = [
    'What is due this week?',
    'Show overdue tasks',
    'How do I import Excel?',
    'Summarize active projects'
  ];

  useEffect(() => {
    if (!messagesEndRef.current) return;
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, isOpen]);

  const addAssistantMessage = (content: string) => {
    setMessages((current: ChatMessage[]) => [
      ...current,
      {
        id: createId(),
        role: 'assistant',
        content,
        timestamp: new Date().toISOString()
      }
    ]);
  };

  const buildWeeklySummary = () => {
    const now = new Date();
    const inSevenDays = new Date(now);
    inSevenDays.setDate(inSevenDays.getDate() + 7);

    const dueThisWeek = pendingTasks.filter((task: TaskInstance) => {
      const planned = new Date(task.planned_date);
      return planned >= now && planned <= inSevenDays;
    });

    if (dueThisWeek.length === 0) {
      return 'There are no pending tasks due in the next 7 days in this demo dataset.';
    }

    return `There are ${dueThisWeek.length} pending task(s) due this week. Next items: ${dueThisWeek
      .slice(0, 3)
      .map(
        (task: TaskInstance) =>
          `${task.project_code || 'Project'} - ${task.raw_task_name || task.control_title || task.instance_label}`
      )
      .join('; ')}.`;
  };

  const buildOverdueSummary = () => {
    if (overdueTasks.length === 0) {
      return 'Good news: there are no overdue pending tasks in the currently loaded dashboard view.';
    }

    return `There are ${overdueTasks.length} overdue task(s). Highest priority examples: ${overdueTasks
      .slice(0, 3)
      .map(
        (task: TaskInstance) =>
          `${task.project_code || 'Project'} - ${task.raw_task_name || task.control_title || task.instance_label}`
      )
      .join('; ')}.`;
  };

  const buildImportHelp = () =>
    'To import Excel data, open Projects, create or open a project, upload the workbook, choose the correct sheet tab, and start the import. The tracker then generates planned compliance tasks from the selected worksheet.';

  const buildProjectSummary = () => {
    if (projects.length === 0) {
      return 'There are no projects yet. Create a project first, then import an Excel workbook to generate controls and tasks.';
    }

    return `There are ${projects.length} recent project(s) visible here: ${projects
      .slice(0, 4)
      .map((project: Project) => `${project.code} (${project.status})`)
      .join(', ')}.`;
  };

  const buildFallback = () =>
    'I’m a demo assistant right now. I can answer basic questions about dashboard tasks, Excel import, and recent projects. Backend AI integration can be added next.';

  const getDemoResponse = (question: string) => {
    const normalized = question.trim().toLowerCase();

    if (normalized.includes('due this week') || normalized.includes('this week')) {
      return buildWeeklySummary();
    }

    if (normalized.includes('overdue')) {
      return buildOverdueSummary();
    }

    if (normalized.includes('import') || normalized.includes('excel') || normalized.includes('workbook')) {
      return buildImportHelp();
    }

    if (normalized.includes('project') || normalized.includes('active')) {
      return buildProjectSummary();
    }

    return buildFallback();
  };

  const submitMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setMessages((current: ChatMessage[]) => [
      ...current,
      {
        id: createId(),
        role: 'user',
        content: trimmed,
        timestamp: new Date().toISOString()
      }
    ]);
    setInput('');
    setIsTyping(true);

    window.setTimeout(() => {
      addAssistantMessage(getDemoResponse(trimmed));
      setIsTyping(false);
    }, 600);
  };

  return (
    <div
      className={`chatbot-shell ${isOpen ? 'open' : ''} ${isMinimized ? 'minimized' : ''} ${isMaximized ? 'maximized' : ''}`}
      data-chatbot-state={isOpen ? (isMinimized ? 'minimized' : isMaximized ? 'maximized' : 'open') : 'closed'}
    >
      <button
        type="button"
        className="chatbot-launcher"
        onClick={() => setIsOpen((current: boolean) => !current)}
        aria-expanded={isOpen}
        aria-label="Toggle compliance assistant"
      >
        <span className="chatbot-launcher-icon">🤖</span>
        <span className="chatbot-launcher-text">{isOpen ? 'Close Assistant' : 'Ask Assistant'}</span>
      </button>

      {isOpen && (
        <div className="chatbot-panel" role="dialog" aria-label="Compliance assistant demo">
          <div className="chatbot-header">
            <div>
              <strong>DS&P Activity Assistant</strong>
              <div className="chatbot-subtitle">Demo responses for workflow validation</div>
            </div>
            <div className="chatbot-header-actions">
              <button
                type="button"
                className="chatbot-minimize"
                onClick={() => {
                  setIsMinimized((current: boolean) => !current);
                  if (!isMinimized) setIsMaximized(false);
                }}
                aria-label={isMinimized ? 'Restore assistant' : 'Minimize assistant'}
                title={isMinimized ? 'Restore' : 'Minimize'}
              >
                −
              </button>
              <button
                type="button"
                className="chatbot-maximize"
                onClick={() => {
                  setIsMaximized((current: boolean) => !current);
                  if (!isMaximized) setIsMinimized(false);
                }}
                aria-label={isMaximized ? 'Restore assistant' : 'Maximize assistant'}
                title={isMaximized ? 'Restore' : 'Maximize'}
              >
                {isMaximized ? '❐' : '□'}
              </button>
              <button
                type="button"
                className="chatbot-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close assistant"
                title="Close"
              >
                ×
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              <div className="chatbot-prompts">
            {demoPrompts.map((prompt: string) => (
              <button
                key={prompt}
                type="button"
                className="chatbot-prompt"
                onClick={() => submitMessage(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="chatbot-messages">
            {messages.map((message: ChatMessage) => (
              <div key={message.id} className={`chatbot-message ${message.role}`}>
                <div className="chatbot-message-role">
                  {message.role === 'assistant' ? 'Assistant' : 'You'}
                </div>
                <div className="chatbot-message-content">{message.content}</div>
              </div>
            ))}

            {isTyping && (
              <div className="chatbot-message assistant">
                <div className="chatbot-message-role">Assistant</div>
                <div className="chatbot-message-content chatbot-typing">Typing...</div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form
            className="chatbot-input-row"
            onSubmit={(e) => {
              e.preventDefault();
              submitMessage(input);
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about tasks, projects, or Excel import"
            />
            <button type="submit" className="btn-primary">
              Send
            </button>
          </form>

          <div className="chatbot-footer">
            Demo-only assistant. For full automation, connect this widget to a backend AI service and task APIs.
            <Link to="/projects" className="chatbot-footer-link">
              Open projects
            </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default ChatbotWidget;

// Made with Bob