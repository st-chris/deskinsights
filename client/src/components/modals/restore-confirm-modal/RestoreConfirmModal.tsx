import { useEffect } from 'react';

interface RestoreConfirmModalProps {
  isOpen: boolean;
  versionNumber: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function RestoreConfirmModal({
  isOpen,
  versionNumber,
  onConfirm,
  onCancel,
}: RestoreConfirmModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4 pb-safe'>
      <div className='w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6'>
        <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mx-auto'>
          <svg
            className='w-6 h-6 text-blue-600'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
        </div>

        <h2 className='text-xl font-semibold text-slate-900 mb-2 text-center'>
          Restore Version {versionNumber}?
        </h2>

        <p className='text-sm text-slate-600 mb-6 text-center leading-relaxed'>
          Current content will be saved as a new version first. All previous
          versions will be preserved. You can always restore a newer version
          later.
        </p>

        <div className='flex gap-3'>
          <button
            type='button'
            onClick={onCancel}
            className='flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium
                       text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 
                       focus-visible:ring-slate-500 focus-visible:ring-offset-2'
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={onConfirm}
            className='flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white
                       hover:bg-blue-700 focus:outline-none focus-visible:ring-2 
                       focus-visible:ring-blue-500 focus-visible:ring-offset-2 shadow-sm'
          >
            Restore Version
          </button>
        </div>
      </div>
    </div>
  );
}
