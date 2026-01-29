import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../types/redux';

export const selectWorkspaceState = (state: RootState) => state.workspaces;

export const selectWorkspaceItems = createSelector(
  selectWorkspaceState,
  (workspaces) => workspaces.items,
);

export const selectSelectedWorkspace = createSelector(
  selectWorkspaceState,
  (workspaces) => workspaces.selectedWorkspace,
);

export const selectWorkspaceLoading = createSelector(
  selectWorkspaceState,
  (workspaces) => workspaces.isLoading,
);

export const selectWorkspaceError = createSelector(
  selectWorkspaceState,
  (workspaces) => ({
    isError: workspaces.isError,
    errorMessage: workspaces.errorMessage,
  }),
);

export const selectWorkspaces = createSelector(
  selectWorkspaceState,
  (workspaces) => ({
    items: workspaces.items,
    selectedWorkspace: workspaces.selectedWorkspace,
    isLoading: workspaces.isLoading,
    isError: workspaces.isError,
    errorMessage: workspaces.errorMessage,
  }),
);
