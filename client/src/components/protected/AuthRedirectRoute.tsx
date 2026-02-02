import type { JSX } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { selectIsAuthenticated } from '../../reducers/auth/selectors';

export default function AuthRedirectRoute({
  children,
}: {
  children: JSX.Element;
}) {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  if (isAuthenticated) {
    return <Navigate to='/' replace />;
  }

  return children;
}
