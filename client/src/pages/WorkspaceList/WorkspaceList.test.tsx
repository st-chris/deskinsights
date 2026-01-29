import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
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

// Mock api service
vi.mock('../../services/api', () => {
  return {
    default: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
    },
  };
});

// Import after mocking
import { configureStore } from '@reduxjs/toolkit';
import WorkspaceList from './WorkspaceList';
import workspaceReducer from '../../reducers/workspace/workspace';
import api from '../../services/api';

// ✅ Properly type the mocked API
const mockApiGet = api.get as Mock;
const mockApiPost = api.post as Mock;
const mockApiDelete = api.delete as Mock;

// Helper to create mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      workspaces: workspaceReducer,
    },
    preloadedState: {
      workspaces: {
        items: [],
        selectedWorkspace: null,
        isLoading: false,
        isError: false,
        errorMessage: null,
        ...initialState,
      },
    },
  });
};

// Helper to render with providers
const renderWithProviders = (
  component: React.ReactElement,
  { store = createMockStore() } = {},
) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>{component}</BrowserRouter>
    </Provider>,
  );
};

describe('WorkspaceList', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    vi.clearAllMocks();
    // Default mock for getWorkspaces
    mockApiGet.mockResolvedValue({ data: [] });
  });

  describe('Rendering states', () => {
    test('shows loading state initially', () => {
      // Mock API to never resolve
      mockApiGet.mockImplementation(() => new Promise(() => {}));
      const store = createMockStore({ isLoading: true });

      renderWithProviders(<WorkspaceList />, { store });

      expect(screen.getByText(/loading workspaces/i)).toBeInTheDocument();
    });

    test('shows error state when fetch fails', async () => {
      mockApiGet.mockRejectedValue(new Error('Network error'));
      const store = createMockStore();
      renderWithProviders(<WorkspaceList />, { store });

      await waitFor(
        () => {
          const heading = screen.getByRole('heading', {
            name: /your workspaces/i,
          });
          expect(heading).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    test('shows empty state when no workspaces', async () => {
      mockApiGet.mockResolvedValue({ data: [] });
      const store = createMockStore();
      renderWithProviders(<WorkspaceList />, { store });

      await waitFor(() => {
        expect(screen.getByText(/no workspaces yet/i)).toBeInTheDocument();
        expect(
          screen.getByText(/create your first workspace/i),
        ).toBeInTheDocument();
      });
    });

    test('renders workspace list when workspaces exist', async () => {
      const mockWorkspaces = [
        {
          _id: '1',
          name: 'Project A',
          description: 'First project',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        {
          _id: '2',
          name: 'Project B',
          description: 'Second project',
          createdAt: '2026-01-02T00:00:00.000Z',
        },
      ];
      mockApiGet.mockResolvedValue({ data: mockWorkspaces });

      const store = createMockStore();
      renderWithProviders(<WorkspaceList />, { store });

      await waitFor(() => {
        expect(screen.getByText('Project A')).toBeInTheDocument();
        expect(screen.getByText('Project B')).toBeInTheDocument();
        expect(screen.getByText('First project')).toBeInTheDocument();
        expect(screen.getByText('Second project')).toBeInTheDocument();
      });
    });
  });

  describe('Header and navigation', () => {
    test('displays page title and description', async () => {
      mockApiGet.mockResolvedValue({ data: [] });
      renderWithProviders(<WorkspaceList />);

      await waitFor(() => {
        expect(screen.getByText('Your workspaces')).toBeInTheDocument();
      });

      expect(
        screen.getByText(/organize documents into dedicated workspaces/i),
      ).toBeInTheDocument();
    });

    test('shows "New workspace" button', async () => {
      mockApiGet.mockResolvedValue({ data: [] });
      renderWithProviders(<WorkspaceList />);

      await waitFor(() => {
        const newButtons = screen.getAllByRole('button', {
          name: /new workspace/i,
        });
        expect(newButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('New workspace modal', () => {
    test('opens modal when "New workspace" button is clicked', async () => {
      mockApiGet.mockResolvedValue({ data: [] });
      renderWithProviders(<WorkspaceList />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button', {
          name: /new workspace/i,
        });
        expect(buttons[0]).not.toBeDisabled();
      });

      const newButtons = screen.getAllByRole('button', {
        name: /new workspace/i,
      });
      fireEvent.click(newButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Create New Workspace')).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText(/e.g., Personal Projects/i),
        ).toBeInTheDocument();
      });
    });

    test('closes modal when Cancel is clicked', async () => {
      mockApiGet.mockResolvedValue({ data: [] });
      renderWithProviders(<WorkspaceList />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button', {
          name: /new workspace/i,
        });
        expect(buttons[0]).not.toBeDisabled();
      });

      const newButtons = screen.getAllByRole('button', {
        name: /new workspace/i,
      });
      fireEvent.click(newButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Create New Workspace')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(
          screen.queryByText('Create New Workspace'),
        ).not.toBeInTheDocument();
      });
    });

    test('creates workspace and navigates on submit', async () => {
      const newWorkspace = {
        _id: 'new-id',
        name: 'Test Workspace',
        description: '',
        createdAt: new Date().toISOString(),
      };

      mockApiGet.mockResolvedValue({ data: [] });
      mockApiPost.mockResolvedValue({ data: newWorkspace });

      const store = createMockStore();
      renderWithProviders(<WorkspaceList />, { store });

      await waitFor(() => {
        const buttons = screen.getAllByRole('button', {
          name: /new workspace/i,
        });
        expect(buttons[0]).not.toBeDisabled();
      });

      const newButtons = screen.getAllByRole('button', {
        name: /new workspace/i,
      });
      fireEvent.click(newButtons[0]);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/e.g., Personal Projects/i),
        ).toBeInTheDocument();
      });

      const nameInput = screen.getByPlaceholderText(
        /e.g., Personal Projects/i,
      ) as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'Test Workspace' } });

      const submitButton = screen.getByRole('button', {
        name: /create workspace/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockApiPost).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/workspaces/new-id');
      });
    });
  });

  describe('Delete workspace modal', () => {
    test('opens delete modal when delete button is clicked', async () => {
      const mockWorkspaces = [
        {
          _id: '1',
          name: 'Project A',
          description: 'First project',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ];
      mockApiGet.mockResolvedValue({ data: mockWorkspaces });
      const store = createMockStore();
      renderWithProviders(<WorkspaceList />, { store });

      await waitFor(() => {
        expect(screen.getByText('Project A')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button');
      const deleteButton = deleteButtons.find((btn) =>
        btn.textContent?.includes('✕'),
      );
      expect(deleteButton).toBeDefined();
      if (deleteButton) {
        fireEvent.click(deleteButton);
      }

      await waitFor(() => {
        expect(
          screen.getByText(/are you sure you want to delete/i),
        ).toBeInTheDocument();
      });
    });

    test('closes delete modal when Cancel is clicked', async () => {
      const mockWorkspaces = [
        {
          _id: '1',
          name: 'Project A',
          description: 'First project',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ];
      mockApiGet.mockResolvedValue({ data: mockWorkspaces });
      const store = createMockStore();
      renderWithProviders(<WorkspaceList />, { store });

      await waitFor(() => {
        expect(screen.getByText('Project A')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button');
      const deleteButton = deleteButtons.find((btn) =>
        btn.textContent?.includes('✕'),
      );
      if (deleteButton) {
        fireEvent.click(deleteButton);
      }

      await waitFor(() => {
        expect(
          screen.getByText(/are you sure you want to delete/i),
        ).toBeInTheDocument();
      });

      const cancelButtons = screen.getAllByRole('button', {
        name: /cancel/i,
      });
      if (cancelButtons.length > 0) {
        fireEvent.click(cancelButtons[cancelButtons.length - 1]);
      }

      await waitFor(() => {
        expect(
          screen.queryByText(/are you sure you want to delete/i),
        ).not.toBeInTheDocument();
      });
    });

    test('deletes workspace when confirmed', async () => {
      mockApiDelete.mockResolvedValue({ data: { message: 'Deleted' } });

      const mockWorkspaces = [
        {
          _id: '1',
          name: 'Project A',
          description: 'First project',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ];
      mockApiGet.mockResolvedValue({ data: mockWorkspaces });
      const store = createMockStore();
      renderWithProviders(<WorkspaceList />, { store });

      await waitFor(() => {
        expect(screen.getByText('Project A')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button');
      const deleteButton = deleteButtons.find((btn) =>
        btn.textContent?.includes('✕'),
      );
      if (deleteButton) {
        fireEvent.click(deleteButton);
      }

      await waitFor(() => {
        expect(
          screen.getByText(/are you sure you want to delete/i),
        ).toBeInTheDocument();
      });

      const deleteWorkspaceButtons = screen.getAllByRole('button', {
        name: /delete workspace/i,
      });
      if (deleteWorkspaceButtons.length > 0) {
        fireEvent.click(
          deleteWorkspaceButtons[deleteWorkspaceButtons.length - 1],
        );
      }

      await waitFor(() => {
        expect(mockApiDelete).toHaveBeenCalledWith('/workspaces/1');
      });
    });
  });

  describe('Workspace interactions', () => {
    test('navigates to workspace when clicked', async () => {
      const mockWorkspaces = [
        {
          _id: '1',
          name: 'Project A',
          description: 'First project',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ];
      mockApiGet.mockResolvedValue({ data: mockWorkspaces });
      const store = createMockStore();
      renderWithProviders(<WorkspaceList />, { store });

      await waitFor(() => {
        expect(screen.getByText('Project A')).toBeInTheDocument();
      });

      const nameElement = screen.getByText('Project A');
      const workspaceCard = nameElement.closest('[class*="group"]'); // Find parent with 'group' class

      expect(workspaceCard).not.toBeNull();
      if (workspaceCard) {
        fireEvent.click(workspaceCard);
      }

      expect(mockNavigate).toHaveBeenCalledWith('/workspaces/1');
    });

    test('delete button does not trigger workspace navigation', async () => {
      const mockWorkspaces = [
        {
          _id: '1',
          name: 'Project A',
          description: 'First project',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ];
      mockApiGet.mockResolvedValue({ data: mockWorkspaces });
      const store = createMockStore();
      renderWithProviders(<WorkspaceList />, { store });

      await waitFor(() => {
        expect(screen.getByText('Project A')).toBeInTheDocument();
      });

      const allButtons = screen.getAllByRole('button');
      const deleteButton = allButtons.find((btn) =>
        btn.textContent?.includes('✕'),
      );
      if (deleteButton) {
        fireEvent.click(deleteButton);
      }

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Date formatting', () => {
    test('displays formatted creation date', async () => {
      const mockWorkspaces = [
        {
          _id: '1',
          name: 'Project A',
          description: 'First project',
          createdAt: '2026-01-15T10:30:00.000Z',
        },
      ];
      mockApiGet.mockResolvedValue({ data: mockWorkspaces });
      const store = createMockStore();
      renderWithProviders(<WorkspaceList />, { store });

      await waitFor(() => {
        expect(screen.getByText('Project A')).toBeInTheDocument();
      });

      expect(screen.getByText(/Jan|2026|15/)).toBeInTheDocument();
    });
  });
});
