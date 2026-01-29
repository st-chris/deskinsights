import { useEffect } from 'react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  itemName: string;
  itemType?: 'workspace' | 'document' | 'item';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function DeleteConfirmModal({
  isOpen,
  itemName,
  itemType = 'item',
  onConfirm,
  onCancel,
  isLoading,
}: DeleteConfirmModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'; // Disable scroll
      return () => {
        document.body.style.overflow = ''; // Re-enable on close
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const messages = {
    workspace: 'This will permanently delete all documents inside.',
    document: 'This action cannot be undone.',
    item: 'This action cannot be undone.',
  };

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center 
                bg-black/50 p-4 pb-safe'
    >
      <div className='w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6'>
        <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100'>
          <span className='text-2xl'>⚠️</span>
        </div>

        <h2 className='text-xl font-semibold text-slate-900 mb-2'>
          Delete{' '}
          {itemType === 'workspace'
            ? 'Workspace'
            : itemType === 'document'
              ? 'Document'
              : 'Item'}
          ?
        </h2>

        <p className='text-sm text-slate-600 mb-6'>
          Are you sure you want to delete <strong>"{itemName}"</strong>?{' '}
          {messages[itemType]}
        </p>

        <div className='flex gap-3'>
          <button
            type='button'
            onClick={onCancel}
            disabled={isLoading}
            className='flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium
                       text-slate-700 hover:bg-slate-50 disabled:opacity-50'
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={onConfirm}
            disabled={isLoading}
            className='flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white
                       hover:bg-red-700 disabled:opacity-50'
          >
            {isLoading
              ? 'Deleting...'
              : `Delete ${itemType === 'workspace' ? 'Workspace' : itemType === 'document' ? 'Document' : 'Item'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
