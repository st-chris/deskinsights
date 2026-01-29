import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Code,
  Sparkles,
  FileText,
  Maximize,
  Clock,
} from 'lucide-react';
import DOMPurify from 'dompurify';
import { useAIAction } from '../../hooks/useAiActions';
import { VersionHistory } from '../VersionHistory/VersionHistory';
import { AiSidebar } from '../AISidebar/AISidebar';
import { useState } from 'react';
import logger from '../../services/logger';

interface EditorProps {
  content: string;
  documentId: string;
  onUpdate: (html: string) => void;
}

export const Editor = ({ content, documentId, onUpdate }: EditorProps) => {
  const { mutate: performAIAction, isPending } = useAIAction();
  const [showVersions, setShowVersions] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: { class: 'list-disc list-inside ml-4 space-y-1' },
        },
        orderedList: {
          HTMLAttributes: { class: 'list-decimal list-inside ml-4 space-y-1' },
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: { class: 'max-w-full h-auto rounded' },
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          'p-4 prose prose-slate prose-headings:font-bold prose-p:my-2 min-h-[400px] focus:outline-none bg-white border border-slate-200 rounded-b-lg [&_p]:my-2 [&_pre]:bg-slate-900/90 [&_pre]:p-3 [&_pre]:rounded-md [&_pre]:text-sm [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-px [&_code]:rounded [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded',
      },
    },
    onUpdate: ({ editor }) => {
      const rawHTML = editor.getHTML();
      const safeHTML = DOMPurify.sanitize(rawHTML, {
        ALLOWED_TAGS: [
          'p',
          'ul',
          'ol',
          'li',
          'pre',
          'code',
          'strong',
          'em',
          'h1',
          'h2',
          'h3',
          'blockquote',
          'img',
        ],
        ALLOWED_ATTR: ['class', 'style'],
        ALLOW_DATA_ATTR: true,
        ADD_ATTR: ['src'],
        ADD_URI_SAFE_ATTR: ['src'],
      });
      onUpdate(safeHTML);
    },
  });

  if (!editor) {
    return <div className='p-6 text-slate-500'>Loading editor...</div>;
  }

  const text = editor.getText() || '';

  const Button = ({
    isActive,
    onClick,
    children,
    title,
    disabled = false,
    className = '',
  }: {
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
    title: string;
    disabled?: boolean;
    className?: string;
  }) => (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium
        transition-all duration-200 hover:bg-slate-200 hover:text-slate-900 active:bg-slate-300 active:scale-[0.98]
        ${
          isActive
            ? 'bg-slate-900 text-white shadow-sm hover:bg-slate-800 active:bg-slate-700'
            : 'text-slate-500 hover:bg-slate-100'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2
      `}
    >
      {children}
    </button>
  );

  const addImage = () => {
    const url = window.prompt('Image URL (http/https only):');
    if (url && /^(https?):\/\//.test(url)) {
      editor.chain().focus().setImage({ src: url, alt: 'User image' }).run();
    }
  };

  const handleAIAction = (action: 'summarize' | 'rewrite' | 'expand') => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');
    if (!selectedText || selectedText.trim().length === 0) {
      alert('Please select some text first');
      return;
    }
    performAIAction(
      { action, text: selectedText },
      {
        onSuccess: (result) => {
          editor.chain().focus().insertContentAt({ from, to }, result).run();
        },
        onError: (error) => {
          logger.error('Editor.PerformAI', error);
          alert(`Failed to ${action} text. Please try again.`);
        },
      },
    );
  };

  const handleRestoreContent = (restoredContent: string) => {
    editor.commands.setContent(restoredContent);
  };

  return (
    <div className='border border-slate-200 rounded-lg overflow-hidden shadow-sm'>
      <div className='border-b border-slate-200 bg-slate-50 px-2 py-1.5 flex gap-0.5 items-center'>
        <Button
          isActive={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title='Bold (⌘+B)'
        >
          <Bold className='h-4 w-4' />
        </Button>
        <Button
          isActive={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title='Italic (⌘+I)'
        >
          <Italic className='h-4 w-4' />
        </Button>
        <Button
          isActive={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title='Bullets'
        >
          <List className='h-4 w-4' />
        </Button>
        <Button
          isActive={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title='Numbers'
        >
          <ListOrdered className='h-4 w-4' />
        </Button>
        <Button
          isActive={editor.isActive('codeBlock')}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title='Code block'
        >
          <Code className='h-4 w-4' />
        </Button>
        <Button onClick={addImage} title='Image (paste URL)' isActive={false}>
          <svg
            className='h-4 w-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
            />
          </svg>
        </Button>

        <div className='w-px bg-slate-300 mx-1' />

        <Button
          isActive={false}
          onClick={() => handleAIAction('summarize')}
          disabled={isPending}
          title='Summarize selected text'
        >
          <FileText className='h-4 w-4' />
        </Button>
        <Button
          isActive={false}
          onClick={() => handleAIAction('rewrite')}
          disabled={isPending}
          title='Rewrite selected text'
        >
          <Sparkles className='h-4 w-4' />
        </Button>
        <Button
          isActive={false}
          onClick={() => handleAIAction('expand')}
          disabled={isPending}
          title='Expand selected text'
        >
          <Maximize className='h-4 w-4' />
        </Button>

        <Button
          isActive={false}
          onClick={() => setIsSidebarOpen(true)}
          title='AI Sidebar Assistant'
          className='bg-amber-500 hover:bg-amber-600 text-white'
        >
          <Sparkles className='h-4 w-4' />
        </Button>

        <div className='ml-auto'>
          <Button
            isActive={false}
            onClick={() => setShowVersions(true)}
            title='Version History'
          >
            <Clock className='h-4 w-4' />
          </Button>
        </div>
      </div>

      <div data-testid='editor'>
        <EditorContent editor={editor} />
      </div>

      {isSidebarOpen && (
        <AiSidebar
          text={text}
          documentId={documentId}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(false)}
        />
      )}

      <VersionHistory
        documentId={documentId}
        isOpen={showVersions}
        onClose={() => setShowVersions(false)}
        onRestore={handleRestoreContent}
      />
    </div>
  );
};
