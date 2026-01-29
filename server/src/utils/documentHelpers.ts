import { Response } from 'express';
import Document, { IDocument } from '../models/document';
import Workspace, { IWorkspace } from '../models/workspace';
import mongoose from 'mongoose';

/**
 * Fetches a document and checks if user has access to it
 * Returns the document and workspace if authorized, otherwise sends error response
 */
export const getDocumentWithAccess = async (
  docId: string,
  userId: string | undefined,
  response: Response
): Promise<{ document: IDocument; workspace: IWorkspace } | null> => {
  // Check userId exists
  if (!userId) {
    response.status(401).json({ error: 'Unauthorized' });
    return null;
  }

  // Validate document ID
  if (!mongoose.Types.ObjectId.isValid(docId)) {
    response.status(400).json({ error: 'Invalid document ID' });
    return null;
  }

  // Fetch document
  const document = await Document.findById(docId);
  if (!document) {
    response.status(404).json({ error: 'Document not found' });
    return null;
  }

  // Fetch workspace and check access
  const workspace = await Workspace.findById(document.workspaceId);
  const hasAccess =
    workspace?.ownerId.toString() === userId ||
    workspace?.members.some((m) => m.userId.toString() === userId);

  if (!hasAccess) {
    response.status(403).json({ error: 'Unauthorized' });
    return null;
  }

  return {
    document: document as IDocument,
    workspace: workspace as IWorkspace,
  };
};

/**
 * Fetches a workspace and checks if user has access to it
 */
export const getWorkspaceWithAccess = async (
  workspaceId: string,
  userId: string | undefined,
  response: Response
): Promise<IWorkspace | null> => {
  // Check userId exists
  if (!userId) {
    response.status(401).json({ error: 'Unauthorized' });
    return null;
  }

  if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
    response.status(400).json({ error: 'Invalid workspace ID' });
    return null;
  }

  // Fetch workspace
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    response.status(404).json({ error: 'Workspace not found' });
    return null;
  }

  // Check access
  const hasAccess =
    workspace.ownerId.toString() === userId ||
    workspace.members.some((m) => m.userId.toString() === userId);

  if (!hasAccess) {
    response.status(403).json({ error: 'Unauthorized' });
    return null;
  }

  return workspace;
};

// Owner only (update/delete)
export const getWorkspaceWithOwnerAccess = async (
  workspaceId: string,
  userId: string | undefined,
  response: Response
): Promise<IWorkspace | null> => {
  const workspace = await getWorkspaceWithAccess(workspaceId, userId, response);
  if (!workspace) return null;

  // Owner check
  if (workspace.ownerId.toString() !== userId) {
    response.status(403).json({ error: 'Only owner can perform this action' });
    return null;
  }

  return workspace;
};

export const getPlainTextWordCountCharCount = (
  content: string
): { plainText: string; wordCount: number; characterCount: number } => {
  const plainText = content.replace(/<[^>]*>/g, '');
  const wordCount = plainText.split(/\s+/).filter((w) => w).length;
  const characterCount = plainText.replace(/\s/g, '').length;

  return { plainText, wordCount, characterCount };
};
