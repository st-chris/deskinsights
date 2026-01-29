import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import {
  fetchDocumentById,
  updateDocument,
} from '../../reducers/document/document';
import {
  selectCurrentDocument,
  selectDocumentLoading,
} from '../../reducers/document/selectors';
import { Editor } from '../../components/Editor/Editor';
import { ArrowLeft, Save } from 'lucide-react';

const DocumentEditor = () => {
  const { documentId } = useParams<{
    documentId: string;
  }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentDocument = useAppSelector(selectCurrentDocument);
  const isLoading = useAppSelector(selectDocumentLoading);
  const [localTitle, setLocalTitle] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  const titleTimeoutRef = useRef<number | null>(null);
  const contentTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (documentId) dispatch(fetchDocumentById(documentId));
  }, [dispatch, documentId]);

  useEffect(() => {
    if (currentDocument) {
      setLocalTitle(currentDocument.title || '');
    }
  }, [currentDocument]);

  const debouncedTitleUpdate = useCallback(
    (title: string) => {
      if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current);
      titleTimeoutRef.current = setTimeout(() => {
        if (documentId) {
          setIsSaving(true);
          dispatch(
            updateDocument({ id: documentId, payload: { title } }),
          ).finally(() => setIsSaving(false));
        }
      }, 500);
    },
    [dispatch, documentId],
  );

  const debouncedContentUpdate = useCallback(
    (content: string) => {
      if (contentTimeoutRef.current) clearTimeout(contentTimeoutRef.current);
      contentTimeoutRef.current = setTimeout(() => {
        if (documentId) {
          setIsSaving(true);
          dispatch(
            updateDocument({ id: documentId, payload: { content } }),
          ).finally(() => setIsSaving(false));
        }
      }, 1000);
    },
    [dispatch, documentId],
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setLocalTitle(title);
    debouncedTitleUpdate(title);
  };

  const handleContentUpdate = (html: string) => {
    debouncedContentUpdate(html);
  };

  useEffect(() => {
    return () => {
      if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current);
      if (contentTimeoutRef.current) clearTimeout(contentTimeoutRef.current);
    };
  }, []);

  if (isLoading || !documentId)
    return <div className='p-8 text-slate-500'>Loading...</div>;

  return (
    <div className='p-8 max-w-6xl mx-auto'>
      {/* Header with Back & Save Status */}
      <div className='flex items-center justify-between mb-6'>
        <button
          onClick={() =>
            navigate(`/workspaces/${currentDocument?.workspaceId}`)
          }
          className='inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-md transition-all'
          title='Back to workspace'
        >
          <ArrowLeft className='h-4 w-4' />
          Back
        </button>
        <div className='flex items-center gap-2 text-sm text-slate-500'>
          {isSaving ? (
            <div className='flex items-center gap-1'>
              <Save className='h-3 w-3 animate-spin' />
              Saving...
            </div>
          ) : (
            'Saved'
          )}
        </div>
      </div>

      {/* Editable Title */}
      <input
        value={localTitle}
        onChange={handleTitleChange}
        placeholder='Untitled document'
        className='w-full text-3xl font-bold bg-transparent border-none focus:ring-4 ring-slate-200 focus:ring-slate-400 focus:outline-none mb-8 p-0 h-12 resize-none'
        maxLength={200}
      />

      <Editor
        key={documentId}
        documentId={documentId}
        content={currentDocument?.content || ''}
        onUpdate={handleContentUpdate}
      />
    </div>
  );
};

export default DocumentEditor;
