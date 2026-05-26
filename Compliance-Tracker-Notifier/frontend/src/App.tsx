import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import CuratorChatButton from './components/CuratorChatButton';
import ProjectList from './components/ProjectList';
import ProjectDetail from './components/ProjectDetail';
import TasksView from './components/TasksView';
import RegisterPage from './components/RegisterPage';
import { login } from './api';
import { UserProfile } from './types';
import './App.css';

function App() {
  // Removed unused dashboardChatContext state

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('compliance-tracker-auth') === 'true';
  });
  
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const stored = localStorage.getItem('current_user');
    return stored ? JSON.parse(stored) : null;
  });

  const [showRegister, setShowRegister] = useState(false);
  const [credentials, setCredentials] = useState({
    username_or_email: '',
    password: ''
  });
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Persist authentication state
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      localStorage.setItem('compliance-tracker-auth', 'true');
      localStorage.setItem('current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('compliance-tracker-auth');
      localStorage.removeItem('current_user');
      localStorage.removeItem('auth_token');
    }
  }, [isAuthenticated, currentUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginSuccess('');
    setLoading(true);

    try {
      const response = await login(credentials);
      
      if (response.success && response.user && response.token) {
        setCurrentUser(response.user);
        setIsAuthenticated(true);
        localStorage.setItem('auth_token', response.token);
        sessionStorage.removeItem('notified-tasks');
      } else {
        setLoginError(response.message || 'Login failed');
      }
    } catch (err: any) {
      setLoginError(err.response?.data?.detail || 'Invalid username/email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCredentials({ username_or_email: '', password: '' });
    sessionStorage.removeItem('notified-tasks');
  };

  const handleRegisterSuccess = () => {
    setShowRegister(false);
    setCredentials({ username_or_email: '', password: '' });
    setLoginError('');
    setLoginSuccess('Registration successful. Please log in with your new credentials.');
    setShowPassword(false);
  };

  if (!isAuthenticated) {
    if (showRegister) {
      return (
        <RegisterPage
          onSuccess={handleRegisterSuccess}
          onBackToLogin={() => setShowRegister(false)}
        />
      );
    }

    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-brand">
            <span className="auth-icon">📊</span>
            <div>
              <h1>DS&P Activity Tracker</h1>
              <p>Log in to view projects, tasks, and compliance evidence schedules.</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label htmlFor="username_or_email">Username or Email</label>
              <input
                id="username_or_email"
                type="text"
                value={credentials.username_or_email}
                onChange={(e) => setCredentials({ ...credentials, username_or_email: e.target.value })}
                required
                placeholder="Enter username or email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  required
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {loginSuccess && <div className="auth-success">{loginSuccess}</div>}
            {loginError && <div className="auth-error">{loginError}</div>}

            <button type="submit" className="btn-primary auth-submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <button onClick={() => { setShowRegister(true); setLoginError(''); setLoginSuccess(''); }} className="link-button">
                Register here
              </button>
            </p>
          </div>

          <div className="demo-credentials">
            <strong>Demo Accounts</strong>
            <div className="demo-account">
              <span>Manager: aarav / Password123</span>
            </div>
            <div className="demo-account">
              <span>Analyst: priya / Password123</span>
            </div>
            <div className="demo-account">
              <span>Admin: admin / Admin123</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-container">
            <div className="nav-left">
              <Link to="/" className="brand-link">
                <h1 className="nav-title">📊 DS&P Activity Tracker</h1>
              </Link>
              <div className="nav-links">
                <Link to="/" className="nav-link">Dashboard</Link>
                <Link to="/projects" className="nav-link">Projects</Link>
              </div>
            </div>

            <div className="nav-right">
              <div className="profile-chip">
                <div className="profile-avatar">
                  {currentUser?.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="profile-meta">
                  <strong>{currentUser?.full_name}</strong>
                  <span className="user-role">{currentUser?.role}</span>
                </div>
              </div>
              <button onClick={handleLogout} className="btn-secondary nav-action-btn">
                Logout
              </button>
            </div>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={<Dashboard />}
            />
            <Route path="/tasks" element={<TasksView />} />
            <Route path="/projects" element={<ProjectList />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <CuratorChatButton />
      </div>
    </Router>
  );
}

export default App;

// Made with Bob
