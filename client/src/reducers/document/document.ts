import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import documentService from '../../services/document';
import type {
  DocumentSummary,
  DocumentFull,
  CreateDocumentPayload,
  UpdateDocumentPayload,
  DocumentsState,
} from '../../models/document';

const initialState: DocumentsState = {
  items: [],
  currentDocument: null,
  isLoading: false,
  isError: false,
  errorMessage: null,
};

// Thunks
export const fetchDocumentsInWorkspace = createAsyncThunk<
  DocumentSummary[],
  string,
  { rejectValue: { message: string } }
>('documents/fetchInWorkspace', async (workspaceId, thunkAPI) => {
  try {
    const data = await documentService.getDocumentsInWorkspace(workspaceId);
    return data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue({ message: error.response.data.message });
    }
    return thunkAPI.rejectWithValue({
      message: 'Failed to fetch documents',
    });
  }
});

export const fetchDocumentById = createAsyncThunk<
  DocumentFull,
  string,
  { rejectValue: { message: string } }
>('documents/fetchById', async (id, thunkAPI) => {
  try {
    const data = await documentService.getDocumentById(id);
    return data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue({ message: error.response.data.message });
    }
    return thunkAPI.rejectWithValue({ message: 'Failed to fetch document' });
  }
});

export const createDocument = createAsyncThunk<
  DocumentFull,
  CreateDocumentPayload,
  { rejectValue: { message: string } }
>('documents/create', async (payload, thunkAPI) => {
  try {
    const data = await documentService.createDocument(payload);
    return data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue({ message: error.response.data.message });
    }
    return thunkAPI.rejectWithValue({ message: 'Failed to create document' });
  }
});

export const updateDocument = createAsyncThunk<
  DocumentFull,
  { id: string; payload: UpdateDocumentPayload },
  { rejectValue: { message: string } }
>('documents/update', async ({ id, payload }, thunkAPI) => {
  try {
    const data = await documentService.updateDocument(id, payload);
    return data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue({ message: error.response.data.message });
    }
    return thunkAPI.rejectWithValue({ message: 'Failed to update document' });
  }
});

export const deleteDocument = createAsyncThunk<
  string,
  string,
  { rejectValue: { message: string } }
>('documents/delete', async (id, thunkAPI) => {
  try {
    await documentService.deleteDocument(id);
    return id;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue({ message: error.response.data.message });
    }
    return thunkAPI.rejectWithValue({ message: 'Failed to delete document' });
  }
});

// Slice
const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    clearDocumentError(state) {
      state.isError = false;
      state.errorMessage = null;
    },
    clearCurrentDocument(state) {
      state.currentDocument = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch in workspace
      .addCase(fetchDocumentsInWorkspace.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.errorMessage = null;
      })
      .addCase(fetchDocumentsInWorkspace.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchDocumentsInWorkspace.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.errorMessage =
          (action.payload && action.payload.message) ||
          'Failed to fetch documents';
      })

      // fetch by id
      .addCase(fetchDocumentById.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.errorMessage = null;
      })
      .addCase(fetchDocumentById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentDocument = action.payload;
      })
      .addCase(fetchDocumentById.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.errorMessage =
          (action.payload && action.payload.message) ||
          'Failed to fetch document';
      })

      // create
      .addCase(createDocument.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.errorMessage = null;
      })
      .addCase(createDocument.fulfilled, (state, action) => {
        state.isLoading = false;
        const doc = action.payload;
        // push into current workspace list if workspace matches
        if (doc.workspaceId) {
          state.items.push({
            _id: doc._id,
            title: doc.title,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            isPinned: doc.isPinned,
            wordCount: doc.wordCount,
          });
        }
        state.currentDocument = doc;
      })
      .addCase(createDocument.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.errorMessage =
          (action.payload && action.payload.message) ||
          'Failed to create document';
      })

      // update
      .addCase(updateDocument.fulfilled, (state, action) => {
        state.isLoading = false;
        const updated = action.payload;
        state.items = state.items.map((doc) =>
          doc._id === updated._id
            ? {
                _id: updated._id,
                title: updated.title,
                createdAt: updated.createdAt,
                updatedAt: updated.updatedAt,
                isPinned: updated.isPinned,
                wordCount: updated.wordCount,
              }
            : doc,
        );
        if (state.currentDocument?._id === updated._id) {
          state.currentDocument = updated;
        }
      })
      .addCase(updateDocument.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.errorMessage =
          (action.payload && action.payload.message) ||
          'Failed to update document';
      })

      // delete
      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = state.items.filter((doc) => doc._id !== action.payload);
        if (state.currentDocument?._id === action.payload) {
          state.currentDocument = null;
        }
      })
      .addCase(deleteDocument.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.errorMessage =
          (action.payload && action.payload.message) ||
          'Failed to delete document';
      });
  },
});

export const { clearDocumentError, clearCurrentDocument } =
  documentsSlice.actions;

export default documentsSlice.reducer;
