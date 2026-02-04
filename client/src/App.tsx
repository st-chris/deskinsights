import { Route, Routes, Navigate } from 'react-router-dom';
import { useEffect, useRef, lazy, Suspense } from 'react';
import { useDispatch } from 'react-redux';
import { logout, refreshLogin } from './reducers/auth/auth';
import type { AppDispatch } from './types/redux';
import ProtectedRoute from './components/protected/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';
import AuthRedirectRoute from './components/protected/AuthRedirectRoute';

// Lazy load all page components
const Login = lazy(() => import('./pages/Login/Login'));
const Register = lazy(() => import('./pages/Register/Register'));
const DashboardHome = lazy(() => import('./pages/DashboardHome/DashboardHome'));
const DocumentEditor = lazy(
  () => import('./pages/DocumentEditor/DocumentEditor'),
);
const Workspaces = lazy(() => import('./pages/WorkspaceList/WorkspaceList'));
const WorkspaceDocuments = lazy(
  () => import('./pages/WorkspaceDocumentList/WorkspaceDocumentList'),
);
const Settings = lazy(() => import('./pages/Settings/Settings'));

// Simple loading component
const LoadingFallback = () => (
  <div className='flex items-center justify-center min-h-screen bg-white dark:bg-gray-900'>
    <div className='w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin'></div>
  </div>
);

export default function App() {
  const dispatch = useDispatch<AppDispatch>();
  const hasRefreshed = useRef(false);

  useEffect(() => {
    if (!hasRefreshed.current) {
      dispatch(refreshLogin())
        .unwrap()
        .catch(() => dispatch(logout()));

      hasRefreshed.current = true;
    }
  }, [dispatch]);

  // Initialize theme on app load
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  // Get the default landing page preference
  const getDefaultRoute = () => {
    const savedView = localStorage.getItem('defaultView');
    return savedView === 'workspaces' ? '/workspaces' : '/dashboard';
  };

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public auth pages */}
        <Route element={<AuthLayout />}>
          <Route
            path='/login'
            element={
              <AuthRedirectRoute>
                <Login />
              </AuthRedirectRoute>
            }
          />
          <Route
            path='/register'
            element={
              <AuthRedirectRoute>
                <Register />
              </AuthRedirectRoute>
            }
          />
        </Route>

        {/* Main app */}
        <Route element={<MainLayout />}>
          {/* Redirect root to user's preferred page */}
          <Route
            path='/'
            element={<Navigate to={getDefaultRoute()} replace />}
          />

          <Route
            path='/dashboard'
            element={
              <ProtectedRoute>
                <DashboardHome />
              </ProtectedRoute>
            }
          />
          <Route
            path='/settings'
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          {/* Workspaces */}
          <Route
            path='/workspaces'
            element={
              <ProtectedRoute>
                <Workspaces />
              </ProtectedRoute>
            }
          />
          <Route
            path='/workspaces/:workspaceId'
            element={
              <ProtectedRoute>
                <WorkspaceDocuments />
              </ProtectedRoute>
            }
          />

          {/* Documents */}
          <Route
            path='/documents/:documentId'
            element={
              <ProtectedRoute>
                <DocumentEditor />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </Suspense>
  );
}
