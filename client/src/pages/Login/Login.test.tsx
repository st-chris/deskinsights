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

// Mock authService
vi.mock('../../services/auth', () => ({
  default: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
    getTokenFromLocalStorage: vi.fn(() => null),
    setTokenToLocalStorage: vi.fn(),
    removeTokenFromLocalStorage: vi.fn(),
  },
}));

// Mock userService
vi.mock('../../services/user', () => ({
  default: {
    register: vi.fn(),
    getLoggedUser: vi.fn(),
  },
}));

// Import after mocking
import { configureStore } from '@reduxjs/toolkit';
import Login from './Login';
import authReducer from '../../reducers/auth/auth';
import authService from '../../services/auth';

const mockAuthServiceLogin = authService.login as Mock;

// Helper to create store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        user: null,
        isAuthenticated: false,
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

describe('Login', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    vi.clearAllMocks();
  });

  describe('Initial rendering', () => {
    test('renders login form with all elements', () => {
      renderWithProviders(<Login />);

      // Check heading
      expect(
        screen.getByRole('heading', { name: /sign in/i }),
      ).toBeInTheDocument();

      // Check form fields
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

      // Check submit button
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();

      // Check register link
      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /register/i }),
      ).toBeInTheDocument();
    });

    test('does not show error message initially', () => {
      renderWithProviders(<Login />);

      // No error should be visible
      expect(
        screen.queryByText(/invalid credentials/i),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(/login failed/i)).not.toBeInTheDocument();
    });
  });

  describe('Form validation', () => {
    test('shows error for invalid email format', async () => {
      renderWithProviders(<Login />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Type invalid email
      fireEvent.change(emailInput, { target: { value: 'notanemail' } });
      fireEvent.click(submitButton);

      // Wait for validation error
      await waitFor(() => {
        expect(screen.getByText('Invalid email')).toBeInTheDocument();
      });
    });

    test('shows error for empty email', async () => {
      renderWithProviders(<Login />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Leave email empty
      fireEvent.change(emailInput, { target: { value: '' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid email')).toBeInTheDocument();
      });
    });

    test('shows error for password shorter than 6 characters', async () => {
      renderWithProviders(<Login />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: '123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Password must be at least 6 characters'),
        ).toBeInTheDocument();
      });
    });

    test('shows error for empty password', async () => {
      renderWithProviders(<Login />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: '' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Password must be at least 6 characters'),
        ).toBeInTheDocument();
      });
    });

    test('does not show errors for valid inputs', async () => {
      renderWithProviders(<Login />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      // No validation errors
      expect(screen.queryByText('Invalid email')).not.toBeInTheDocument();
      expect(
        screen.queryByText('Password must be at least 6 characters'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Login flow', () => {
    test('successful login navigates to /workspaces', async () => {
      // Mock successful authService.login response
      const mockUser = {
        email: 'test@example.com',
        name: 'Test User',
        id: '123456',
      };
      mockAuthServiceLogin.mockResolvedValue(mockUser);

      const store = createMockStore();
      renderWithProviders(<Login />, { store });

      // Fill out form
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      // Wait for login to complete and navigation
      await waitFor(() => {
        expect(mockAuthServiceLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/workspaces');
      });
    });

    test('failed login shows error message', async () => {
      // Create a proper Axios-like error
      const axiosError = {
        isAxiosError: true, // ← Key property
        response: {
          data: { message: 'Invalid credentials' },
        },
      };

      mockAuthServiceLogin.mockRejectedValue(axiosError);

      const store = createMockStore();
      renderWithProviders(<Login />, { store });

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
      fireEvent.click(submitButton);

      // Wait for specific error message
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });

      // Should NOT navigate
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('button shows loading state during login', async () => {
      // Mock with delay
      mockAuthServiceLogin.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ email: 'test@test.com' }), 100),
          ),
      );

      const store = createMockStore();
      renderWithProviders(<Login />, { store });

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      // Check loading state
      await waitFor(() => {
        const loadingButton = screen.getByRole('button', {
          name: /signing in/i,
        });
        expect(loadingButton).toBeDisabled();
      });
    });
  });

  describe('Navigation', () => {
    test('register link navigates to /register', () => {
      renderWithProviders(<Login />);

      const registerLink = screen.getByRole('link', { name: /register/i });

      expect(registerLink).toHaveAttribute('href', '/register');
    });
  });
});
