import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AiSidebar } from './AISidebar';
import api from '../../services/api';
import '@testing-library/jest-dom/vitest';

vi.mock('../../services/api');

const renderWithQuery = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>,
  );
};

describe('AiSidebar', () => {
  const mockToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render when open', () => {
    renderWithQuery(
      <AiSidebar
        text='test content'
        documentId='123'
        isOpen={true}
        onToggle={mockToggle}
      />,
    );

    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    expect(screen.getByText('Document Summary')).toBeInTheDocument();
    expect(screen.getByText('Ask about this document')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    renderWithQuery(
      <AiSidebar
        text='test'
        documentId='123'
        isOpen={false}
        onToggle={mockToggle}
      />,
    );

    expect(screen.queryByText('AI Assistant')).not.toBeInTheDocument();
  });

  it('should fetch and display summary with insights', async () => {
    const mockData = {
      summary: 'This is a test document summary',
      insights: ['Key insight 1', 'Key insight 2', 'Key insight 3'],
    };
    vi.mocked(api.post).mockResolvedValue({ data: mockData });

    renderWithQuery(
      <AiSidebar
        text='document text content'
        documentId='doc123'
        isOpen={true}
        onToggle={mockToggle}
      />,
    );

    // Wait for summary to load
    await waitFor(() => {
      expect(
        screen.getByText('This is a test document summary'),
      ).toBeInTheDocument();
    });

    // Check all insights are displayed
    expect(screen.getByText('Key insight 1')).toBeInTheDocument();
    expect(screen.getByText('Key insight 2')).toBeInTheDocument();
    expect(screen.getByText('Key insight 3')).toBeInTheDocument();

    // Verify API was called with correct params
    expect(api.post).toHaveBeenCalledWith('/ai/document-summary', {
      text: 'document text content',
      documentId: 'doc123',
    });
  });

  it('should show loading state while fetching summary', () => {
    vi.mocked(api.post).mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    renderWithQuery(
      <AiSidebar
        text='document text'
        documentId='123'
        isOpen={true}
        onToggle={mockToggle}
      />,
    );

    expect(screen.getByText('Generating summary...')).toBeInTheDocument();
  });

  it('should show message when no content to summarize', () => {
    renderWithQuery(
      <AiSidebar
        text=''
        documentId='123'
        isOpen={true}
        onToggle={mockToggle}
      />,
    );

    expect(screen.getByText('No content to summarize')).toBeInTheDocument();
  });

  it('should handle chat Q&A interaction', async () => {
    const user = userEvent.setup();

    // Mock summary response
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { summary: 'Summary', insights: [] },
    });

    renderWithQuery(
      <AiSidebar
        text='document content'
        documentId='123'
        isOpen={true}
        onToggle={mockToggle}
      />,
    );

    // Wait for summary to load
    await waitFor(() => {
      expect(screen.getByText('Summary')).toBeInTheDocument();
    });

    // Mock chat response
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { result: 'AI answer to your question' },
    });

    // Type question and send
    const textarea = screen.getByPlaceholderText(/what is this about/i);
    await user.type(textarea, 'What is the main topic?');

    // Get Send button (last button in list)
    const buttons = screen.getAllByRole('button');
    const sendButton = buttons[buttons.length - 1];
    await user.click(sendButton);

    // Verify chat messages appear
    await waitFor(() => {
      expect(screen.getByText('What is the main topic?')).toBeInTheDocument();
      expect(
        screen.getByText('AI answer to your question'),
      ).toBeInTheDocument();
    });

    // Verify API was called correctly
    expect(api.post).toHaveBeenCalledWith('/ai/chat', {
      text: 'document content',
      query: 'What is the main topic?',
      documentId: '123',
    });

    // Input should be cleared after send
    expect(textarea).toHaveValue('');
  });

  it('should handle Enter key to send message', async () => {
    const user = userEvent.setup();

    vi.mocked(api.post)
      .mockResolvedValueOnce({ data: { summary: 'Test', insights: [] } })
      .mockResolvedValueOnce({ data: { result: 'AI response' } });

    renderWithQuery(
      <AiSidebar
        text='document content' // ← Add actual text
        documentId='123'
        isOpen={true}
        onToggle={mockToggle}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(/what is this about/i);
    await user.type(textarea, 'Test question{Enter}');

    await waitFor(() => {
      expect(screen.getByText('AI response')).toBeInTheDocument();
    });
  });

  it('should not send empty messages', async () => {
    const user = userEvent.setup();

    vi.mocked(api.post).mockResolvedValue({
      data: { summary: 'Test', insights: [] },
    });

    renderWithQuery(
      <AiSidebar
        text='doc'
        documentId='123'
        isOpen={true}
        onToggle={mockToggle}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    // Get Send button (last button)
    const buttons = screen.getAllByRole('button');
    const sendButton = buttons[buttons.length - 1];

    // Button should be disabled when textarea is empty
    expect(sendButton).toBeDisabled();

    // Type whitespace only
    const textarea = screen.getByPlaceholderText(/what is this about/i);
    await user.type(textarea, '   ');

    // Should still be disabled
    expect(sendButton).toBeDisabled();
  });

  it('should close sidebar when backdrop is clicked', async () => {
    const user = userEvent.setup();

    renderWithQuery(
      <AiSidebar
        text='doc'
        documentId='123'
        isOpen={true}
        onToggle={mockToggle}
      />,
    );

    // Click the backdrop (first fixed div with bg-black)
    const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/30');
    expect(backdrop).toBeInTheDocument();

    await user.click(backdrop!);

    expect(mockToggle).toHaveBeenCalledTimes(1);
  });

  it('should close sidebar when X button is clicked', async () => {
    const user = userEvent.setup();

    renderWithQuery(
      <AiSidebar
        text='doc'
        documentId='123'
        isOpen={true}
        onToggle={mockToggle}
      />,
    );

    // Get all buttons and click the first one (X in header)
    const buttons = screen.getAllByRole('button');
    const xButton = buttons[0];

    await user.click(xButton);

    expect(mockToggle).toHaveBeenCalledTimes(1);
  });

  it('should clear chat messages when switching documents', async () => {
    const user = userEvent.setup();

    // Mock localStorage properly
    const localStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
          store[key] = value;
        },
        removeItem: (key: string) => {
          delete store[key];
        },
        clear: () => {
          store = {};
        },
      };
    })();

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    vi.mocked(api.post)
      .mockResolvedValueOnce({ data: { summary: 'Doc 1', insights: [] } })
      .mockResolvedValueOnce({ data: { result: 'Answer 1' } })
      .mockResolvedValueOnce({ data: { summary: 'Doc 2', insights: [] } });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    // Render first document
    const { unmount } = render(
      <Wrapper>
        <AiSidebar
          text='doc1'
          documentId='123'
          isOpen={true}
          onToggle={mockToggle}
        />
      </Wrapper>,
    );

    await waitFor(() => expect(screen.getByText('Doc 1')).toBeInTheDocument());

    // Send a message
    const textarea = screen.getByPlaceholderText(/what is this about/i);
    await user.type(textarea, 'Question');
    const buttons = screen.getAllByRole('button');
    await user.click(buttons[buttons.length - 1]);

    await waitFor(() =>
      expect(screen.getByText('Answer 1')).toBeInTheDocument(),
    );

    // Verify message was saved to localStorage for doc 123
    const savedMessages = localStorageMock.getItem('ai-chat-123');
    expect(savedMessages).toBeTruthy();
    expect(JSON.parse(savedMessages!)).toHaveLength(2); // user + ai

    // Unmount first document
    unmount();

    // Mount second document with different ID
    render(
      <Wrapper>
        <AiSidebar
          text='doc2'
          documentId='456'
          isOpen={true}
          onToggle={mockToggle}
        />
      </Wrapper>,
    );

    // Wait for new document to load
    await waitFor(() => expect(screen.getByText('Doc 2')).toBeInTheDocument());

    // Chat cleared for new document (different documentId = different localStorage key)
    expect(screen.queryByText('Answer 1')).not.toBeInTheDocument();
    expect(
      screen.getByText('Ask a question to get started'),
    ).toBeInTheDocument();

    // Verify doc 456 has empty chat
    const doc456Messages = localStorageMock.getItem('ai-chat-456');
    expect(doc456Messages ? JSON.parse(doc456Messages) : []).toEqual([]);

    // Doc 123 messages still exist in localStorage (persistence!)
    expect(localStorageMock.getItem('ai-chat-123')).toBeTruthy();
  });
});
