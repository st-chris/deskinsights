import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import workspaceService from '../../services/workspace';
import type {
  Workspace,
  CreateWorkspacePayload,
  UpdateWorkspacePayload,
  WorkspacesState,
} from '../../models/workspace';

const initialState: WorkspacesState = {
  items: [],
  selectedWorkspace: null,
  isLoading: false,
  isError: false,
  errorMessage: null,
};

// Thunks
export const fetchWorkspaces = createAsyncThunk<
  Workspace[],
  void,
  { rejectValue: { message: string } }
>('workspaces/fetchAll', async (_, thunkAPI) => {
  try {
    const data = await workspaceService.getWorkspaces();
    return data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue({ message: error.response.data.message });
    }
    return thunkAPI.rejectWithValue({ message: 'Failed to fetch workspaces' });
  }
});

export const fetchWorkspaceById = createAsyncThunk<
  Workspace,
  string,
  { rejectValue: { message: string } }
>('workspaces/fetchById', async (id, thunkAPI) => {
  try {
    const data = await workspaceService.getWorkspaceById(id);
    return data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue({ message: error.response.data.message });
    }
    return thunkAPI.rejectWithValue({ message: 'Failed to fetch workspace' });
  }
});

export const createWorkspace = createAsyncThunk<
  Workspace,
  CreateWorkspacePayload,
  { rejectValue: { message: string } }
>('workspaces/create', async (payload, thunkAPI) => {
  try {
    const data = await workspaceService.createWorkspace(payload);
    return data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue({ message: error.response.data.message });
    }
    return thunkAPI.rejectWithValue({ message: 'Failed to create workspace' });
  }
});

export const updateWorkspace = createAsyncThunk<
  Workspace,
  { id: string; payload: UpdateWorkspacePayload },
  { rejectValue: { message: string } }
>('workspaces/update', async ({ id, payload }, thunkAPI) => {
  try {
    const data = await workspaceService.updateWorkspace(id, payload);
    return data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue({ message: error.response.data.message });
    }
    return thunkAPI.rejectWithValue({ message: 'Failed to update workspace' });
  }
});

export const deleteWorkspace = createAsyncThunk<
  string,
  string,
  { rejectValue: { message: string } }
>('workspaces/delete', async (id, thunkAPI) => {
  try {
    await workspaceService.deleteWorkspace(id);
    return id;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue({ message: error.response.data.message });
    }
    return thunkAPI.rejectWithValue({ message: 'Failed to delete workspace' });
  }
});

// Slice
const workspacesSlice = createSlice({
  name: 'workspaces',
  initialState,
  reducers: {
    clearWorkspaceError(state) {
      state.isError = false;
      state.errorMessage = null;
    },
    clearSelectedWorkspace(state) {
      state.selectedWorkspace = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch all
      .addCase(fetchWorkspaces.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.errorMessage = null;
      })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchWorkspaces.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.errorMessage =
          (action.payload && action.payload.message) ||
          'Failed to fetch workspaces';
      })

      // fetch by id
      .addCase(fetchWorkspaceById.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.errorMessage = null;
      })
      .addCase(fetchWorkspaceById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedWorkspace = action.payload;
      })
      .addCase(fetchWorkspaceById.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.errorMessage =
          (action.payload && action.payload.message) ||
          'Failed to fetch workspace';
      })

      // create
      .addCase(createWorkspace.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.errorMessage = null;
      })
      .addCase(createWorkspace.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items.push(action.payload);
      })
      .addCase(createWorkspace.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.errorMessage =
          (action.payload && action.payload.message) ||
          'Failed to create workspace';
      })

      // update
      .addCase(updateWorkspace.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = state.items.map((ws) =>
          ws._id === action.payload._id ? action.payload : ws,
        );
        if (state.selectedWorkspace?._id === action.payload._id) {
          state.selectedWorkspace = action.payload;
        }
      })
      .addCase(updateWorkspace.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.errorMessage =
          (action.payload && action.payload.message) ||
          'Failed to update workspace';
      })

      // delete
      .addCase(deleteWorkspace.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = state.items.filter((ws) => ws._id !== action.payload);
        if (state.selectedWorkspace?._id === action.payload) {
          state.selectedWorkspace = null;
        }
      })
      .addCase(deleteWorkspace.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.errorMessage =
          (action.payload && action.payload.message) ||
          'Failed to delete workspace';
      });
  },
});

export const { clearWorkspaceError, clearSelectedWorkspace } =
  workspacesSlice.actions;

export default workspacesSlice.reducer;
