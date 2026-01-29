import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DocumentEditor from './DocumentEditor';
import documentsReducer from '../../reducers/document/document';
import '@testing-library/jest-dom/vitest';
import type { DocumentFull, DocumentsState } from '../../models/document';
import type { ReactNode } from 'react';

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
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(() => ({ documentId: '123' })),
  };
});

// Mock the document service to prevent API calls
vi.mock('../../services/document', () => ({
  default: {
    getDocumentById: vi.fn().mockResolvedValue({}),
    updateDocument: vi.fn().mockResolvedValue({}),
  },
}));

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
});
