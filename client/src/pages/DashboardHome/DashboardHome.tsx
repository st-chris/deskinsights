import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import { fetchWorkspaces } from '../../reducers/workspace/workspace';
import { selectWorkspaces } from '../../reducers/workspace/selectors';
import NewWorkspaceModal from '../../components/modals/new-workspace-modal/NewWorkspaceModal';
import { createWorkspace } from '../../reducers/workspace/workspace';

const DashboardHome = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, isLoading, isError } = useAppSelector(selectWorkspaces);
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    dispatch(fetchWorkspaces());
  }, [dispatch]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const recentWorkspaces = items
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 3);

  const thisWeekCount = items.filter((ws) => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(ws.createdAt) > weekAgo;
  }).length;

  const handleCreateSubmit = (data: { name: string; description?: string }) => {
    dispatch(createWorkspace(data))
      .unwrap()
      .then((payload) => {
        setShowNewModal(false);
        navigate(`/workspaces/${payload._id}`);
      })
      .catch(() => {});
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-semibold text-slate-900 dark:text-slate-100'>
            {getGreeting()}!
          </h1>
          <p className='text-sm text-slate-600 dark:text-slate-400'>
            Here's what's happening with your workspaces
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className='inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold
                     bg-linear-to-r from-amber-500 to-amber-600 text-white shadow-md
                     hover:shadow-lg hover:brightness-110 transition-all disabled:opacity-60'
          disabled={isLoading}
        >
          <span className='text-lg leading-none'>＋</span>
          New workspace
        </button>
      </div>

      {/* Stats Grid */}
      <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
        <div
          className='rounded-2xl border border-amber-100 dark:border-amber-900/30 bg-white dark:bg-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow'
          data-testid='stat-total-workspaces'
        >
          <div className='flex items-center gap-4'>
            <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30 text-2xl'>
              📊
            </div>
            <div>
              <div className='text-2xl font-bold text-slate-900 dark:text-slate-100'>
                {items.length}
              </div>
              <div className='text-sm text-slate-600 dark:text-slate-400'>
                Total Workspaces
              </div>
            </div>
          </div>
        </div>

        <div className='rounded-2xl border border-amber-100 dark:border-amber-900/30 bg-white dark:bg-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow'>
          <div className='flex items-center gap-4'>
            <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30 text-2xl'>
              ✨
            </div>
            <div>
              <div className='text-2xl font-bold text-slate-900 dark:text-slate-100'>
                {recentWorkspaces.length}
              </div>
              <div className='text-sm text-slate-600 dark:text-slate-400'>
                Recently Active
              </div>
            </div>
          </div>
        </div>

        <div className='rounded-2xl border border-amber-100 dark:border-amber-900/30 bg-white dark:bg-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow'>
          <div className='flex items-center gap-4'>
            <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30 text-2xl'>
              📈
            </div>
            <div>
              <div className='text-2xl font-bold text-slate-900 dark:text-slate-100'>
                +{thisWeekCount}
              </div>
              <div className='text-sm text-slate-600 dark:text-slate-400'>
                This Week
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Workspaces Section */}
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>
            Recent Workspaces
          </h2>
          {items.length > 0 && (
            <button
              onClick={() => navigate('/workspaces')}
              className='text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors'
            >
              View all →
            </button>
          )}
        </div>

        {isLoading && (
          <div className='rounded-xl border border-amber-100 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-200'>
            Loading workspaces…
          </div>
        )}

        {isError && (
          <div className='rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-200'>
            Failed to load workspaces.
          </div>
        )}

        {!isLoading && !isError && items.length === 0 && (
          <div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-amber-200 dark:border-amber-900/30 bg-white dark:bg-slate-800 py-16'>
            <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'>
              <span className='text-4xl'>🚀</span>
            </div>
            <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>
              No workspaces yet
            </h3>
            <p className='mt-1 max-w-md text-center text-sm text-slate-600 dark:text-slate-400'>
              Create your first workspace to start organizing documents for your
              projects
            </p>
            <button
              onClick={() => setShowNewModal(true)}
              className='mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold
                         bg-linear-to-r from-amber-500 to-amber-600 text-white shadow-md
                         hover:shadow-lg hover:brightness-110 transition-all'
            >
              <span className='text-lg leading-none'>＋</span>
              Create Workspace
            </button>
          </div>
        )}

        {!isLoading && !isError && recentWorkspaces.length > 0 && (
          <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
            {recentWorkspaces.map((ws) => (
              <div
                key={ws._id}
                onClick={() => navigate(`/workspaces/${ws._id}`)}
                className='group flex flex-col items-stretch rounded-2xl border border-amber-100 dark:border-amber-900/30
                           bg-white dark:bg-slate-800 p-4 shadow-sm hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700
                           transition-all cursor-pointer'
              >
                <div className='flex items-start justify-between gap-3'>
                  <div className='flex-1'>
                    <h3 className='text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-amber-700 dark:group-hover:text-amber-400'>
                      {ws.name}
                    </h3>
                    {ws.description && (
                      <p className='mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-400'>
                        {ws.description}
                      </p>
                    )}
                  </div>
                  <div className='rounded-lg bg-amber-50 dark:bg-amber-900/30 px-2 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400'>
                    {ws.documentCount || 0} docs
                  </div>
                </div>

                <div className='mt-4 text-xs text-slate-500 dark:text-slate-500'>
                  Updated{' '}
                  {new Date(ws.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>

                <div className='mt-3 text-xs text-amber-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity'>
                  Open workspace →
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className='space-y-4'>
        <h2 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>
          Quick Actions
        </h2>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          <button
            onClick={() => navigate('/workspaces')}
            className='flex flex-col items-center gap-3 rounded-2xl border border-amber-100 dark:border-amber-900/30
                       bg-white dark:bg-slate-800 p-6 shadow-sm hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700
                       transition-all text-center'
          >
            <span className='text-3xl'>📋</span>
            <span className='text-sm font-medium text-slate-900 dark:text-slate-100'>
              View All Workspaces
            </span>
          </button>

          <button
            onClick={() => setShowNewModal(true)}
            className='flex flex-col items-center gap-3 rounded-2xl border border-amber-100 dark:border-amber-900/30
                       bg-white dark:bg-slate-800 p-6 shadow-sm hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700
                       transition-all text-center'
          >
            <span className='text-3xl'>➕</span>
            <span className='text-sm font-medium text-slate-900 dark:text-slate-100'>
              Create Workspace
            </span>
          </button>

          <button
            onClick={() => navigate('/settings')}
            className='flex flex-col items-center gap-3 rounded-2xl border border-amber-100 dark:border-amber-900/30
                       bg-white dark:bg-slate-800 p-6 shadow-sm hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700
                       transition-all text-center'
          >
            <span className='text-3xl'>⚙️</span>
            <span className='text-sm font-medium text-slate-900 dark:text-slate-100'>
              Settings
            </span>
          </button>
        </div>
      </div>

      <NewWorkspaceModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSubmit={handleCreateSubmit}
        isLoading={isLoading}
      />
    </div>
  );
};

export default DashboardHome;
