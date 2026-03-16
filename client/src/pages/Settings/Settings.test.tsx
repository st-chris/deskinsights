import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { vi, type Mock, beforeEach, afterEach } from 'vitest';

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
import Settings from './Settings';
import workspaceReducer from '../../reducers/workspace/workspace';
import api from '../../services/api';

const mockApiGet = api.get as Mock;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Full navigation mocks for export download
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost',
    assign: vi.fn(),
    reload: vi.fn(),
  },
  writable: true,
});

// Mock <a> downloads
const mockAnchorClick = vi.fn();
Object.defineProperty(HTMLAnchorElement.prototype, 'click', {
  value: mockAnchorClick,
  writable: true,
});

// Mock URL methods
window.URL.createObjectURL = vi.fn(() => 'mock-url');
window.URL.revokeObjectURL = vi.fn();

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
  return render(<Provider store={store}>{component}</Provider>);
};

describe('Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    document.documentElement.removeAttribute('data-theme');
    // Default mock for getWorkspaces
    mockApiGet.mockResolvedValue({ data: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Page rendering', () => {
    test('renders settings page with correct title', () => {
      renderWithProviders(<Settings />);

      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(
        screen.getByText('Manage your preferences and data'),
      ).toBeInTheDocument();
    });

    test('renders all main sections', () => {
      renderWithProviders(<Settings />);

      expect(screen.getByText('Appearance')).toBeInTheDocument();
      expect(screen.getByText('Preferences')).toBeInTheDocument();
      expect(screen.getByText('Data Management')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
    });

    test('displays theme toggle section', () => {
      renderWithProviders(<Settings />);

      expect(screen.getByText('Theme')).toBeInTheDocument();
      expect(
        screen.getByText('Choose between light and dark mode'),
      ).toBeInTheDocument();
    });

    test('displays default landing page section', () => {
      renderWithProviders(<Settings />);

      expect(screen.getByText('Default Landing Page')).toBeInTheDocument();
      expect(
        screen.getByText(/choose which page to see when you open/i),
      ).toBeInTheDocument();
    });
  });

  describe('Theme toggle', () => {
    test('initializes with light theme by default', () => {
      renderWithProviders(<Settings />);

      expect(document.documentElement.getAttribute('data-theme')).toBeNull();
    });

    test('loads saved dark theme from localStorage', async () => {
      localStorageMock.getItem.mockReturnValue('dark');

      renderWithProviders(<Settings />);

      await waitFor(() => {
        expect(document.documentElement.getAttribute('data-theme')).toBe(
          'dark',
        );
      });
    });

    test('toggles theme when clicking toggle button', async () => {
      renderWithProviders(<Settings />);

      const allButtons = screen.getAllByRole('button');
      const toggleButton = allButtons.find(
        (btn) =>
          btn.className.includes('rounded-full') &&
          btn.className.includes('transition-colors'),
      );

      if (toggleButton) {
        fireEvent.click(toggleButton);

        await waitFor(() => {
          expect(localStorageMock.setItem).toHaveBeenCalledWith(
            'theme',
            'dark',
          );
        });
      }
    });

    test('toggles back to light theme from dark', async () => {
      localStorageMock.getItem.mockReturnValue('dark');

      renderWithProviders(<Settings />);

      await waitFor(() => {
        expect(document.documentElement.getAttribute('data-theme')).toBe(
          'dark',
        );
      });

      const allButtons = screen.getAllByRole('button');
      const toggleButton = allButtons.find(
        (btn) =>
          btn.className.includes('rounded-full') &&
          btn.className.includes('transition-colors'),
      );

      if (toggleButton) {
        fireEvent.click(toggleButton);

        await waitFor(() => {
          expect(localStorageMock.setItem).toHaveBeenCalledWith(
            'theme',
            'light',
          );
        });
      }
    });

    test('displays theme labels', () => {
      renderWithProviders(<Settings />);

      expect(screen.getByText(/☀️ Light/i)).toBeInTheDocument();
      expect(screen.getByText(/🌙 Dark/i)).toBeInTheDocument();
    });
  });

  describe('Default view preference', () => {
    test('displays both preference options', () => {
      renderWithProviders(<Settings />);

      expect(
        screen.getByRole('button', { name: /📊 Dashboard/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /📋 Workspaces/i }),
      ).toBeInTheDocument();
    });

    test('switches to workspaces view when clicking button', async () => {
      renderWithProviders(<Settings />);

      const workspacesButton = screen.getByRole('button', {
        name: /📋 Workspaces/i,
      });
      fireEvent.click(workspacesButton);

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'defaultView',
          'workspaces',
        );
      });
    });

    test('switches to dashboard view when clicking button', async () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'defaultView') return 'workspaces';
        return null;
      });

      renderWithProviders(<Settings />);

      const dashboardButton = screen.getByRole('button', {
        name: /📊 Dashboard/i,
      });
      fireEvent.click(dashboardButton);

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'defaultView',
          'dashboard',
        );
      });
    });
  });

  describe('Data export', () => {
    test('shows correct workspace count in export description', () => {
      const mockWorkspaces = [
        {
          _id: '1',
          name: 'WS1',
          createdAt: '2026-02-01T00:00:00.000Z',
        },
        {
          _id: '2',
          name: 'WS2',
          createdAt: '2026-02-01T00:00:00.000Z',
        },
      ];

      const store = createMockStore({ items: mockWorkspaces });
      renderWithProviders(<Settings />, { store });

      expect(screen.getByText(/2 workspaces/i)).toBeInTheDocument();
    });

    test('shows singular workspace when count is 1', () => {
      const mockWorkspaces = [
        {
          _id: '1',
          name: 'WS1',
          createdAt: '2026-02-01T00:00:00.000Z',
        },
      ];

      const store = createMockStore({ items: mockWorkspaces });
      renderWithProviders(<Settings />, { store });

      expect(screen.getByText(/1 workspace\)/i)).toBeInTheDocument();
    });

    test('shows zero workspaces when empty', () => {
      const store = createMockStore({ items: [] });
      renderWithProviders(<Settings />, { store });

      expect(screen.getByText(/0 workspaces/i)).toBeInTheDocument();
    });

    test('disables export button when no workspaces', () => {
      const store = createMockStore({ items: [] });
      renderWithProviders(<Settings />, { store });

      const exportButton = screen.getByRole('button', { name: /📤 export/i });
      expect(exportButton).toBeDisabled();
    });

    test('enables export button when workspaces exist', () => {
      const mockWorkspaces = [
        {
          _id: '1',
          name: 'WS1',
          createdAt: '2026-02-01T00:00:00.000Z',
        },
      ];

      const store = createMockStore({ items: mockWorkspaces });
      renderWithProviders(<Settings />, { store });

      const exportButton = screen.getByRole('button', { name: /📤 export/i });
      expect(exportButton).not.toBeDisabled();
    });

    test('calls export functionality when clicking export button', async () => {
      const mockWorkspaces = [
        {
          _id: '1',
          name: 'Test Workspace',
          description: 'Test description',
          createdAt: '2026-02-01T00:00:00.000Z',
        },
      ];

      const store = createMockStore({ items: mockWorkspaces });
      renderWithProviders(<Settings />, { store });

      const exportButton = screen.getByRole('button', { name: /📤 export/i });
      fireEvent.click(exportButton);
      await waitFor(() =>
        expect(window.URL.createObjectURL).toHaveBeenCalled(),
      );
    });
  });

  describe('About section', () => {
    test('displays app name', () => {
      renderWithProviders(<Settings />);

      expect(screen.getByText('DeskInsights')).toBeInTheDocument();
    });

    test('displays version number', () => {
      renderWithProviders(<Settings />);

      expect(screen.getByText('Version 1.0.0')).toBeInTheDocument();
    });

    test('displays app description', () => {
      renderWithProviders(<Settings />);

      expect(
        screen.getByText(/workspace management application/i),
      ).toBeInTheDocument();
    });
  });

  describe('Section headers', () => {
    test('displays Export Your Data heading', () => {
      renderWithProviders(<Settings />);

      expect(screen.getByText('Export Your Data')).toBeInTheDocument();
    });

    test('displays export description', () => {
      renderWithProviders(<Settings />);

      expect(
        screen.getByText(/download all your workspaces as json/i),
      ).toBeInTheDocument();
    });
  });
});
