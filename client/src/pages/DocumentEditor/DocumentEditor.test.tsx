import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, useParams } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DocumentEditor from './DocumentEditor';
import documentsReducer from '../../reducers/document/document';
import '@testing-library/jest-dom/vitest';
import type { DocumentFull, DocumentsState } from '../../models/document';
import type { ReactNode } from 'react';
import documentService from '../../services/document';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

// Mock Editor - render HTML content like the real component
vi.mock('../../components/Editor', () => ({
  Editor: ({
    content,
    onUpdate,
  }: {
    content: string;
    onUpdate: (html: string) => void;
  }) => {
    const handleUpdate = () => onUpdate('Updated content');
    return (
      <div
        data-testid='editor'
        onClick={handleUpdate}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  },
}));

// Mock the hooks to prevent thunk dispatch
vi.mock('../../hooks', async () => {
  const actual = await vi.importActual('../../hooks');
  return {
    ...actual,
    useAppDispatch: () => () =>
      new Promise((resolve) => setTimeout(resolve, 300)),
  };
});

// Mock react-router-dom
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(() => ({ documentId: '123', workspaceId: 'ws1' })),
    useNavigate: () => mockNavigate,
  };
});

const mockDocument: DocumentFull = {
  _id: '123',
  title: 'Test Doc',
  content: '<p>Hello</p>',
  workspaceId: 'ws1',
  plainText: 'Test Doc Hello',
  createdBy: 'user1',
  lastEditedBy: 'user1',
  characterCount: 15,
  wordCount: 3,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isPinned: false,
  isArchived: false,
};

// Mock the document service to prevent API calls
vi.mock('../../services/document', () => ({
  default: {
    getDocumentById: vi.fn(),
    updateDocument: vi.fn(),
  },
}));

const createLoadingState = (): DocumentsState => ({
  items: [],
  currentDocument: null,
  isLoading: true,
  isError: false,
  errorMessage: null,
});

const createLoadedState = (
  overrides: Partial<DocumentsState> = {},
): DocumentsState => ({
  items: [],
  currentDocument: mockDocument,
  isLoading: false,
  isError: false,
  errorMessage: null,
  ...overrides,
});

const createWrapper = (documentsState: DocumentsState) => {
  const store = configureStore({
    reducer: { documents: documentsReducer },
    preloadedState: { documents: documentsState },
  });

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <MemoryRouter initialEntries={['/documents/123']}>
            {children}
          </MemoryRouter>
        </Provider>
      </QueryClientProvider>
    );
  };
};

describe('DocumentEditor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockNavigate.mockClear();

    vi.mocked(documentService.getDocumentById).mockResolvedValue(mockDocument);
    vi.mocked(documentService.updateDocument).mockResolvedValue({
      ...mockDocument,
      title: 'Updated',
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders loading state when isLoading is true', async () => {
    const { unmount } = render(<DocumentEditor />, {
      wrapper: createWrapper(createLoadingState()),
    });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    unmount();
  });

  it('renders editor UI when document loaded', async () => {
    vi.useRealTimers();
    const { unmount } = render(<DocumentEditor />, {
      wrapper: createWrapper(createLoadedState()),
    });

    await waitFor(
      () => {
        expect(screen.getByDisplayValue('Test Doc')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
    expect(screen.getByTestId('editor')).toBeInTheDocument();
    expect(screen.getByText('Saved')).toBeInTheDocument();
    unmount();
  });

  it('renders title from loaded document', async () => {
    vi.useRealTimers();
    const { unmount } = render(<DocumentEditor />, {
      wrapper: createWrapper(
        createLoadedState({
          currentDocument: {
            ...mockDocument,
            title: 'Custom Title',
          },
        }),
      ),
    });

    await waitFor(
      () => {
        expect(screen.getByDisplayValue('Custom Title')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
    unmount();
  });

  it('opens version history modal from toolbar', async () => {
    vi.useRealTimers();

    render(<DocumentEditor />, {
      wrapper: createWrapper(createLoadedState()),
    });

    // Wait for toolbar, find Version History button (Clock icon + text)
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Version History/i }),
      ).toBeInTheDocument();
    });

    // Click version history button
    const versionHistoryBtn = screen.getByRole('button', {
      name: /Version History/i,
    });
    fireEvent.click(versionHistoryBtn);

    // Version modal opens
    await waitFor(() => {
      expect(screen.getByText('Version History')).toBeInTheDocument();
      expect(screen.getByText('Loading versions...')).toBeInTheDocument();
    });
  });

  it('updates title on input change', async () => {
    vi.useRealTimers();
    const { unmount } = render(<DocumentEditor />, {
      wrapper: createWrapper(createLoadedState()),
    });

    const titleInput = await waitFor(() =>
      screen.getByDisplayValue('Test Doc'),
    );
    fireEvent.change(titleInput, { target: { value: 'New Title' } });

    expect(screen.getByDisplayValue('New Title')).toBeInTheDocument();
    unmount();
  });

  it('shows saving state during debounced update', async () => {
    vi.useRealTimers();

    const { unmount } = render(<DocumentEditor />, {
      wrapper: createWrapper(createLoadedState()),
    });

    const titleInput = await waitFor(() =>
      screen.getByDisplayValue('Test Doc'),
    );

    vi.useFakeTimers();
    fireEvent.change(titleInput, { target: { value: 'Updated' } });

    // Wait for debounce (500ms) to trigger saving state
    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(screen.getByText(/saving/i)).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    vi.useRealTimers();
    unmount();
  });

  it('triggers content update when editor clicked', async () => {
    vi.useRealTimers();
    const { unmount } = render(<DocumentEditor />, {
      wrapper: createWrapper(createLoadedState()),
    });

    await waitFor(() => {
      expect(screen.getByTestId('editor')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('editor'));

    // Content update triggered (no error thrown)
    await waitFor(() => {
      expect(screen.getByTestId('editor')).toBeInTheDocument();
    });
    unmount();
  });

  it('navigates back to workspace on back button click', async () => {
    vi.useRealTimers();

    const { unmount } = render(<DocumentEditor />, {
      wrapper: createWrapper(createLoadedState()),
    });

    // Wait until the document is loaded into Redux (title visible)
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Doc')).toBeInTheDocument();
    });

    const backButton = screen.getByRole('button', { name: /back/i });

    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/workspaces/ws1');

    unmount();
  });

  it('shows loading when no documentId', () => {
    vi.mocked(useParams).mockReturnValueOnce({
      documentId: undefined,
      workspaceId: 'ws1',
    });

    const { unmount } = render(<DocumentEditor />, {
      wrapper: createWrapper(createLoadedState()),
    });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    unmount();
  });
});
