import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../types/redux';

export const selectDocumentState = (state: RootState) => state.documents;

export const selectDocumentItems = createSelector(
  selectDocumentState,
  (documents) => documents.items,
);

export const selectCurrentDocument = createSelector(
  selectDocumentState,
  (documents) => documents.currentDocument,
);

export const selectDocumentLoading = createSelector(
  selectDocumentState,
  (documents) => documents.isLoading,
);

export const selectDocumentError = createSelector(
  selectDocumentState,
  (documents) => ({
    isError: documents.isError,
    errorMessage: documents.errorMessage,
  }),
);

export const selectDocuments = createSelector(
  selectDocumentState,
  (documents) => ({
    items: documents.items,
    currentDocument: documents.currentDocument,
    isLoading: documents.isLoading,
    isError: documents.isError,
    errorMessage: documents.errorMessage,
  }),
);
