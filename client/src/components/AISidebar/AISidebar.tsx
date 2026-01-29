import { useState } from 'react';
import {
  X,
  Send,
  FileText,
  Lightbulb,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { useAIAction, useAIDocumentSummary } from '../../hooks/useAiActions';
import { useAiChatPersistence } from '../../hooks/useAiChatPersistence';

interface AiSidebarProps {
  text: string;
  documentId: string;
  isOpen: boolean;
  onToggle: () => void;
}

export const AiSidebar = ({
  text,
  documentId,
  isOpen,
  onToggle,
}: AiSidebarProps) => {
  const [question, setQuestion] = useState('');
  const [chatMessages, setChatMessages] = useAiChatPersistence(documentId);

  const { data: aiData, isLoading } = useAIDocumentSummary(
    documentId,
    text,
    isOpen,
  );
  const { mutate: performAIAction, isPending: isChatPending } = useAIAction();

  const handleSend = () => {
    if (!question.trim()) return;

    performAIAction(
      { action: 'chat', text, query: question, documentId },
      {
        onSuccess: (result) => {
          setChatMessages((prev) => [
            ...prev,
            { role: 'user', content: question },
            { role: 'ai', content: result },
          ]);
          setQuestion('');
        },
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className='fixed inset-0 bg-black/30 backdrop-blur-sm z-40'
        onClick={onToggle}
      />

      <div className='fixed top-0 right-0 h-full w-80 bg-white border-l-2 border-slate-200 shadow-2xl z-50 transform transition-transform duration-300'>
        <div className='h-full flex flex-col'>
          {/* Header */}
          <div className='p-6 border-b border-slate-200 flex items-center justify-between shrink-0'>
            <h2 className='text-xl font-bold text-slate-900 flex items-center gap-2'>
              <Sparkles className='h-5 w-5 text-amber-500' />
              AI Assistant
            </h2>
            <button
              onClick={onToggle}
              className='p-2 hover:bg-slate-100 rounded-lg transition-colors'
            >
              <X className='h-5 w-5 text-slate-500' />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className='flex-1 overflow-y-auto p-6'>
            <div className='space-y-6'>
              {/* Summary */}
              <div className='space-y-4'>
                <div className='flex items-center gap-2'>
                  <FileText className='h-5 w-5 text-slate-500' />
                  <h3 className='font-semibold text-slate-900'>
                    Document Summary
                  </h3>
                </div>
                {isLoading ? (
                  <div className='text-slate-500 text-sm'>
                    Generating summary...
                  </div>
                ) : aiData?.summary ? (
                  <div className='bg-slate-50 p-4 rounded-lg text-sm leading-relaxed'>
                    {aiData.summary}
                  </div>
                ) : (
                  <div className='text-slate-500 text-sm'>
                    No content to summarize
                  </div>
                )}
              </div>

              {/* Key Insights */}
              {aiData?.insights && (
                <div>
                  <div className='flex items-center gap-2 mb-3'>
                    <Lightbulb className='h-5 w-5 text-amber-500' />
                    <h3 className='font-semibold text-slate-900'>
                      Key Insights
                    </h3>
                  </div>
                  <ul className='space-y-2'>
                    {aiData.insights.map((insight: string, i: number) => (
                      <li key={i} className='flex gap-2 text-sm'>
                        <div className='w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 shrink-0' />
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Chat Messages */}
          <div className='flex-1 overflow-y-auto px-6 pb-4 bg-slate-50 border-t-2 border-amber-400 shadow-inner'>
            {/* Chat Section Title */}
            <div className='flex items-center gap-2 pt-3'>
              <MessageSquare className='h-5 w-5 text-slate-500' />
              <h3 className='font-semibold text-slate-900'>
                Ask about this document
              </h3>
            </div>

            <div className='space-y-3 py-3'>
              {chatMessages.length === 0 ? (
                <p className='text-slate-400 text-xs text-center py-8'>
                  Ask a question to get started
                </p>
              ) : (
                <>
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                          msg.role === 'user'
                            ? 'bg-amber-500 text-white'
                            : 'bg-white border border-slate-200 shadow-sm'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Chat Input */}
          <div className='p-4 border-t border-slate-200 bg-white shrink-0'>
            <div className='flex gap-2 p-2 bg-slate-50 rounded-lg'>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder='e.g. What is this about?'
                className='flex-1 p-3 bg-white border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm'
                rows={2}
              />
              <button
                onClick={handleSend}
                disabled={!question.trim() || isChatPending}
                className='p-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors text-white'
              >
                <Send className='h-4 w-4' />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
