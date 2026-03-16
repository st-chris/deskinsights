import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import App from './App';
import authReducer from './reducers/auth/auth';
import workspaceReducer from './reducers/workspace/workspace';
import documentReducer from './reducers/document/document';

// Mock lazy imports
vi.mock('./pages/Login/Login', () => ({ default: () => <div>Login</div> }));
vi.mock('./pages/Register/Register', () => ({
  default: () => <div>Register</div>,
}));
vi.mock('./pages/DashboardHome/DashboardHome', () => ({
  default: () => <div>Dashboard</div>,
}));
vi.mock('./pages/DocumentEditor/DocumentEditor', () => ({
  default: () => <div>Editor</div>,
}));
vi.mock('./pages/WorkspaceList/WorkspaceList', () => ({
  default: () => <div>Workspaces</div>,
}));
vi.mock('./pages/WorkspaceDocumentList/WorkspaceDocumentList', () => ({
  default: () => <div>Documents</div>,
}));
vi.mock('./pages/Settings/Settings', () => ({
  default: () => <div>Settings</div>,
}));

const createTestStore = (preloadedState = {}) =>
  configureStore({
    reducer: {
      auth: authReducer,
      workspaces: workspaceReducer,
      documents: documentReducer,
    },
    preloadedState,
    // Disable dev middleware checks for testing
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }),
  });

const renderApp = (path = '/', initialState = {}) => {
  const store = createTestStore(initialState);
  return {
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>
      </Provider>,
    ),
    store,
  };
};

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Mock refreshLogin and logout actions
    vi.doMock('./reducers/auth/auth', () => ({
      refreshLogin: vi.fn().mockResolvedValue(null),
      logout: vi.fn().mockResolvedValue({}),
    }));
  });

  it('renders Suspense fallback', async () => {
    renderApp();
    // Your spinner is div with animate-spin class, not role=progressbar
    expect(screen.getByText(/checking authentication/i)).toBeInTheDocument();
    // Or: expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('sets dark theme from localStorage', async () => {
    localStorage.setItem('theme', 'dark');
    renderApp();

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    });
  });

  it('redirects / to default route (dashboard)', () => {
    renderApp('/', { auth: { isAuthenticated: true } });
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('redirects / to workspaces if saved', () => {
    localStorage.setItem('defaultView', 'workspaces');
    renderApp('/', { auth: { isAuthenticated: true } });
    expect(screen.getByText('Workspaces')).toBeInTheDocument();
  });

  it('protects routes when unauthenticated', async () => {
    renderApp('/dashboard');

    // Wait for auth check → redirect to login link
    await waitFor(() => {
      expect(screen.getByText('Log in')).toBeInTheDocument(); // Nav link
    });
  });

  it('renders protected Dashboard for auth user', async () => {
    renderApp('/dashboard', {
      auth: {
        isAuthenticated: true,
        user: { id: '1', name: 'Test' },
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('renders Login page', () => {
    renderApp('/login');
    expect(screen.getByText('Login')).toBeInTheDocument();
  });
});
