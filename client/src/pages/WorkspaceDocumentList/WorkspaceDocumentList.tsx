import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import {
  fetchDocumentsInWorkspace,
  createDocument,
  deleteDocument,
} from '../../reducers/document/document';
import { fetchWorkspaceById } from '../../reducers/workspace/workspace';
import DeleteConfirmModal from '../../components/modals/delete-confirm-modal/DeleteConfirmModal';
import { selectSelectedWorkspace } from '../../reducers/workspace/selectors';
import { selectDocuments } from '../../reducers/document/selectors';

const WorkspaceDocuments = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const selectedWorkspace = useAppSelector(selectSelectedWorkspace);
  const { items, isLoading, isError, errorMessage } =
    useAppSelector(selectDocuments);

  useEffect(() => {
    if (workspaceId) {
      dispatch(fetchWorkspaceById(workspaceId));
      dispatch(fetchDocumentsInWorkspace(workspaceId));
    }
  }, [dispatch, workspaceId]);

  const handleCreateDoc = () => {
    if (!workspaceId) return;
    dispatch(createDocument({ workspaceId }))
      .unwrap()
      .then((payload) => {
        navigate(`/documents/${payload._id}`);
      });
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;

    dispatch(deleteDocument(deleteTarget.id))
      .unwrap()
      .then(() => {
        setDeleteTarget(null);
      })
      .catch(() => {
        // Error handled by reducer
      });
  };

  if (!workspaceId) {
    return (
      <div className='rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800'>
        No workspace selected.
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between gap-4'>
        <div>
          <button
            type='button'
            onClick={() => navigate('/workspaces')}
            className='mb-1 text-xs font-medium text-amber-700 hover:text-amber-800'
          >
            ← Back to workspaces
          </button>
          <h1 className='text-2xl font-semibold text-slate-900'>
            {selectedWorkspace?.name ?? 'Workspace'}
          </h1>
          {selectedWorkspace?.description && (
            <p className='mt-1 text-sm text-slate-600'>
              {selectedWorkspace.description}
            </p>
          )}
        </div>

        <button
          onClick={handleCreateDoc}
          disabled={isLoading}
          className='inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold
                     bg-linear-to-r from-amber-500 to-amber-600 text-white shadow-md
                     hover:shadow-lg hover:brightness-110 transition-all
                     disabled:opacity-60 disabled:cursor-not-allowed'
        >
          <span className='text-lg leading-none'>＋</span>
          New document
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className='rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800'>
          Loading documents…
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className='rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700'>
          {errorMessage || 'Failed to load documents.'}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && items.length === 0 && (
        <div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-amber-200 bg-white py-16'>
          <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600'>
            <span className='text-2xl'>📄</span>
          </div>
          <h2 className='text-lg font-semibold text-slate-900'>
            No documents in this workspace
          </h2>
          <p className='mt-1 max-w-md text-center text-sm text-slate-600'>
            Create your first document to start capturing notes, ideas, or
            requirements for this workspace.
          </p>
          <button
            onClick={handleCreateDoc}
            disabled={isLoading}
            className='mt-4 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow
                       hover:bg-amber-600 hover:shadow-md transition-all
                       disabled:opacity-60 disabled:cursor-not-allowed'
          >
            Create document
          </button>
        </div>
      )}

      {/* Documents list */}
      {!isLoading && !isError && items.length > 0 && (
        <div className='rounded-2xl border border-amber-100 bg-white'>
          <ul className='divide-y divide-amber-50'>
            {items.map((doc) => (
              <li
                key={doc._id}
                className='cursor-pointer px-4 py-3 hover:bg-amber-50 transition-colors'
                onClick={() => navigate(`/documents/${doc._id}`)}
              >
                <div className='flex items-center justify-between gap-3'>
                  <div className='min-w-0 flex-1'>
                    <h3 className='text-sm font-semibold text-slate-900 truncate'>
                      {doc.title}
                    </h3>
                    <p className='mt-1 text-xs text-slate-500'>
                      {doc.wordCount} words
                    </p>
                  </div>

                  <span className='text-[11px] text-slate-500 shrink-0 tabular-nums'>
                    {new Date(doc.updatedAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget({ id: doc._id, title: doc.title });
                    }}
                    disabled={!!deleteTarget}
                    className='shrink-0 rounded-full p-1.5 bg-red-50 hover:bg-red-100 
                               text-red-500 hover:text-red-600 transition-all
                               disabled:opacity-40 disabled:cursor-not-allowed ml-2'
                    title='Delete document'
                  >
                    <svg
                      className='w-3.5 h-3.5'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m7-10V4a1 1 0 00-1-1h-4M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M9 7h6'
                      />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Delete Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        itemName={deleteTarget?.title || ''}
        itemType='document'
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isLoading}
      />
    </div>
  );
};

export default WorkspaceDocuments;
