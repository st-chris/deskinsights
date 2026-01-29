import type {
  DocumentFull,
  DocumentsState,
  DocumentSummary,
  UpdateDocumentPayload,
} from '../../models/document';
import documentsReducer, {
  fetchDocumentsInWorkspace,
  fetchDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  clearDocumentError,
  clearCurrentDocument,
} from './document';

const initialState: DocumentsState = {
  items: [],
  currentDocument: null,
  isLoading: false,
  isError: false,
  errorMessage: null,
};

const mockSummaries: DocumentSummary[] = [
  {
    _id: '1',
    title: 'Doc1',
    createdAt: '2023',
    updatedAt: '2023',
    isPinned: false,
    wordCount: 100,
  },
];

const mockFullDoc: DocumentFull = {
  _id: '1',
  title: 'Full Doc',
  workspaceId: 'ws1',
  createdAt: '2023',
  updatedAt: '2023',
  isPinned: true,
  wordCount: 150,
  content: 'Some **markdown** content',
  plainText: 'Some markdown content',
  createdBy: 'user1',
  lastEditedBy: 'user1',
  characterCount: 200,
  isArchived: false,
};

describe('Documents Reducer', () => {
  it('should return the initial state', () => {
    expect(documentsReducer(undefined, { type: 'unknown' })).toEqual(
      initialState,
    );
  });

  // Sync reducers
  it('should handle clearDocumentError', () => {
    const state = { ...initialState, isError: true, errorMessage: 'Error' };
    const nextState = documentsReducer(state, clearDocumentError());
    expect(nextState.isError).toBe(false);
    expect(nextState.errorMessage).toBeNull();
  });

  it('should handle clearCurrentDocument', () => {
    const state = { ...initialState, currentDocument: mockFullDoc };
    const nextState = documentsReducer(state, clearCurrentDocument());
    expect(nextState.currentDocument).toBeNull();
  });

  // fetchDocumentsInWorkspace
  it('should handle fetchDocumentsInWorkspace.pending', () => {
    const nextState = documentsReducer(
      initialState,
      fetchDocumentsInWorkspace.pending('req1', 'ws1'),
    );
    expect(nextState.isLoading).toBe(true);
    expect(nextState.isError).toBe(false);
    expect(nextState.errorMessage).toBeNull();
  });

  it('should handle fetchDocumentsInWorkspace.fulfilled', () => {
    const nextState = documentsReducer(initialState, {
      type: fetchDocumentsInWorkspace.fulfilled.type,
      payload: mockSummaries,
    });
    expect(nextState.isLoading).toBe(false);
    expect(nextState.items).toEqual(mockSummaries);
  });

  it('should handle fetchDocumentsInWorkspace.rejected', () => {
    const nextState = documentsReducer(initialState, {
      type: fetchDocumentsInWorkspace.rejected.type,
      payload: { message: 'Fetch failed' },
    });
    expect(nextState.isLoading).toBe(false);
    expect(nextState.isError).toBe(true);
    expect(nextState.errorMessage).toBe('Fetch failed');
  });

  // fetchDocumentById (similar pattern)
  it('should handle fetchDocumentById.fulfilled', () => {
    const nextState = documentsReducer(initialState, {
      type: fetchDocumentById.fulfilled.type,
      payload: mockFullDoc,
    });
    expect(nextState.currentDocument).toEqual(mockFullDoc);
  });

  // createDocument
  it('should handle createDocument.fulfilled', () => {
    const nextState = documentsReducer(initialState, {
      type: createDocument.fulfilled.type,
      payload: mockFullDoc,
    });
    expect(nextState.currentDocument).toEqual(mockFullDoc);
    expect(nextState.items).toContainEqual(
      expect.objectContaining({ _id: '1', title: 'Full Doc' }),
    );
  });

  // updateDocument
  it('should handle updateDocument.fulfilled', () => {
    const stateWithItems = {
      ...initialState,
      items: mockSummaries,
      currentDocument: mockFullDoc,
    };

    const updatedDoc = {
      ...mockFullDoc,
      title: 'Updated Title',
      wordCount: 200,
      updatedAt: new Date().toISOString(),
      characterCount: 500,
      content: 'Updated content',
    };

    const nextState = documentsReducer(stateWithItems, {
      type: updateDocument.fulfilled.type,
      payload: updatedDoc,
      meta: {
        arg: {
          id: '1',
          payload: { title: 'Updated Title' } as UpdateDocumentPayload,
        },
        requestStatus: 'fulfilled',
      },
    });

    expect(nextState.items[0]).toEqual({
      _id: '1',
      title: 'Updated Title',
      createdAt: updatedDoc.createdAt,
      updatedAt: updatedDoc.updatedAt,
      isPinned: updatedDoc.isPinned,
      wordCount: 200,
    });
    expect(nextState.currentDocument).toEqual(updatedDoc);
    expect(nextState.isLoading).toBe(false);
  });

  it('should update items but NOT currentDocument if IDs dont match', () => {
    const stateWithItems = {
      ...initialState,
      items: [
        {
          _id: '1',
          title: 'Doc1',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          isPinned: false,
          wordCount: 100,
        },
      ],
      currentDocument: {
        _id: '999',
        title: 'Other Doc',
        workspaceId: 'ws1',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
        isPinned: false,
        wordCount: 50,
        content: 'Other document content',
        characterCount: 100,
        createdBy: 'user1',
        lastEditedBy: 'user1',
        isArchived: false,
        plainText: 'Other plain text',
      },
    };

    const updatedDoc = {
      _id: '1',
      title: 'Updated Title',
      workspaceId: 'ws1',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2026-01-21T16:38:00.000Z',
      isPinned: true,
      wordCount: 200,
      content: 'Updated **markdown** content',
      characterCount: 500,
      createdBy: 'user1',
      lastEditedBy: 'user1',
      isArchived: false,
      plainText: 'Updated markdown content',
    };

    const action = {
      type: updateDocument.fulfilled.type,
      payload: updatedDoc,
      meta: {
        arg: {
          id: '1',
          payload: {
            title: 'Updated Title',
          },
        },
        requestStatus: 'fulfilled',
        requestId: 'test-request-id',
      },
    };

    const nextState = documentsReducer(stateWithItems, action);

    expect(nextState.items).toHaveLength(1);
    expect(nextState.items[0]).toStrictEqual({
      _id: '1',
      title: 'Updated Title',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2026-01-21T16:38:00.000Z',
      isPinned: true,
      wordCount: 200,
    });

    expect(nextState.currentDocument?._id).toBe('999');
    expect(nextState.currentDocument?.title).toBe('Other Doc');
    expect(nextState.isLoading).toBe(false);
  });

  // deleteDocument
  it('should handle deleteDocument.fulfilled', () => {
    const stateWithItems = {
      ...initialState,
      items: mockSummaries,
      currentDocument: mockFullDoc,
    };
    const nextState = documentsReducer(stateWithItems, {
      type: deleteDocument.fulfilled.type,
      payload: '1',
    });
    expect(nextState.items).toEqual([]);
    expect(nextState.currentDocument).toBeNull();
  });
});
