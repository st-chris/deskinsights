export interface Workspace {
  _id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  documentCount: number;
}

export interface CreateWorkspacePayload {
  name: string;
  description?: string;
}

export interface UpdateWorkspacePayload {
  name?: string;
  description?: string;
}

export interface WorkspacesState {
  items: Workspace[];
  selectedWorkspace: Workspace | null;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
}
