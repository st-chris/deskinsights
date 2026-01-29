export interface DocumentSummary {
  _id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  wordCount: number;
}

export interface DocumentFull extends DocumentSummary {
  content: string;
  plainText: string;
  workspaceId: string;
  createdBy: string;
  lastEditedBy: string;
  characterCount: number;
  isArchived: boolean;
}

export interface CreateDocumentPayload {
  workspaceId: string;
  title?: string;
  content?: string;
}

export interface UpdateDocumentPayload {
  title?: string;
  content?: string;
}

export interface DocumentsState {
  items: DocumentSummary[]; // current workspace docs
  currentDocument: DocumentFull | null;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
}
