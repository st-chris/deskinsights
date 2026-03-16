import { configureStore } from '@reduxjs/toolkit';
import type { Workspace, WorkspacesState } from '../../models/workspace';
import workspaceService from '../../services/workspace';
import workspacesReducer, {
  fetchWorkspaces,
  fetchWorkspaceById,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  clearWorkspaceError,
  clearSelectedWorkspace,
} from './workspace';

vi.mock('../../services/workspace');

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

const createTestStore = () =>
  configureStore({ reducer: { workspaces: workspacesReducer } });

describe('Workspaces Reducer', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    vi.clearAllMocks();
  });

  it('should return the initial state', () => {
    expect(workspacesReducer(undefined, { type: 'unknown' })).toEqual(
      initialState,
    );
  });

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

  it('should handle fetchWorkspaceById.fulfilled', () => {
    const nextState = workspacesReducer(initialState, {
      type: fetchWorkspaceById.fulfilled.type,
      payload: mockWorkspace,
    });
    expect(nextState.isLoading).toBe(false);
    expect(nextState.selectedWorkspace).toEqual(mockWorkspace);
  });

  it('should handle createWorkspace.fulfilled', () => {
    const newWorkspace = {
      _id: '2',
      name: 'New Workspace',
      description: 'New one',
      createdAt: '2026-01-21T16:49:00.000Z',
      updatedAt: '2026-01-21T16:49:00.000Z',
      documentCount: 0,
      ownerId: 'owner1',
    };
    const nextState = workspacesReducer(initialState, {
      type: createWorkspace.fulfilled.type,
      payload: newWorkspace,
    });
    expect(nextState.isLoading).toBe(false);
    expect(nextState.items).toEqual([newWorkspace]);
  });

  it('should handle updateWorkspace.fulfilled with matching selected ID', () => {
    const stateWithItems = {
      ...initialState,
      items: mockWorkspaces,
      selectedWorkspace: mockWorkspaces[0],
    };
    const nextState = workspacesReducer(stateWithItems, {
      type: updateWorkspace.fulfilled.type,
      payload: mockWorkspace,
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
    });
    expect(nextState.items[0]).toEqual(mockWorkspace);
    expect(nextState.selectedWorkspace?._id).toBe('999');
  });

  it('should handle updateWorkspace.rejected', () => {
    const nextState = workspacesReducer(initialState, {
      type: updateWorkspace.rejected.type,
      payload: { message: 'Update failed' },
    });
    expect(nextState.isLoading).toBe(false);
    expect(nextState.isError).toBe(true);
    expect(nextState.errorMessage).toBe('Update failed');
  });

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

  it('should handle deleteWorkspace.rejected', () => {
    const nextState = workspacesReducer(initialState, {
      type: deleteWorkspace.rejected.type,
      payload: { message: 'Delete failed' },
    });
    expect(nextState.isLoading).toBe(false);
    expect(nextState.isError).toBe(true);
    expect(nextState.errorMessage).toBe('Delete failed');
  });

  it('uses fallback error message when payload has no message', () => {
    const nextState = workspacesReducer(initialState, {
      type: fetchWorkspaces.rejected.type,
      payload: undefined,
    });
    expect(nextState.errorMessage).toBe('Failed to fetch workspaces');
  });

  describe('workspace thunks', () => {
    it('fetchWorkspaces handles success', async () => {
      vi.mocked(workspaceService.getWorkspaces).mockResolvedValue(
        mockWorkspaces,
      );

      const result = await store.dispatch(fetchWorkspaces());
      expect(result.payload).toEqual(mockWorkspaces);
      expect(workspaceService.getWorkspaces).toHaveBeenCalled();
    });

    it('fetchWorkspaces handles axios error with message', async () => {
      vi.mocked(workspaceService.getWorkspaces).mockRejectedValue({
        response: { data: { message: 'Unauthorized' } },
        isAxiosError: true,
      });

      const result = await store.dispatch(fetchWorkspaces());
      expect(result.payload).toEqual({ message: 'Unauthorized' });
    });

    it('fetchWorkspaces handles generic error', async () => {
      vi.mocked(workspaceService.getWorkspaces).mockRejectedValue(
        new Error('Network error'),
      );

      const result = await store.dispatch(fetchWorkspaces());
      expect(result.payload).toEqual({ message: 'Failed to fetch workspaces' });
    });

    it('fetchWorkspaceById handles success', async () => {
      vi.mocked(workspaceService.getWorkspaceById).mockResolvedValue(
        mockWorkspace,
      );

      const result = await store.dispatch(fetchWorkspaceById('1'));
      expect(result.payload).toEqual(mockWorkspace);
      expect(workspaceService.getWorkspaceById).toHaveBeenCalledWith('1');
    });

    it('createWorkspace handles success', async () => {
      vi.mocked(workspaceService.createWorkspace).mockResolvedValue(
        mockWorkspace,
      );

      const result = await store.dispatch(
        createWorkspace({ name: 'New Workspace' }),
      );
      expect(result.payload).toEqual(mockWorkspace);
    });

    it('updateWorkspace handles success', async () => {
      vi.mocked(workspaceService.updateWorkspace).mockResolvedValue(
        mockWorkspace,
      );

      const result = await store.dispatch(
        updateWorkspace({ id: '1', payload: { name: 'Updated' } }),
      );
      expect(result.payload).toEqual(mockWorkspace);
    });

    it('deleteWorkspace handles success', async () => {
      vi.mocked(workspaceService.deleteWorkspace).mockResolvedValue({
        message: 'Deleted',
      });

      const result = await store.dispatch(deleteWorkspace('1'));
      expect(result.payload).toBe('1');
    });

    it('deleteWorkspace handles axios error', async () => {
      vi.mocked(workspaceService.deleteWorkspace).mockRejectedValue({
        response: { data: { message: 'Not found' } },
        isAxiosError: true,
      });

      const result = await store.dispatch(deleteWorkspace('999'));
      expect(result.payload).toEqual({ message: 'Not found' });
    });
  });
});
