import type { Workspace, WorkspacesState } from '../../models/workspace';
import workspacesReducer, {
  fetchWorkspaces,
  fetchWorkspaceById,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  clearWorkspaceError,
  clearSelectedWorkspace,
} from './workspace';

const initialState: WorkspacesState = {
  items: [],
  selectedWorkspace: null,
  isLoading: false,
  isError: false,
  errorMessage: null,
};

const mockWorkspaces: Workspace[] = [
  {
    _id: '1',
    name: 'Workspace 1',
    description: 'Test workspace 1',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
    documentCount: 5,
    ownerId: 'owner1',
  },
];

const mockWorkspace: Workspace = {
  _id: '1',
  name: 'Updated Workspace',
  description: 'Updated description',
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2026-01-21T16:49:00.000Z',
  documentCount: 10,
  ownerId: 'owner1',
};

describe('Workspaces Reducer', () => {
  it('should return the initial state', () => {
    expect(workspacesReducer(undefined, { type: 'unknown' })).toEqual(
      initialState,
    );
  });

  // Sync reducers
  it('should handle clearWorkspaceError', () => {
    const state = { ...initialState, isError: true, errorMessage: 'Error' };
    const nextState = workspacesReducer(state, clearWorkspaceError());
    expect(nextState.isError).toBe(false);
    expect(nextState.errorMessage).toBeNull();
  });

  it('should handle clearSelectedWorkspace', () => {
    const state = { ...initialState, selectedWorkspace: mockWorkspace };
    const nextState = workspacesReducer(state, clearSelectedWorkspace());
    expect(nextState.selectedWorkspace).toBeNull();
  });

  // fetchWorkspaces
  it('should handle fetchWorkspaces.pending', () => {
    const nextState = workspacesReducer(
      initialState,
      fetchWorkspaces.pending('req1', undefined),
    );
    expect(nextState.isLoading).toBe(true);
    expect(nextState.isError).toBe(false);
    expect(nextState.errorMessage).toBeNull();
  });

  it('should handle fetchWorkspaces.fulfilled', () => {
    const nextState = workspacesReducer(initialState, {
      type: fetchWorkspaces.fulfilled.type,
      payload: mockWorkspaces,
    });
    expect(nextState.isLoading).toBe(false);
    expect(nextState.items).toEqual(mockWorkspaces);
  });

  it('should handle fetchWorkspaces.rejected', () => {
    const nextState = workspacesReducer(initialState, {
      type: fetchWorkspaces.rejected.type,
      payload: { message: 'Fetch failed' },
    });
    expect(nextState.isLoading).toBe(false);
    expect(nextState.isError).toBe(true);
    expect(nextState.errorMessage).toBe('Fetch failed');
  });

  // fetchWorkspaceById
  it('should handle fetchWorkspaceById.fulfilled', () => {
    const nextState = workspacesReducer(initialState, {
      type: fetchWorkspaceById.fulfilled.type,
      payload: mockWorkspace,
      meta: { arg: '1' },
    });
    expect(nextState.isLoading).toBe(false);
    expect(nextState.selectedWorkspace).toEqual(mockWorkspace);
  });

  // createWorkspace
  it('should handle createWorkspace.fulfilled', () => {
    const newWorkspace = {
      _id: '2',
      name: 'New Workspace',
      description: 'New one',
      createdAt: '2026-01-21T16:49:00.000Z',
      updatedAt: '2026-01-21T16:49:00.000Z',
    };
    const nextState = workspacesReducer(initialState, {
      type: createWorkspace.fulfilled.type,
      payload: newWorkspace,
      meta: { arg: { name: 'New Workspace' } },
    });
    expect(nextState.isLoading).toBe(false);
    expect(nextState.items).toEqual([newWorkspace]);
  });

  // updateWorkspace
  it('should handle updateWorkspace.fulfilled with matching selected ID', () => {
    const stateWithItems = {
      ...initialState,
      items: mockWorkspaces,
      selectedWorkspace: mockWorkspaces[0],
    };
    const nextState = workspacesReducer(stateWithItems, {
      type: updateWorkspace.fulfilled.type,
      payload: mockWorkspace,
      meta: { arg: { id: '1', payload: { name: 'Updated Workspace' } } },
    });
    expect(nextState.items[0]).toEqual(mockWorkspace);
    expect(nextState.selectedWorkspace).toEqual(mockWorkspace);
    expect(nextState.isLoading).toBe(false);
  });

  it('should handle updateWorkspace.fulfilled without matching selected ID', () => {
    const stateWithItems = {
      ...initialState,
      items: mockWorkspaces,
      selectedWorkspace: { ...mockWorkspaces[0], _id: '999' },
    };
    const nextState = workspacesReducer(stateWithItems, {
      type: updateWorkspace.fulfilled.type,
      payload: mockWorkspace,
      meta: { arg: { id: '1', payload: { name: 'Updated Workspace' } } },
    });
    expect(nextState.items[0]).toEqual(mockWorkspace);
    expect(nextState.selectedWorkspace?._id).toBe('999');
  });

  it('should handle updateWorkspace.rejected', () => {
    const nextState = workspacesReducer(initialState, {
      type: updateWorkspace.rejected.type,
      payload: { message: 'Update failed' },
      meta: { arg: { id: '1', payload: {} } },
    });
    expect(nextState.isLoading).toBe(false);
    expect(nextState.isError).toBe(true);
    expect(nextState.errorMessage).toBe('Update failed');
  });

  // deleteWorkspace
  it('should handle deleteWorkspace.fulfilled with matching selected ID', () => {
    const stateWithItems = {
      ...initialState,
      items: mockWorkspaces,
      selectedWorkspace: mockWorkspaces[0],
    };
    const nextState = workspacesReducer(stateWithItems, {
      type: deleteWorkspace.fulfilled.type,
      payload: '1',
    });
    expect(nextState.items).toEqual([]);
    expect(nextState.selectedWorkspace).toBeNull();
    expect(nextState.isLoading).toBe(false);
  });

  it('should handle deleteWorkspace.fulfilled without matching selected ID', () => {
    const stateWithItems = {
      ...initialState,
      items: mockWorkspaces,
      selectedWorkspace: { ...mockWorkspaces[0], _id: '999' },
    };
    const nextState = workspacesReducer(stateWithItems, {
      type: deleteWorkspace.fulfilled.type,
      payload: '1',
    });
    expect(nextState.items).toEqual([]);
    expect(nextState.selectedWorkspace?._id).toBe('999');
  });
});
