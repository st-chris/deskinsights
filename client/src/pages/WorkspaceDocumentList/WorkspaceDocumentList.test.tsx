import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, type Mock } from 'vitest';

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock API
vi.mock('../../services/api', () => {
  return {
    default: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
      interceptors: {
        request: { use: vi.fn(), eject: vi.fn() },
        response: { use: vi.fn(), eject: vi.fn() },
      },
    },
  };
});

// Import after mocking
import { configureStore } from '@reduxjs/toolkit';
import type { RootState } from '../../types/redux';
import WorkspaceDocuments from './WorkspaceDocumentList';
import authReducer from '../../reducers/auth/auth';
import workspaceReducer from '../../reducers/workspace/workspace';
import documentReducer from '../../reducers/document/document';
import api from '../../services/api';

const mockApiGet = api.get as Mock;
const mockApiPost = api.post as Mock;
const mockApiDelete = api.delete as Mock;

// Helper to create store with proper typing
const createMockStore = (initialState?: Partial<RootState>) => {
  return configureStore({
    reducer: {
      auth: authReducer,
      workspaces: workspaceReducer,
      documents: documentReducer,
    },
    preloadedState: initialState as RootState,
  });
};

// Helper to render with providers and route params
const renderWithProviders = ({
  store = createMockStore(),
  workspaceId = 'workspace-123',
} = {}) => {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/workspaces/${workspaceId}`]}>
        <Routes>
          <Route
            path='/workspaces/:workspaceId'
            element={<WorkspaceDocuments />}
          />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
};

describe('WorkspaceDocuments', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    vi.clearAllMocks();
    mockApiGet.mockResolvedValue({ data: [] });
  });

  describe('Initial state', () => {
    test('fetches workspace and documents on mount', async () => {
      const mockWorkspace = {
        _id: 'workspace-123',
        name: 'Test Workspace',
        description: 'Test description',
        createdAt: '2026-01-01T00:00:00.000Z',
        ownerId: 'user-1',
        updatedAt: '2026-01-01T00:00:00.000Z',
        documentCount: 1,
      };
      const mockDocuments = [
        {
          _id: 'doc-1',
          title: 'Document 1',
          wordCount: 100,
          updatedAt: '2026-01-15T00:00:00.000Z',
          createdAt: '2026-01-15T00:00:00.000Z',
          isPinned: false,
        },
      ];

      mockApiGet.mockImplementation((url) => {
        // Check for documents endpoint
        if (url.includes('/documents/workspace/')) {
          return Promise.resolve({ data: mockDocuments });
        }
        // Then check for workspace endpoint
        if (url.includes('/workspaces/workspace-123')) {
          return Promise.resolve({ data: mockWorkspace });
        }
        return Promise.resolve({ data: [] });
      });

      const store = createMockStore();
      renderWithProviders({ store });

      // Wait for both API calls to be made
      await waitFor(() => {
        expect(mockApiGet.mock.calls.length).toBeGreaterThanOrEqual(2);
      });

      // Extract just the URL from each call
      const calls = mockApiGet.mock.calls.map((call) => call[0]);
      expect(calls).toContain('/workspaces/workspace-123');
      expect(calls).toContain('/documents/workspace/workspace-123');
    });

    test('shows loading state initially', () => {
      const store = createMockStore({
        documents: {
          items: [],
          currentDocument: null,
          isLoading: true,
          isError: false,
          errorMessage: null,
        },
      });

      renderWithProviders({ store });

      expect(screen.getByText(/loading documents/i)).toBeInTheDocument();
    });
  });

  describe('Rendering states', () => {
    test('shows error state when fetch fails', async () => {
      // Mock the API to reject so the thunk fails
      mockApiGet.mockRejectedValue(new Error('Network error'));

      const store = createMockStore({
        workspaces: {
          items: [],
          selectedWorkspace: {
            _id: 'workspace-123',
            name: 'Test Workspace',
            description: 'Test description',
            createdAt: '2026-01-01T00:00:00.000Z',
            ownerId: 'user-1',
            updatedAt: '2026-01-01T00:00:00.000Z',
            documentCount: 0,
          },
          isLoading: false,
          isError: false,
          errorMessage: null,
        },
        documents: {
          items: [],
          currentDocument: null,
          isError: true,
          isLoading: false,
          errorMessage: 'Failed to fetch documents',
        },
      });

      renderWithProviders({ store });

      // Wait for component to render and check for error message
      await waitFor(() => {
        expect(
          screen.getByText(/failed to fetch documents/i),
        ).toBeInTheDocument();
      });
    });

    test('shows empty state when no documents', async () => {
      mockApiGet.mockResolvedValue({ data: [] });

      const store = createMockStore({
        documents: {
          items: [],
          currentDocument: null,
          isLoading: false,
          isError: false,
          errorMessage: null,
        },
      });

      renderWithProviders({ store });

      await waitFor(() => {
        expect(
          screen.getByText(/no documents in this workspace/i),
        ).toBeInTheDocument();
        expect(
          screen.getByText(/create your first document/i),
        ).toBeInTheDocument();
      });
    });

    test('shows document list when documents exist', async () => {
      const mockDocuments = [
        {
          _id: 'doc-1',
          title: 'Document 1',
          wordCount: 150,
          updatedAt: '2026-01-15T10:00:00.000Z',
          createdAt: '2026-01-15T10:00:00.000Z',
          isPinned: false,
        },
        {
          _id: 'doc-2',
          title: 'Document 2',
          wordCount: 250,
          updatedAt: '2026-01-16T10:00:00.000Z',
          createdAt: '2026-01-16T10:00:00.000Z',
          isPinned: false,
        },
      ];

      mockApiGet.mockResolvedValue({ data: mockDocuments });

      const store = createMockStore();
      renderWithProviders({ store });

      await waitFor(() => {
        expect(screen.getByText('Document 1')).toBeInTheDocument();
        expect(screen.getByText('Document 2')).toBeInTheDocument();
        expect(screen.getByText('150 words')).toBeInTheDocument();
        expect(screen.getByText('250 words')).toBeInTheDocument();
      });
    });
  });

  describe('Header and navigation', () => {
    test('shows workspace name and description', async () => {
      const mockWorkspace = {
        _id: 'workspace-123',
        name: 'My Project',
        description: 'Project description',
        createdAt: '2026-01-01T00:00:00.000Z',
        ownerId: 'user-1',
        updatedAt: '2026-01-01T00:00:00.000Z',
        documentCount: 1,
      };

      const store = createMockStore({
        workspaces: {
          items: [],
          selectedWorkspace: mockWorkspace,
          isLoading: false,
          isError: false,
          errorMessage: null,
        },
      });

      renderWithProviders({ store });

      expect(screen.getByText('My Project')).toBeInTheDocument();
      expect(screen.getByText('Project description')).toBeInTheDocument();
    });

    test('shows default workspace name when no workspace loaded', () => {
      const store = createMockStore({
        workspaces: {
          items: [],
          selectedWorkspace: null,
          isLoading: false,
          isError: false,
          errorMessage: null,
        },
      });

      renderWithProviders({ store });

      expect(screen.getByText('Workspace')).toBeInTheDocument();
    });

    test('back button navigates to /workspaces', async () => {
      const user = userEvent.setup();
      const store = createMockStore();

      renderWithProviders({ store });

      const backButton = screen.getByRole('button', {
        name: /back to workspaces/i,
      });
      await user.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/workspaces');
    });

    test('shows new document button', () => {
      const store = createMockStore();
      renderWithProviders({ store });

      const newButtons = screen.getAllByRole('button', {
        name: /new document/i,
      });
      expect(newButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Create document', () => {
    test('creates document and navigates to it', async () => {
      const user = userEvent.setup();
      const mockNewDocument = {
        _id: 'new-doc-123',
        title: 'New Document',
        wordCount: 0,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        isPinned: false,
      };

      mockApiPost.mockResolvedValue({ data: mockNewDocument });

      const store = createMockStore();
      renderWithProviders({ store });

      const newButtons = screen.getAllByRole('button', {
        name: /new document/i,
      });
      await user.click(newButtons[0]);

      await waitFor(() => {
        expect(mockApiPost).toHaveBeenCalledWith('/documents', {
          workspaceId: 'workspace-123',
        });
        expect(mockNavigate).toHaveBeenCalledWith('/documents/new-doc-123');
      });
    });

    test('new document button is disabled when loading', () => {
      const store = createMockStore({
        documents: {
          items: [],
          currentDocument: null,
          isLoading: true,
          isError: false,
          errorMessage: null,
        },
      });

      renderWithProviders({ store });

      const newButtons = screen.getAllByRole('button', {
        name: /new document/i,
      });
      newButtons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Delete document', () => {
    test('opens delete modal when delete button clicked', async () => {
      const user = userEvent.setup();
      const mockDocuments = [
        {
          _id: 'doc-1',
          title: 'Document to Delete',
          wordCount: 100,
          updatedAt: '2026-01-15T00:00:00.000Z',
          createdAt: '2026-01-15T00:00:00.000Z',
          isPinned: false,
        },
      ];

      mockApiGet.mockResolvedValue({ data: mockDocuments });

      const store = createMockStore();
      renderWithProviders({ store });

      await waitFor(() => {
        expect(screen.getByText('Document to Delete')).toBeInTheDocument();
      });

      // Click delete button (SVG icon button)
      const deleteButton = screen.getByTitle('Delete document');
      await user.click(deleteButton);

      // Modal should appear
      await waitFor(() => {
        expect(screen.getByText(/delete.*document.*\?/i)).toBeInTheDocument();
      });
    });

    test('cancels delete when cancel clicked', async () => {
      const user = userEvent.setup();
      const mockDocuments = [
        {
          _id: 'doc-1',
          title: 'Document to Delete',
          wordCount: 100,
          updatedAt: '2026-01-15T00:00:00.000Z',
          createdAt: '2026-01-15T00:00:00.000Z',
          isPinned: false,
        },
      ];

      mockApiGet.mockResolvedValue({ data: mockDocuments });

      const store = createMockStore();
      renderWithProviders({ store });

      await waitFor(() => {
        expect(screen.getByText('Document to Delete')).toBeInTheDocument();
      });

      // Open modal
      const deleteButton = screen.getByTitle('Delete document');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/delete.*document.*\?/i)).toBeInTheDocument();
      });

      // Cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Modal should close
      await waitFor(() => {
        expect(
          screen.queryByText(/are you sure you want to delete/i),
        ).not.toBeInTheDocument();
      });
    });

    test('deletes document when confirmed', async () => {
      const user = userEvent.setup();
      mockApiDelete.mockResolvedValue({ data: { message: 'Deleted' } });

      const mockDocuments = [
        {
          _id: 'doc-1',
          title: 'Document to Delete',
          wordCount: 100,
          updatedAt: '2026-01-15T00:00:00.000Z',
          createdAt: '2026-01-15T00:00:00.000Z',
          isPinned: false,
        },
      ];

      mockApiGet.mockResolvedValue({ data: mockDocuments });

      const store = createMockStore();
      renderWithProviders({ store });

      await waitFor(() => {
        expect(screen.getByText('Document to Delete')).toBeInTheDocument();
      });

      // Open modal
      const deleteButton = screen.getByTitle('Delete document');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/delete.*document.*\?/i)).toBeInTheDocument();
      });

      // Confirm delete
      const confirmButton = screen
        .getAllByRole('button', {
          name: /delete/i,
        })
        .find(
          (btn) =>
            btn.textContent?.includes('Delete Document') &&
            !btn.textContent?.includes('?'),
        );
      if (confirmButton) await user.click(confirmButton);

      await waitFor(() => {
        expect(mockApiDelete).toHaveBeenCalledWith('/documents/doc-1');
      });
    });
  });

  describe('Document interactions', () => {
    test('clicking document navigates to it', async () => {
      const user = userEvent.setup();
      const mockDocuments = [
        {
          _id: 'doc-1',
          title: 'Test Document',
          wordCount: 100,
          updatedAt: '2026-01-15T00:00:00.000Z',
          createdAt: '2026-01-15T00:00:00.000Z',
          isPinned: false,
        },
      ];

      mockApiGet.mockResolvedValue({ data: mockDocuments });

      const store = createMockStore();
      renderWithProviders({ store });

      await waitFor(() => {
        expect(screen.getByText('Test Document')).toBeInTheDocument();
      });

      // Click document (not the delete button)
      const documentTitle = screen.getByText('Test Document');
      await user.click(documentTitle);

      expect(mockNavigate).toHaveBeenCalledWith('/documents/doc-1');
    });

    test('delete button does not trigger document navigation', async () => {
      const user = userEvent.setup();
      const mockDocuments = [
        {
          _id: 'doc-1',
          title: 'Test Document',
          wordCount: 100,
          updatedAt: '2026-01-15T00:00:00.000Z',
          createdAt: '2026-01-15T00:00:00.000Z',
          isPinned: false,
        },
      ];

      mockApiGet.mockResolvedValue({ data: mockDocuments });

      const store = createMockStore();
      renderWithProviders({ store });

      await waitFor(() => {
        expect(screen.getByText('Test Document')).toBeInTheDocument();
      });

      // Click delete button
      const deleteButton = screen.getByTitle('Delete document');
      await user.click(deleteButton);

      // Should NOT navigate to document
      expect(mockNavigate).not.toHaveBeenCalledWith('/documents/doc-1');
    });

    test('displays word count and formatted date', async () => {
      const mockDocuments = [
        {
          _id: 'doc-1',
          title: 'Test Document',
          wordCount: 42,
          updatedAt: '2026-01-15T10:30:00.000Z',
          createdAt: '2026-01-15T10:30:00.000Z',
          isPinned: false,
        },
      ];

      mockApiGet.mockResolvedValue({ data: mockDocuments });

      const store = createMockStore();
      renderWithProviders({ store });

      await waitFor(() => {
        expect(screen.getByText('42 words')).toBeInTheDocument();
        // Date format may vary by locale, check for year and month
        expect(screen.getByText(/Jan|2026|15/)).toBeInTheDocument();
      });
    });
  });
});
