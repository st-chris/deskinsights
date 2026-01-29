import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import {
  fetchWorkspaces,
  createWorkspace,
  deleteWorkspace,
} from '../../reducers/workspace/workspace';
import { selectWorkspaces } from '../../reducers/workspace/selectors';
import NewWorkspaceModal from '../../components/modals/new-workspace-modal/NewWorkspaceModal';
import DeleteConfirmModal from '../../components/modals/delete-confirm-modal/DeleteConfirmModal';

const Workspaces = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, isLoading, isError, errorMessage } =
    useAppSelector(selectWorkspaces);

  const [showNewModal, setShowNewModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    dispatch(fetchWorkspaces());
  }, [dispatch]);

  const handleCreateSubmit = (data: { name: string; description?: string }) => {
    dispatch(createWorkspace(data))
      .unwrap()
      .then((payload) => {
        setShowNewModal(false);
        navigate(`/workspaces/${payload._id}`);
      })
      .catch(() => {
        // Error handled by reducer
      });
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      dispatch(deleteWorkspace(deleteTarget.id))
        .unwrap()
        .then(() => {
          setDeleteTarget(null);
        })
        .catch(() => {
          // Error handled by reducer
        });
    }
  };

  const handleOpen = (id: string) => {
    navigate(`/workspaces/${id}`);
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-semibold text-slate-900'>
            Your workspaces
          </h1>
          <p className='text-sm text-slate-600'>
            Organize documents into dedicated workspaces for different projects.
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

      {/* Loading / Error states */}
      {isLoading && (
        <div className='rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800'>
          Loading workspaces…
        </div>
      )}

      {isError && (
        <div className='rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700'>
          {errorMessage || 'Failed to load workspaces.'}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && items.length === 0 && (
        <div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-amber-200 bg-white py-16'>
          <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600'>
            <span className='text-2xl'>📂</span>
          </div>
          <h2 className='text-lg font-semibold text-slate-900'>
            No workspaces yet
          </h2>
          <p className='mt-1 max-w-md text-center text-sm text-slate-600'>
            Create your first workspace to start organizing documents for your
            projects, clients or teams.
          </p>
          <button
            onClick={() => setShowNewModal(true)}
            className='mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold
                       bg-linear-to-r from-amber-500 to-amber-600 text-white shadow-md
                       hover:shadow-lg hover:brightness-110 transition-all'
          >
            <span className='text-lg leading-none'>＋</span>
            New workspace
          </button>
        </div>
      )}

      {/* Grid of workspace cards */}
      {!isLoading && !isError && items.length > 0 && (
        <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
          {items.map((ws) => (
            <div
              key={ws._id}
              onClick={() => handleOpen(ws._id)}
              className='group flex flex-col items-stretch rounded-2xl border border-amber-100
                         bg-white p-4 text-left shadow-sm hover:shadow-md hover:border-amber-300
                         transition-all relative cursor-pointer'
            >
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <h3 className='text-base font-semibold text-slate-900 group-hover:text-amber-700'>
                    {ws.name}
                  </h3>
                  {ws.description && (
                    <p className='mt-1 line-clamp-2 text-xs text-slate-600'>
                      {ws.description}
                    </p>
                  )}
                </div>

                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget({ id: ws._id, name: ws.name });
                  }}
                  className='rounded-full p-1 text-xs text-slate-400 hover:text-red-500 hover:bg-red-50'
                >
                  ✕
                </button>
              </div>

              <div className='mt-4 text-xs text-slate-500'>
                {new Date(ws.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>

              <div className='mt-3 text-xs text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity'>
                Click to open workspace →
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <NewWorkspaceModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSubmit={handleCreateSubmit}
        isLoading={isLoading}
      />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        itemName={deleteTarget?.name || ''}
        itemType='workspace'
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isLoading}
      />
    </div>
  );
};

export default Workspaces;
