import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { User } from '../../models/user';
import type {
  LoginFormData,
  RegisterFormData,
} from '../../utils/validationSchema';
import userService from '../../services/user';
import authService from '../../services/auth';
import axios from 'axios';
import {
  isAuthThunkFulfilled,
  isAuthThunkPending,
  isAuthThunkRejected,
} from '../../utils/extraReducersHelpers';
import { isTokenExpired } from '../../utils/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isError: false,
  errorMessage: null,
};

export const register = createAsyncThunk<
  User,
  RegisterFormData,
  { rejectValue: { message: string } }
>('auth/register', async (data, thunkAPI) => {
  try {
    const response = await userService.register(data);
    return response;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue({ message: error.response.data.message });
    }
    return thunkAPI.rejectWithValue({ message: 'Registration failed' });
  }
});

export const login = createAsyncThunk<
  User,
  LoginFormData,
  { rejectValue: { message: string } }
>('auth/login', async (data, thunkAPI) => {
  try {
    const response = await authService.login(data);
    return response;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue({ message: error.response.data.message });
    }
    return thunkAPI.rejectWithValue({ message: 'Login failed' });
  }
});

export const refreshLogin = createAsyncThunk<
  User | null,
  void,
  { rejectValue: { message: string } }
>('auth/refreshLogin', async (_, thunkAPI) => {
  const loggedUserJSON = localStorage.getItem('loggedUser');

  if (loggedUserJSON && !isTokenExpired(loggedUserJSON)) {
    try {
      const response = await userService.getLoggedUser();
      return response;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        return thunkAPI.rejectWithValue({
          message: error.response.data.message,
        });
      }
      return thunkAPI.rejectWithValue({ message: 'Failed to refresh login' });
    }
  }

  try {
    const response = await authService.refreshToken();
    return response;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue({ message: error.response.data.message });
    }
    return thunkAPI.rejectWithValue({ message: 'Failed to refresh token' });
  }
});

export const logout = createAsyncThunk('auth/logout', async (_, thunkAPI) => {
  try {
    const response = await authService.logout();
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue({ message: error.response.data.message });
    }
    return thunkAPI.rejectWithValue({ message: 'Logout failed' });
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.fulfilled, (state) => {
        state.isLoading = false;
      })
      // Login
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      // Refresh login
      .addCase(refreshLogin.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.errorMessage = null;
      })
      .addCase(refreshLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
        } else {
          state.user = null;
          state.isAuthenticated = false;
        }
      })
      .addCase(refreshLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.errorMessage =
          (action as { payload?: { message?: string } }).payload?.message ||
          'Failed to refresh login';
        state.user = null;
        state.isAuthenticated = false;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.isError = false;
        state.errorMessage = null;
      })
      // Generic loading and error handling
      .addMatcher(
        (action) =>
          isAuthThunkPending(action) &&
          !action.type.startsWith('auth/refreshLogin'),
        (state) => {
          state.isLoading = true;
          state.isError = false;
          state.errorMessage = null;
        },
      )
      .addMatcher(isAuthThunkFulfilled, (state) => {
        state.isLoading = false;
        state.isError = false;
        state.errorMessage = '';
      })
      .addMatcher(
        (action) =>
          isAuthThunkRejected(action) &&
          !action.type.startsWith('auth/refreshLogin'),
        (state, action) => {
          state.isLoading = false;
          state.isError = true;
          state.errorMessage =
            (action as { payload?: { message?: string } }).payload?.message ||
            'An error occurred';
          state.user = null;
          state.isAuthenticated = false;
        },
      );
  },
});

export default authSlice.reducer;
