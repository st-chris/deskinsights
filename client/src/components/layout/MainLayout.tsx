import { Outlet, Link } from 'react-router-dom';
import NavLinkItem from './NavLinkItem';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../types/redux';
import { logout } from '../../reducers/auth/auth';
import {
  selectAuthUser,
  selectIsAuthenticated,
} from '../../reducers/auth/selectors';

export default function MainLayout() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectAuthUser);
  const dispatch = useDispatch<AppDispatch>();

  return (
    <div className='min-h-screen bg-amber-50/40 text-slate-900 flex flex-col'>
      {/* Top Brand Bar */}
      <div className='h-1.5 bg-linear-to-r from-amber-500 via-amber-400 to-amber-600'></div>

      {/* Header */}
      <header className='sticky top-0 z-40 border-b border-amber-200/70 bg-white/80 backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.05)]'>
        <div className='max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between'>
          <div className='flex items-center gap-10'>
            <span className='text-xl font-bold tracking-tight bg-linear-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent'>
              DeskInsights
            </span>

            <nav className='hidden md:flex gap-6 text-sm font-semibold'>
              <NavLinkItem label='Home' to='/' />
              {isAuthenticated && (
                <NavLinkItem label='Workspaces' to='/workspaces' />
              )}
              <NavLinkItem label='Profile' to='/profile' />
            </nav>
          </div>

          {/* Auth buttons */}
          <div className='flex items-center gap-4'>
            {!isAuthenticated ? (
              <>
                <Link
                  to='/login'
                  className='px-4 py-2 text-sm font-medium rounded-md border border-amber-400
                   text-amber-700 bg-amber-100 hover:bg-amber-200 transition'
                >
                  Log in
                </Link>

                <Link
                  to='/register'
                  className='px-4 py-2 text-sm font-medium rounded-md
                   bg-linear-to-r from-amber-500 to-amber-600
                   text-white shadow-md hover:shadow-lg hover:brightness-110
                   transition-all'
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                {user && (
                  <span className='text-sm font-medium text-amber-700'>
                    Hi, {user.name ?? 'User'}
                  </span>
                )}

                <button
                  onClick={() => dispatch(logout())}
                  className='px-4 py-2 text-sm font-medium rounded-md
                   bg-red-500 text-white shadow hover:bg-red-600 transition'
                >
                  Log out
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='flex-1 w-full'>
        <div className='mx-auto w-full px-6 py-12 max-w-7xl'>
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className='border-t border-amber-200 bg-amber-50 py-6 text-center text-sm text-amber-800'>
        © 2025 st-chris | DeskInsights
      </footer>
    </div>
  );
}
