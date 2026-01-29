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
import Register from './Register';
import authReducer from '../../reducers/auth/auth';
import userService from '../../services/user';

const mockUserServiceRegister = userService.register as Mock;

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

describe('Register', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    vi.clearAllMocks();
  });

  describe('Initial rendering', () => {
    test('renders registration form with all elements', () => {
      renderWithProviders(<Register />);

      // Check heading
      expect(
        screen.getByRole('heading', { name: /create account/i }),
      ).toBeInTheDocument();

      // Check form fields
      expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();

      // Check submit button
      const submitButton = screen.getByRole('button', { name: /register/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();

      // Check login link
      expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /sign in/i }),
      ).toBeInTheDocument();
    });

    test('does not show error message initially', () => {
      renderWithProviders(<Register />);

      expect(
        screen.queryByText(/registration failed/i),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/email already exists/i),
      ).not.toBeInTheDocument();
    });
  });

  describe('Form validation', () => {
    test('shows error for empty name', async () => {
      renderWithProviders(<Register />);

      const nameInput = screen.getByLabelText(/^name$/i);
      const submitButton = screen.getByRole('button', { name: /register/i });

      fireEvent.change(nameInput, { target: { value: '' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });
    });

    test('shows error for invalid email format', async () => {
      renderWithProviders(<Register />);

      const nameInput = screen.getByLabelText(/^name$/i);
      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /register/i });

      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'notanemail' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: 'password123' },
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid email address')).toBeInTheDocument();
      });
    });

    test('shows error for password shorter than 6 characters', async () => {
      renderWithProviders(<Register />);

      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /register/i });

      fireEvent.change(passwordInput, { target: { value: '123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Password must be at least 6 characters long'),
        ).toBeInTheDocument();
      });
    });

    test('shows error when passwords do not match', async () => {
      renderWithProviders(<Register />);

      const nameInput = screen.getByLabelText(/^name$/i);
      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /register/i });

      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: 'password456' },
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });

    test('shows error for confirm password shorter than 6 characters', async () => {
      renderWithProviders(<Register />);

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /register/i });

      fireEvent.change(confirmPasswordInput, { target: { value: '123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(
            'Confirm password must be at least 6 characters long',
          ),
        ).toBeInTheDocument();
      });
    });

    test('does not show errors for valid inputs', async () => {
      renderWithProviders(<Register />);

      const nameInput = screen.getByLabelText(/^name$/i);
      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: 'password123' },
      });

      // No validation errors
      expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
      expect(
        screen.queryByText('Invalid email address'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('Password must be at least 6 characters long'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('Passwords do not match'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Registration flow', () => {
    test('successful registration navigates to /login', async () => {
      // Mock successful registration
      const mockUser = {
        data: {
          name: 'Test User',
          email: 'test@example.com',
          id: '123456',
        },
      };
      mockUserServiceRegister.mockResolvedValue(mockUser);

      const store = createMockStore();
      renderWithProviders(<Register />, { store });

      // Fill out form
      const nameInput = screen.getByLabelText(/^name$/i);
      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /register/i });

      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: 'password123' },
      });
      fireEvent.click(submitButton);

      // Wait for registration and navigation
      await waitFor(() => {
        expect(mockUserServiceRegister).toHaveBeenCalledWith({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'password123',
        });
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    test('failed registration shows error message', async () => {
      // Mock failed registration with Axios error
      const axiosError = {
        isAxiosError: true,
        response: {
          data: { message: 'Email already exists' },
        },
      };
      mockUserServiceRegister.mockRejectedValue(axiosError);

      const store = createMockStore();
      renderWithProviders(<Register />, { store });

      const nameInput = screen.getByLabelText(/^name$/i);
      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /register/i });

      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, {
        target: { value: 'existing@example.com' },
      });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: 'password123' },
      });
      fireEvent.click(submitButton);

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      });

      // Should NOT navigate
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('button shows loading state during registration', async () => {
      // Mock with delay
      mockUserServiceRegister.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: {} }), 100),
          ),
      );

      const store = createMockStore();
      renderWithProviders(<Register />, { store });

      const nameInput = screen.getByLabelText(/^name$/i);
      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /register/i });

      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: 'password123' },
      });
      fireEvent.click(submitButton);

      // Check loading state
      await waitFor(() => {
        const loadingButton = screen.getByRole('button', {
          name: /creating account/i,
        });
        expect(loadingButton).toBeDisabled();
      });
    });
  });

  describe('Navigation', () => {
    test('login link navigates to /login', () => {
      renderWithProviders(<Register />);

      const loginLink = screen.getByRole('link', { name: /sign in/i });

      expect(loginLink).toHaveAttribute('href', '/login');
    });
  });
});
