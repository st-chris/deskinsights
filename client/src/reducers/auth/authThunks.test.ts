import { configureStore } from '@reduxjs/toolkit';
import authReducer, { login, logout, refreshLogin, register } from './auth';
import authService from '../../services/auth';
import userService from '../../services/user';
import { isTokenExpired } from '../../utils/auth';
import type { AppDispatch } from '../../types/redux';
import type { AxiosResponse } from 'axios';

vi.mock('../../services/user');
vi.mock('../../services/auth');
vi.mock('../../utils/auth');

const mockedUserService = vi.mocked(userService);
const mockedAuthService = vi.mocked(authService);
const mockedIsTokenExpired = vi.mocked(isTokenExpired);

describe('Auth Thunks', () => {
  let store: ReturnType<typeof createTestStore>;
  let dispatch: AppDispatch;

  const createTestStore = () => {
    return configureStore({
      reducer: {
        auth: authReducer,
      },
    });
  };

  beforeEach(() => {
    store = createTestStore();
    dispatch = store.dispatch;
    vi.resetAllMocks();
  });

  describe('register', () => {
    it('should dispatch register.fulfilled on successful registration', async () => {
      const mockUser = {
        id: '123',
        email: 'user@test.com',
        name: 'Test User',
        token: '12345',
      };
      mockedUserService.register.mockResolvedValue(mockUser);

      await dispatch(
        register({
          name: 'Test User',
          email: 'user@test.com',
          password: 'password123',
          confirmPassword: 'password123',
        }),
      );

      const state = store.getState().auth;
      expect(state.isLoading).toBe(false);
      expect(state.isError).toBe(false);
      expect(state.user).toBeNull(); // No auto-login
      expect(state.isAuthenticated).toBe(false); // No auto-login
      expect(mockedUserService.register).toHaveBeenCalledTimes(1);
    });

    it('should handle register.rejected on failed registration', async () => {
      const errorMessage = 'Email already exists';
      mockedUserService.register.mockRejectedValue({
        response: { data: { message: errorMessage } },
        isAxiosError: true,
      });

      const result = await store.dispatch(
        register({
          name: 'Test User',
          email: 'user@test.com',
          password: 'password123',
          confirmPassword: 'password123',
        }),
      );

      expect(register.rejected.match(result)).toBe(true);
      const state = store.getState().auth;
      expect(state.user).toBe(null);
      expect(state.isError).toBe(true);
      expect(state.errorMessage).toBe(errorMessage);
    });
  });

  describe('login', () => {
    it('should dispatch login.fulfilled on successful login', async () => {
      const mockUser = {
        email: 'user@test.com',
        name: 'Test User',
        token: '12345',
      };

      mockedAuthService.login.mockResolvedValue(mockUser);

      await dispatch(
        login({ email: 'user@test.com', password: 'password123' }),
      );
      const state = store.getState().auth;

      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isError).toBe(false);
    });

    it('should handle login.rejected on failed login', async () => {
      const errorMessage = 'Invalid username or password';

      // Reject with an Axios-like error
      mockedAuthService.login.mockRejectedValue({
        response: { data: { message: errorMessage } },
        isAxiosError: true,
      });

      const result = await dispatch(
        login({ email: 'wrong', password: 'wrong' }),
      );

      expect(login.rejected.match(result)).toBe(true);

      const state = store.getState().auth;

      expect(state.user).toBe(null);
      expect(state.isError).toBe(true);
      expect(state.errorMessage).toBe(errorMessage);
    });

    it('should handle login.rejected on network error', async () => {
      const errorMessage = 'Network error';

      // Reject with a non-Axios error
      mockedAuthService.login.mockRejectedValue(new Error(errorMessage));

      const result = await dispatch(
        login({ email: 'wrong', password: 'wrong' }),
      );

      expect(login.rejected.match(result)).toBe(true);

      const state = store.getState().auth;

      expect(state.user).toBe(null);
      expect(state.isError).toBe(true);
      expect(state.errorMessage).toBe('Login failed');
    });
  });

  describe('refreshLogin', () => {
    const setTokenInLocalStorage = (isExpired: boolean = false) => {
      const token = isExpired ? 'expired-token' : 'valid-token';
      const fakeUserJSON = JSON.stringify({ token });
      localStorage.setItem('loggedUser', fakeUserJSON);
    };

    afterEach(() => {
      localStorage.clear();
    });

    it('uses localStorage user and calls getLoggedUser when token not expired', async () => {
      setTokenInLocalStorage();
      mockedIsTokenExpired.mockReturnValue(false);

      const mockUser = { id: '123', name: 'Test User', email: 'user@test.com' };
      mockedUserService.getLoggedUser.mockResolvedValue(mockUser);

      const result = await dispatch(refreshLogin());

      expect(mockedUserService.getLoggedUser).toHaveBeenCalled();
      expect(mockedAuthService.refreshToken).not.toHaveBeenCalled();

      expect(refreshLogin.fulfilled.match(result)).toBe(true);
      expect(result.payload).toEqual(mockUser);

      const state = store.getState().auth;
      expect(state.user).toEqual(mockUser);
      expect(state.isError).toBe(false);
    });

    it('calls refreshToken when token is expired', async () => {
      setTokenInLocalStorage(true);
      mockedIsTokenExpired.mockReturnValue(true);

      const refreshedUser = { id: '456', name: 'Refreshed User' };
      mockedAuthService.refreshToken.mockResolvedValue(refreshedUser);

      const result = await store.dispatch(refreshLogin());

      expect(mockedUserService.getLoggedUser).not.toHaveBeenCalled();
      expect(mockedAuthService.refreshToken).toHaveBeenCalled();

      expect(refreshLogin.fulfilled.match(result)).toBe(true);
      expect(result.payload).toEqual(refreshedUser);

      const state = store.getState().auth;
      expect(state.user).toEqual(refreshedUser);
      expect(state.isError).toBe(false);
    });

    it('rejects with message if getLoggedUser fails with axios error', async () => {
      setTokenInLocalStorage();
      mockedIsTokenExpired.mockReturnValue(false);

      const axiosError = {
        isAxiosError: true,
        response: { data: { message: 'Failed to fetch user' } },
      };

      mockedUserService.getLoggedUser.mockRejectedValue(axiosError);

      const result = await store.dispatch(refreshLogin());

      expect(refreshLogin.rejected.match(result)).toBe(true);
      expect(result.payload).toEqual({ message: 'Failed to fetch user' });

      const state = store.getState().auth;
      expect(state.isError).toBe(true);
      expect(state.errorMessage).toBe('Failed to fetch user');
      expect(state.user).toBeNull();
    });

    it('rejects with generic message if getLoggedUser fails with unknown error', async () => {
      setTokenInLocalStorage();
      mockedIsTokenExpired.mockReturnValue(false);

      mockedUserService.getLoggedUser.mockRejectedValue(
        new Error('Unknown error'),
      );

      const result = await store.dispatch(refreshLogin());

      expect(refreshLogin.rejected.match(result)).toBe(true);
      expect(result.payload).toEqual({ message: 'Failed to refresh login' });

      const state = store.getState().auth;
      expect(state.isError).toBe(true);
      expect(state.errorMessage).toBe('Failed to refresh login');
      expect(state.user).toBeNull();
    });

    it('rejects with message if refreshToken fails with axios error', async () => {
      localStorage.removeItem('loggedUser'); // no user in localStorage
      mockedIsTokenExpired.mockReturnValue(true); // just to be safe

      const axiosError = {
        isAxiosError: true,
        response: { data: { message: 'Refresh token failed' } },
      };

      mockedAuthService.refreshToken.mockRejectedValue(axiosError);

      const result = await store.dispatch(refreshLogin());

      expect(refreshLogin.rejected.match(result)).toBe(true);
      expect(result.payload).toEqual({ message: 'Refresh token failed' });

      const state = store.getState().auth;
      expect(state.isError).toBe(true);
      expect(state.errorMessage).toBe('Refresh token failed');
      expect(state.user).toBeNull();
    });

    it('rejects with generic message if refreshToken fails with unknown error', async () => {
      localStorage.removeItem('loggedUser'); // no user
      mockedIsTokenExpired.mockReturnValue(true);

      mockedAuthService.refreshToken.mockRejectedValue(
        new Error('Unexpected error'),
      );

      const result = await store.dispatch(refreshLogin());

      expect(refreshLogin.rejected.match(result)).toBe(true);
      expect(result.payload).toEqual({ message: 'Failed to refresh token' });

      const state = store.getState().auth;
      expect(state.isError).toBe(true);
      expect(state.errorMessage).toBe('Failed to refresh token');
      expect(state.user).toBeNull();
    });
  });

  describe('logout', () => {
    it('should dispatch logout and clear user state', async () => {
      mockedAuthService.logout.mockResolvedValue({ data: {} } as AxiosResponse);

      await dispatch(logout());

      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isError).toBe(false);
    });

    it('should handle logout error with axios error', async () => {
      const errorMessage = 'Logout failed';
      mockedAuthService.logout.mockRejectedValue({
        response: { data: { message: errorMessage } },
        isAxiosError: true,
      });

      const result = await store.dispatch(logout());
      expect(logout.rejected.match(result)).toBe(true);
      expect(result.payload).toEqual({ message: errorMessage });

      const state = store.getState().auth;
      expect(state.isError).toBe(true);
      expect(state.errorMessage).toBe(errorMessage);
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should handle logout error with non-axios error', async () => {
      const errorMessage = 'Network error';
      mockedAuthService.logout.mockRejectedValue(new Error(errorMessage));

      const result = await store.dispatch(logout());
      expect(logout.rejected.match(result)).toBe(true);
      expect(result.payload).toEqual({ message: 'Logout failed' });

      const state = store.getState().auth;
      expect(state.isError).toBe(true);
      expect(state.errorMessage).toBe('Logout failed');
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });
});
