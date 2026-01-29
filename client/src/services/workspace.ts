import type {
  Workspace,
  CreateWorkspacePayload,
  UpdateWorkspacePayload,
} from '../models/workspace';
import api from './api';

const baseUrl = '/workspaces';

// Get all workspaces for current user
const getWorkspaces = async (): Promise<Workspace[]> => {
  const response = await api.get<Workspace[]>(baseUrl);
  return response.data;
};

// Get single workspace by id
const getWorkspaceById = async (id: string): Promise<Workspace> => {
  const response = await api.get<Workspace>(`${baseUrl}/${id}`);
  return response.data;
};

// Create workspace
const createWorkspace = async (
  payload: CreateWorkspacePayload
): Promise<Workspace> => {
  const response = await api.post<Workspace>(baseUrl, payload);
  return response.data;
};

// Update workspace
const updateWorkspace = async (
  id: string,
  payload: UpdateWorkspacePayload
): Promise<Workspace> => {
  const response = await api.put<Workspace>(`${baseUrl}/${id}`, payload);
  return response.data;
};

// Delete workspace (soft delete / archive)
const deleteWorkspace = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`${baseUrl}/${id}`);
  return response.data;
};

const workspaceService = {
  getWorkspaces,
  getWorkspaceById,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
};

export default workspaceService;
