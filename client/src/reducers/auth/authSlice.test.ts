import type { User } from '../../models/user';
import authReducer, { login, logout, refreshLogin, register } from './auth';

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isError: false,
  errorMessage: null,
};

const mockUser: User = {
  id: '1',
  name: 'Test User',
  email: 'tesuser@test.com',
};

describe('Auth Reducer', () => {
  it('should return the initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle register.fulfilled - no auto-login', () => {
    const nextState = authReducer(
      { ...initialState, isLoading: true },
      {
        type: register.fulfilled.type,
        payload: mockUser,
        meta: {
          arg: {
            name: 'Test',
            email: 'test@test.com',
            password: '123',
            confirmPassword: '123',
          },
        },
      },
    );
    expect(nextState.isLoading).toBe(false);
    expect(nextState.user).toBeNull(); // No auto-login
    expect(nextState.isAuthenticated).toBe(false); // No auto-login
  });

  it('should handle login.fulfilled', () => {
    const nextState = authReducer(initialState, {
      type: login.fulfilled.type,
      payload: mockUser,
    });
    expect(nextState.user).toEqual(mockUser);
    expect(nextState.isAuthenticated).toBe(true);
    expect(nextState.isLoading).toBe(false);
    expect(nextState.isError).toBe(false);
    expect(nextState.errorMessage).toBeNull();
  });

  it('should handle register.rejected', () => {
    const error = new Error('Registration failed');
    const rejectedAction = register.rejected(error, 'test-request-id', {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
    const nextState = authReducer(initialState, rejectedAction);
    expect(nextState.isError).toBe(true);
    expect(nextState.errorMessage).toBe('An error occurred');
  });

  it('should handle login.rejected', () => {
    const error = new Error('Login failed');
    const rejectedAction = login.rejected(error, 'test-request-id', {
      email: 'test@test.com',
      password: 'asw1',
    });

    const nextState = authReducer(initialState, rejectedAction);

    expect(nextState.isError).toBe(true);
    expect(nextState.errorMessage).toBe('An error occurred');
  });

  it('should handle logout.fulfilled', () => {
    const nextState = authReducer(
      { ...initialState, user: mockUser, isAuthenticated: true },
      { type: logout.fulfilled.type },
    );
    expect(nextState.user).toBeNull();
    expect(nextState.isAuthenticated).toBe(false);
    expect(nextState.isLoading).toBe(false);
    expect(nextState.isError).toBe(false);
    expect(nextState.errorMessage).toBeNull();
  });

  it('should handle refreshLogin.fulfilled with user data', () => {
    const nextState = authReducer(initialState, {
      type: refreshLogin.fulfilled.type,
      payload: mockUser,
    });

    expect(nextState.user).toEqual(mockUser);
    expect(nextState.isAuthenticated).toBe(true);
  });

  it('should handle refreshLogin.fulfilled with no user data', () => {
    const nextState = authReducer(initialState, {
      type: refreshLogin.fulfilled.type,
      payload: null,
    });

    expect(nextState.user).toBeNull();
    expect(nextState.isAuthenticated).toBe(false);
  });

  it('should handle refreshLogin.rejected', () => {
    const nextState = authReducer(
      { ...initialState, user: mockUser, isAuthenticated: true },
      {
        type: refreshLogin.rejected.type,
        payload: { message: 'Token expired' },
      },
    );

    expect(nextState.user).toBeNull();
    expect(nextState.isAuthenticated).toBe(false);
    expect(nextState.isError).toBe(true);
    expect(nextState.errorMessage).toBe('Token expired');
  });

  it('should handle generic loading and error states', () => {
    const pendingAction = login.pending('test-request-id', {
      email: '',
      password: '',
    });
    const rejectedAction = login.rejected(
      new Error('Login failed'),
      'test-request-id',
      { email: '', password: '' },
    );

    let nextState = authReducer(initialState, pendingAction);
    expect(nextState.isLoading).toBe(true);
    expect(nextState.isError).toBe(false);
    expect(nextState.errorMessage).toBeNull();

    nextState = authReducer(nextState, rejectedAction);
    expect(nextState.isLoading).toBe(false);
    expect(nextState.isError).toBe(true);
    expect(nextState.errorMessage).toBe('An error occurred');
  });
});
