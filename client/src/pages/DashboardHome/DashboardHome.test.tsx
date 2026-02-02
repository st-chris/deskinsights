import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
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
import DashboardHome from './DashboardHome';
import workspaceReducer from '../../reducers/workspace/workspace';
import api from '../../services/api';

const mockApiGet = api.get as Mock;
const mockApiPost = api.post as Mock;

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

describe('DashboardHome', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    vi.clearAllMocks();
    // Default mock for getWorkspaces
    mockApiGet.mockResolvedValue({ data: [] });
  });

  describe('Greeting display', () => {
    test('shows morning greeting when hour is before 12', async () => {
      vi.spyOn(Date.prototype, 'getHours').mockReturnValue(10);
      mockApiGet.mockResolvedValue({ data: [] });

      renderWithProviders(<DashboardHome />);

      await waitFor(() => {
        expect(screen.getByText('Good morning!')).toBeInTheDocument();
      });
    });

    test('shows afternoon greeting when hour is between 12 and 18', async () => {
      vi.spyOn(Date.prototype, 'getHours').mockReturnValue(15);
      mockApiGet.mockResolvedValue({ data: [] });

      renderWithProviders(<DashboardHome />);

      await waitFor(() => {
        expect(screen.getByText('Good afternoon!')).toBeInTheDocument();
      });
    });

    test('shows evening greeting when hour is after 18', async () => {
      vi.spyOn(Date.prototype, 'getHours').mockReturnValue(20);
      mockApiGet.mockResolvedValue({ data: [] });

      renderWithProviders(<DashboardHome />);

      await waitFor(() => {
        expect(screen.getByText('Good evening!')).toBeInTheDocument();
      });
    });
  });

  describe('Rendering states', () => {
    test('shows loading state initially', () => {
      mockApiGet.mockImplementation(() => new Promise(() => {}));
      const store = createMockStore({ isLoading: true });

      renderWithProviders(<DashboardHome />, { store });

      expect(screen.getByText(/loading workspaces/i)).toBeInTheDocument();
    });

    test('shows error state when fetch fails', async () => {
      mockApiGet.mockRejectedValue(new Error('Network error'));
      const store = createMockStore({ isError: true });

      renderWithProviders(<DashboardHome />, { store });

      await waitFor(() => {
        expect(
          screen.getByText(/failed to load workspaces/i),
        ).toBeInTheDocument();
      });
    });

    test('shows empty state when no workspaces', async () => {
      mockApiGet.mockResolvedValue({ data: [] });
      const store = createMockStore();

      renderWithProviders(<DashboardHome />, { store });

      await waitFor(() => {
        expect(screen.getByText(/no workspaces yet/i)).toBeInTheDocument();
        expect(
          screen.getByText(/create your first workspace to start organizing/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Stats display', () => {
    test('displays correct total workspace count', async () => {
      const mockWorkspaces = [
        {
          _id: '1',
          name: 'WS1',
          description: 'Desc1',
          createdAt: '2026-02-01T00:00:00.000Z',
        },
        {
          _id: '2',
          name: 'WS2',
          description: 'Desc2',
          createdAt: '2026-02-01T00:00:00.000Z',
        },
        {
          _id: '3',
          name: 'WS3',
          description: 'Desc3',
          createdAt: '2026-02-01T00:00:00.000Z',
        },
      ];
      mockApiGet.mockResolvedValue({ data: mockWorkspaces });
      const store = createMockStore();

      renderWithProviders(<DashboardHome />, { store });

      await waitFor(() => {
        const totalWorkspacesStat = screen.getByTestId('stat-total-workspaces');
        expect(within(totalWorkspacesStat).getByText('3')).toBeInTheDocument();
        expect(
          within(totalWorkspacesStat).getByText('Total Workspaces'),
        ).toBeInTheDocument();
      });
    });

    test('calculates this week count correctly', async () => {
      const today = new Date();
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 3);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 10);

      const mockWorkspaces = [
        {
          _id: '1',
          name: 'Recent',
          createdAt: today.toISOString(),
        },
        {
          _id: '2',
          name: 'Last week',
          createdAt: lastWeek.toISOString(),
        },
        {
          _id: '3',
          name: 'Old',
          createdAt: twoWeeksAgo.toISOString(),
        },
      ];
      mockApiGet.mockResolvedValue({ data: mockWorkspaces });
      const store = createMockStore();

      renderWithProviders(<DashboardHome />, { store });

      await waitFor(() => {
        expect(screen.getByText('+2')).toBeInTheDocument();
        expect(screen.getByText('This Week')).toBeInTheDocument();
      });
    });

    test('displays recently active count', async () => {
      mockApiGet.mockResolvedValue({ data: [] });
      const store = createMockStore();

      renderWithProviders(<DashboardHome />, { store });

      await waitFor(() => {
        expect(screen.getByText('Recently Active')).toBeInTheDocument();
      });
    });
  });

  describe('Recent workspaces', () => {
    test('displays up to 3 most recent workspaces', async () => {
      const mockWorkspaces = [
        {
          _id: '1',
          name: 'WS1',
          description: 'Desc1',
          createdAt: '2026-02-01T00:00:00.000Z',
        },
        {
          _id: '2',
          name: 'WS2',
          description: 'Desc2',
          createdAt: '2026-01-30T00:00:00.000Z',
        },
        {
          _id: '3',
          name: 'WS3',
          description: 'Desc3',
          createdAt: '2026-01-28T00:00:00.000Z',
        },
        {
          _id: '4',
          name: 'WS4',
          description: 'Desc4',
          createdAt: '2026-01-25T00:00:00.000Z',
        },
      ];
      mockApiGet.mockResolvedValue({ data: mockWorkspaces });
      const store = createMockStore();

      renderWithProviders(<DashboardHome />, { store });

      await waitFor(() => {
        expect(screen.getByText('WS1')).toBeInTheDocument();
        expect(screen.getByText('WS2')).toBeInTheDocument();
        expect(screen.getByText('WS3')).toBeInTheDocument();
        expect(screen.queryByText('WS4')).not.toBeInTheDocument();
      });
    });

    test('shows View all button when workspaces exist', async () => {
      const mockWorkspaces = [
        {
          _id: '1',
          name: 'WS1',
          createdAt: '2026-02-01T00:00:00.000Z',
        },
      ];
      mockApiGet.mockResolvedValue({ data: mockWorkspaces });
      const store = createMockStore();

      renderWithProviders(<DashboardHome />, { store });

      await waitFor(() => {
        expect(screen.getByText('View all →')).toBeInTheDocument();
      });
    });

    test('navigates to workspace when card is clicked', async () => {
      const mockWorkspaces = [
        {
          _id: 'ws123',
          name: 'Test Workspace',
          description: 'Test desc',
          createdAt: '2026-02-01T00:00:00.000Z',
        },
      ];
      mockApiGet.mockResolvedValue({ data: mockWorkspaces });
      const store = createMockStore();

      renderWithProviders(<DashboardHome />, { store });

      await waitFor(() => {
        expect(screen.getByText('Test Workspace')).toBeInTheDocument();
      });

      const nameElement = screen.getByText('Test Workspace');
      const workspaceCard = nameElement.closest('[class*="group"]');

      expect(workspaceCard).not.toBeNull();
      if (workspaceCard) {
        fireEvent.click(workspaceCard);
      }

      expect(mockNavigate).toHaveBeenCalledWith('/workspaces/ws123');
    });

    test('displays workspace description when present', async () => {
      const mockWorkspaces = [
        {
          _id: '1',
          name: 'WS1',
          description: 'Custom description here',
          createdAt: '2026-02-01T00:00:00.000Z',
        },
      ];
      mockApiGet.mockResolvedValue({ data: mockWorkspaces });
      const store = createMockStore();

      renderWithProviders(<DashboardHome />, { store });

      await waitFor(() => {
        expect(screen.getByText('Custom description here')).toBeInTheDocument();
      });
    });
  });

  describe('Header and buttons', () => {
    test('displays page subtitle', async () => {
      mockApiGet.mockResolvedValue({ data: [] });

      renderWithProviders(<DashboardHome />);

      await waitFor(() => {
        expect(
          screen.getByText(/here's what's happening with your workspaces/i),
        ).toBeInTheDocument();
      });
    });

    test('shows New workspace button', async () => {
      mockApiGet.mockResolvedValue({ data: [] });

      renderWithProviders(<DashboardHome />);

      await waitFor(() => {
        const newButtons = screen.getAllByRole('button', {
          name: /new workspace/i,
        });
        expect(newButtons.length).toBeGreaterThan(0);
      });
    });

    test('disables New workspace button when loading', () => {
      const store = createMockStore({ isLoading: true });

      renderWithProviders(<DashboardHome />, { store });

      const buttons = screen.getAllByRole('button', {
        name: /new workspace/i,
      });
      expect(buttons[0]).toBeDisabled();
    });
  });

  describe('Quick actions', () => {
    test('renders all quick action buttons', async () => {
      mockApiGet.mockResolvedValue({ data: [] });

      renderWithProviders(<DashboardHome />);

      await waitFor(() => {
        expect(screen.getByText('View All Workspaces')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });
    });

    test('navigates to workspaces when View All is clicked', async () => {
      mockApiGet.mockResolvedValue({ data: [] });

      renderWithProviders(<DashboardHome />);

      await waitFor(() => {
        expect(screen.getByText('View All Workspaces')).toBeInTheDocument();
      });

      const viewAllButton = screen.getByText('View All Workspaces');
      fireEvent.click(viewAllButton);

      expect(mockNavigate).toHaveBeenCalledWith('/workspaces');
    });

    test('navigates to settings when Settings is clicked', async () => {
      mockApiGet.mockResolvedValue({ data: [] });

      renderWithProviders(<DashboardHome />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      const settingsButton = screen.getByText('Settings');
      fireEvent.click(settingsButton);

      expect(mockNavigate).toHaveBeenCalledWith('/settings');
    });
  });

  describe('New workspace modal', () => {
    test('opens modal when New workspace button is clicked', async () => {
      mockApiGet.mockResolvedValue({ data: [] });

      renderWithProviders(<DashboardHome />);

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
      renderWithProviders(<DashboardHome />, { store });

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

      // Get all "Create Workspace" buttons and select the last one (modal submit)
      const createButtons = screen.getAllByRole('button', {
        name: /create workspace/i,
      });
      const submitButton = createButtons[createButtons.length - 1];
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockApiPost).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/workspaces/new-id');
      });
    });
  });

  describe('Date formatting', () => {
    test('displays formatted updated date', async () => {
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

      renderWithProviders(<DashboardHome />, { store });

      await waitFor(() => {
        expect(screen.getByText('Project A')).toBeInTheDocument();
      });

      expect(screen.getByText(/Updated/)).toBeInTheDocument();
      expect(screen.getByText(/Jan|2026|15/)).toBeInTheDocument();
    });
  });
});
