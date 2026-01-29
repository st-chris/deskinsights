import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../types/redux';

export const selectAuth = (state: RootState) => state.auth;

export const selectAuthUser = createSelector(selectAuth, (auth) => auth.user);

export const selectIsAuthenticated = createSelector(
  selectAuth,
  (auth) => auth.isAuthenticated,
);

export const selectAuthLoading = createSelector(
  selectAuth,
  (auth) => auth.isLoading,
);

export const selectAuthError = createSelector(selectAuth, (auth) => ({
  isError: auth.isError,
  errorMessage: auth.errorMessage,
}));

export const selectAuthState = createSelector(selectAuth, (auth) => ({
  isLoading: auth.isLoading,
  isError: auth.isError,
  errorMessage: auth.errorMessage,
}));

export const selectAuthWithUser = createSelector(selectAuth, (auth) => ({
  user: auth.user,
  isAuthenticated: auth.isAuthenticated,
  isLoading: auth.isLoading,
  isError: auth.isError,
  errorMessage: auth.errorMessage,
}));
