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
