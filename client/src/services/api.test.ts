import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest';

vi.mock('./auth');
vi.mock('../reducers/auth/auth');

type MockInterceptorManager = {
  use: Mock;
  eject: Mock;
  clear: Mock;
};

type MockAxiosInstance = {
  interceptors: {
    request: MockInterceptorManager;
    response: MockInterceptorManager;
  };
  get: Mock;
  post: Mock;
} & Partial<AxiosInstance>;

const mockAxiosInstance = Object.assign(vi.fn(), {
  interceptors: {
    request: { use: vi.fn(), eject: vi.fn(), clear: vi.fn() },
    response: { use: vi.fn(), eject: vi.fn(), clear: vi.fn() },
  },
  get: vi.fn(),
  post: vi.fn(),
}) as unknown as MockAxiosInstance & Mock;

vi.mock('axios');

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  AxiosError,
} from 'axios';

let authService: typeof import('./auth').default;
let logout: typeof import('../reducers/auth/auth').logout;
import type { AppStore } from '../types/redux';

const mockStore = {
  dispatch: vi.fn(),
} as unknown as AppStore;

describe('api service', () => {
  let setupTokenRefreshInterceptor: typeof import('./api').setupTokenRefreshInterceptor;

  beforeEach(async () => {
    vi.clearAllMocks();

    (axios.create as Mock).mockReturnValue(mockAxiosInstance);

    const apiModule = await import('./api');
    setupTokenRefreshInterceptor = apiModule.setupTokenRefreshInterceptor;

    const authModule = await import('./auth');
    authService = authModule.default;

    const authReducerModule = await import('../reducers/auth/auth');
    logout = authReducerModule.logout;
  });

  it('adds Authorization header with token from request interceptor', () => {
    const config: AxiosRequestConfig = { headers: {} };
    (
      authService.getTokenFromLocalStorage as ReturnType<
        typeof authService.getTokenFromLocalStorage
      >
    ).mockReturnValue('token123');

    const interceptor =
      mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
    interceptor(config);

    expect(config.headers!.Authorization).toBe('Bearer token123');
  });

  describe('setupTokenRefreshInterceptor', () => {
    it('refreshes token on 401', async () => {
      const refreshResponse = { token: 'newtoken456' };
      vi.mocked(authService.refreshToken).mockResolvedValue(refreshResponse);

      const error: AxiosError = {
        response: { status: 401, statusText: 'Unauthorized' },
        config: {
          _retry: false,
          url: '/data',
          headers: {},
        } as AxiosRequestConfig,
      } as AxiosError;

      setupTokenRefreshInterceptor(mockStore);
      const responseInterceptor =
        mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
      await responseInterceptor(error);

      expect(authService.refreshToken).toHaveBeenCalled();
      expect(error.config!.headers!.Authorization).toBe('Bearer newtoken456');
    });

    it('blocks refresh for /auth endpoints', async () => {
      const error: AxiosError = {
        response: { status: 401 },
        config: { url: '/auth/login' } as AxiosRequestConfig,
      } as AxiosError;

      setupTokenRefreshInterceptor(mockStore);
      const responseInterceptor =
        mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
      await expect(responseInterceptor(error)).rejects.toThrow();

      expect(authService.refreshToken).not.toHaveBeenCalled();
    });

    it('dispatches logout on refresh failure', async () => {
      vi.mocked(authService.refreshToken).mockRejectedValue(
        new Error('refresh failed'),
      );

      const error: AxiosError = {
        response: { status: 401 },
        config: { _retry: false } as AxiosRequestConfig,
      } as AxiosError;

      setupTokenRefreshInterceptor(mockStore);
      const responseInterceptor =
        mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
      await expect(responseInterceptor(error)).rejects.toThrow();

      expect(mockStore.dispatch).toHaveBeenCalledWith(logout());
    });
  });
});
