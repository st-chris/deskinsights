import type {
  CreateDocumentPayload,
  DocumentFull,
  DocumentSummary,
  UpdateDocumentPayload,
} from '../models/document';
import api from './api';

const baseUrl = '/documents';

// Create document
const createDocument = async (
  payload: CreateDocumentPayload
): Promise<DocumentFull> => {
  const response = await api.post<DocumentFull>(baseUrl, payload);
  return response.data;
};

// Get documents in workspace
const getDocumentsInWorkspace = async (
  workspaceId: string
): Promise<DocumentSummary[]> => {
  const response = await api.get<DocumentSummary[]>(
    `${baseUrl}/workspace/${workspaceId}`
  );
  return response.data;
};

// Get single document
const getDocumentById = async (id: string): Promise<DocumentFull> => {
  const response = await api.get<DocumentFull>(`${baseUrl}/${id}`);
  return response.data;
};

// Update document
const updateDocument = async (
  id: string,
  payload: UpdateDocumentPayload
): Promise<DocumentFull> => {
  const response = await api.put<DocumentFull>(`${baseUrl}/${id}`, payload);
  return response.data;
};

// Delete document (archive)
const deleteDocument = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`${baseUrl}/${id}`);
  return response.data;
};

const documentService = {
  createDocument,
  getDocumentsInWorkspace,
  getDocumentById,
  updateDocument,
  deleteDocument,
};

export default documentService;
