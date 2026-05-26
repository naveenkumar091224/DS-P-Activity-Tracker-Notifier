# React Web UI Implementation Plan for Todo App

## Overview
Add a React-based web UI to the existing Hono todo API, running everything in a single Docker container. The UI will provide a simple interface to create, view, and complete tasks using the existing API endpoints.

## Architecture

```
┌─────────────────────────────────────────┐
│         Docker Container                │
│                                         │
│  ┌──────────────┐    ┌──────────────┐  │
│  │   React UI   │───▶│  Hono API    │  │
│  │  (Port 3000) │◀───│  (Port 3001) │  │
│  └──────────────┘    └──────────────┘  │
│         │                    │          │
│         └────────────────────┘          │
│       Served via Hono static            │
└─────────────────────────────────────────┘
```

## Implementation Steps

### 1. Project Structure Setup

Create the following directory structure:

```
express-todo-api-modern/
├── src/
│   ├── index.ts              (existing - modify)
│   ├── db.ts                 (existing)
│   ├── routes/
│   │   └── todos.ts          (existing)
│   └── models/
│       └── todo.ts           (existing)
├── client/                   (NEW)
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── components/
│   │   │   ├── TodoList.tsx
│   │   │   ├── TodoItem.tsx
│   │   │   └── AddTodoForm.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   └── types/
│   │       └── todo.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── index.html
├── Dockerfile                (NEW)
├── .dockerignore             (NEW)
├── package.json              (modify)
└── tsconfig.json             (existing)
```

### 2. Frontend Technology Stack

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite (fast, modern, minimal config)
- **Styling**: CSS Modules or Tailwind CSS (keep it simple)
- **HTTP Client**: Native `fetch` API (no additional dependencies needed)
- **State Management**: React hooks (useState, useEffect) - no Redux needed for this simple app

### 3. Backend Modifications

#### 3.1 Update [`src/index.ts`](bob-get-started/express-todo-api-modern/src/index.ts)

```typescript
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import todos from './routes/todos.js';

const app = new Hono();
const PORT = Number(process.env.PORT) || 3000;

// Serve static files from client/dist
app.use('/*', serveStatic({ root: './client/dist' }));

// API routes
app.get('/api', (c) =>
  c.json({
    message: 'Todo API',
    version: '2.0.0',
    endpoints: { todos: '/api/todos' },
  })
);

app.route('/api/todos', todos);

// Fallback to index.html for client-side routing
app.get('*', serveStatic({ path: './client/dist/index.html' }));

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`UI: http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api/todos`);
});
```

#### 3.2 Add CORS Support (if needed for development)

Add to dependencies: `@hono/cors`

```typescript
import { cors } from '@hono/cors';
app.use('/api/*', cors());
```

### 4. Frontend Implementation

#### 4.1 API Service Layer [`client/src/services/api.ts`](bob-get-started/express-todo-api-modern/client/src/services/api.ts)

```typescript
export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

const API_BASE = '/api/todos';

export const todoApi = {
  async getAll(): Promise<Todo[]> {
    const response = await fetch(API_BASE);
    if (!response.ok) throw new Error('Failed to fetch todos');
    return response.json();
  },

  async create(title: string): Promise<Todo> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    if (!response.ok) throw new Error('Failed to create todo');
    return response.json();
  },

  async update(id: string, updates: Partial<Todo>): Promise<Todo> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update todo');
    return response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete todo');
  },
};
```

#### 4.2 Main App Component [`client/src/App.tsx`](bob-get-started/express-todo-api-modern/client/src/App.tsx)

```typescript
import { useState, useEffect } from 'react';
import { todoApi, Todo } from './services/api';
import TodoList from './components/TodoList';
import AddTodoForm from './components/AddTodoForm';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      setLoading(true);
      const data = await todoApi.getAll();
      setTodos(data);
      setError(null);
    } catch (err) {
      setError('Failed to load todos');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodo = async (title: string) => {
    try {
      const newTodo = await todoApi.create(title);
      setTodos([...todos, newTodo]);
    } catch (err) {
      setError('Failed to add todo');
    }
  };

  const handleToggleTodo = async (id: string, completed: boolean) => {
    try {
      await todoApi.update(id, { completed });
      setTodos(todos.map(t => t.id === id ? { ...t, completed } : t));
    } catch (err) {
      setError('Failed to update todo');
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      await todoApi.delete(id);
      setTodos(todos.filter(t => t.id !== id));
    } catch (err) {
      setError('Failed to delete todo');
    }
  };

  return (
    <div className="app">
      <header>
        <h1>📝 Todo App</h1>
      </header>
      <main>
        <AddTodoForm onAdd={handleAddTodo} />
        {error && <div className="error">{error}</div>}
        {loading ? (
          <div>Loading...</div>
        ) : (
          <TodoList
            todos={todos}
            onToggle={handleToggleTodo}
            onDelete={handleDeleteTodo}
          />
        )}
      </main>
    </div>
  );
}

export default App;
```

#### 4.3 Component Structure

**AddTodoForm Component**: Simple form with input field and submit button
**TodoList Component**: Maps over todos array and renders TodoItem components
**TodoItem Component**: Displays individual todo with checkbox and delete button

### 5. Docker Configuration

#### 5.1 Multi-stage Dockerfile

```dockerfile
# Stage 1: Build React frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Build backend
FROM node:22-alpine AS backend-builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci
COPY src/ ./src/
RUN npm run build

# Stage 3: Production
FROM node:22-alpine
WORKDIR /app

# Copy backend dependencies and built files
COPY package*.json ./
RUN npm ci --production
COPY --from=backend-builder /app/dist ./dist

# Copy frontend built files
COPY --from=frontend-builder /app/client/dist ./client/dist

EXPOSE 3000

CMD ["npm", "start"]
```

#### 5.2 .dockerignore

```
node_modules
client/node_modules
client/dist
dist
*.log
.git
.gitignore
README.md
ui-plan.md
```

### 6. Package.json Updates

#### 6.1 Root package.json

Add scripts:
```json
{
  "scripts": {
    "build": "npm run build:client && npm run build:server",
    "build:client": "cd client && npm run build",
    "build:server": "tsc",
    "start": "node dist/index.js",
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "node --watch --experimental-strip-types src/index.ts",
    "dev:client": "cd client && npm run dev",
    "docker:build": "docker build -t express-todo-app .",
    "docker:run": "docker run -p 3000:3000 express-todo-app"
  }
}
```

Add dependencies:
```json
{
  "dependencies": {
    "@hono/node-server": "^1.13.7",
    "hono": "^4.6.14"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.7.3",
    "concurrently": "^8.2.2"
  }
}
```

#### 6.2 Client package.json

```json
{
  "name": "todo-client",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.7.3",
    "vite": "^5.4.2"
  }
}
```

### 7. UI Features & Design

#### 7.1 Core Features
- ✅ Display list of todos with completion status
- ✅ Add new todo via input form
- ✅ Toggle todo completion with checkbox
- ✅ Delete todo with button
- ✅ Show loading state while fetching
- ✅ Display error messages
- ✅ Responsive design (mobile-friendly)

#### 7.2 Simple Styling Approach

Use CSS with these principles:
- Clean, minimal design
- Good contrast and readability
- Responsive layout (flexbox/grid)
- Visual feedback for interactions
- Accessible (proper labels, focus states)

Example color scheme:
- Primary: #4A90E2 (blue)
- Success: #7ED321 (green)
- Danger: #D0021B (red)
- Background: #F5F5F5 (light gray)
- Text: #333333 (dark gray)

### 8. Development Workflow

#### 8.1 Local Development
```bash
# Terminal 1: Start backend
npm run dev:server

# Terminal 2: Start frontend (with proxy to backend)
npm run dev:client
```

#### 8.2 Production Build
```bash
# Build everything
npm run build

# Run production server
npm start
```

#### 8.3 Docker Deployment
```bash
# Build Docker image
docker build -t express-todo-app .

# Run container
docker run -p 3000:3000 express-todo-app

# Access at http://localhost:3000
```

### 9. Testing Strategy

#### 9.1 Manual Testing Checklist
- [ ] Can add new todo
- [ ] Can view all todos
- [ ] Can mark todo as completed
- [ ] Can unmark completed todo
- [ ] Can delete todo
- [ ] UI updates immediately after actions
- [ ] Error messages display correctly
- [ ] Works on mobile devices
- [ ] Works in different browsers

#### 9.2 API Integration Testing
- [ ] POST /api/todos creates todo
- [ ] GET /api/todos returns all todos
- [ ] PUT /api/todos/:id updates todo
- [ ] DELETE /api/todos/:id removes todo
- [ ] Error handling works correctly

### 10. Future Enhancements (Optional)

- Add todo editing capability
- Add due dates
- Add priority levels
- Add categories/tags
- Add search/filter functionality
- Add sorting options
- Add local storage backup
- Add animations/transitions
- Add dark mode
- Add keyboard shortcuts

## Implementation Timeline

### Phase 1: Setup (1-2 hours)
- Create client directory structure
- Set up Vite + React + TypeScript
- Configure build tools

### Phase 2: Backend Integration (1 hour)
- Update Hono server to serve static files
- Test API endpoints
- Add CORS if needed

### Phase 3: Frontend Development (2-3 hours)
- Create API service layer
- Build React components
- Implement state management
- Add basic styling

### Phase 4: Docker Configuration (1 hour)
- Create Dockerfile
- Test multi-stage build
- Verify container runs correctly

### Phase 5: Testing & Polish (1-2 hours)
- Manual testing
- Fix bugs
- Improve styling
- Add error handling

**Total Estimated Time: 6-9 hours**

## Success Criteria

✅ Single Docker container runs both frontend and backend
✅ UI can create, view, complete, and delete todos
✅ All operations use existing API endpoints
✅ Simple, clean, responsive design
✅ No errors in browser console
✅ Works on Chrome, Firefox, Safari
✅ Mobile-friendly interface

## Notes

- Keep dependencies minimal
- Focus on functionality over fancy features
- Ensure good error handling
- Make it easy to extend later
- Document any setup steps needed