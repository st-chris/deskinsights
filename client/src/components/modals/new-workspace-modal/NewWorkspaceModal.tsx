import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';

const workspaceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
});

type WorkspaceFormData = z.infer<typeof workspaceSchema>;

interface NewWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WorkspaceFormData) => void;
  isLoading?: boolean;
}

export default function NewWorkspaceModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: NewWorkspaceModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceSchema),
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFormSubmit = (data: WorkspaceFormData) => {
    onSubmit(data);
    reset();
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
      <div className='w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl'>
        <h2 className='text-xl font-semibold text-slate-900 mb-4'>
          Create New Workspace
        </h2>

        <form onSubmit={handleSubmit(handleFormSubmit)} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-slate-700 mb-1'>
              Workspace Name *
            </label>
            <input
              {...register('name')}
              className='w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                         focus:ring-2 focus:ring-amber-400 focus:border-amber-400 focus:outline-none'
              placeholder='e.g., Personal Projects'
            />
            {errors.name && (
              <p className='mt-1 text-xs text-red-600'>{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-slate-700 mb-1'>
              Description (optional)
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className='w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                         focus:ring-2 focus:ring-amber-400 focus:border-amber-400 focus:outline-none'
              placeholder="What's this workspace for?"
            />
            {errors.description && (
              <p className='mt-1 text-xs text-red-600'>
                {errors.description.message}
              </p>
            )}
          </div>

          <div className='flex gap-3 pt-2'>
            <button
              type='button'
              onClick={handleClose}
              disabled={isLoading}
              className='flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium
                         text-slate-700 hover:bg-slate-50 disabled:opacity-50'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={isLoading}
              className='flex-1 rounded-lg bg-linear-to-r from-amber-500 to-amber-600 px-4 py-2
                         text-sm font-semibold text-white shadow-md hover:shadow-lg 
                         hover:brightness-110 disabled:opacity-50'
            >
              {isLoading ? 'Creating...' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
