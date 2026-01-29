import { Route, Routes } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { logout, refreshLogin } from './reducers/auth/auth';
import type { AppDispatch } from './types/redux';
import Home from './pages/Home';
import Profile from './pages/Profile';
import ProtectedRoute from './components/protected/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import AuthRedirectRoute from './components/protected/AuthRedirectRoute';
import DocumentEditor from './pages/DocumentEditor/DocumentEditor';
import Workspaces from './pages/WorkspaceList/WorkspaceList';
import WorkspaceDocuments from './pages/WorkspaceDocumentList/WorkspaceDocumentList';

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

  return (
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
        <Route path='/' element={<Home />} />
        <Route
          path='/profile'
          element={
            <ProtectedRoute>
              <Profile />
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
  );
}
