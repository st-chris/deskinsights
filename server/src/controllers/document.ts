import { Request, Response } from 'express';
import Document from '../models/document';
import mongoose from 'mongoose';
import {
  getDocumentWithAccess,
  getPlainTextWordCountCharCount,
  getWorkspaceWithAccess,
} from '../utils/documentHelpers';
import { sanitizeDocumentContent, sanitizeTitle } from '../utils/sanitizer';
import { asyncHandler } from '../utils/asyncHandler';

interface DocumentBody {
  title?: string;
  content?: string;
  workspaceId?: string;
}

// Create document in workspace
export const createDocument = asyncHandler(
  async (
    request: Request<object, object, DocumentBody>,
    response: Response,
  ): Promise<void> => {
    const { title, content, workspaceId } = request.body;
    const userId = request.userId!;

    if (!workspaceId || !mongoose.Types.ObjectId.isValid(workspaceId)) {
      response.status(400).json({ error: 'Valid Workspace ID is required' });
      return;
    }

    const workspace = await getWorkspaceWithAccess(
      workspaceId,
      userId,
      response,
    );
    if (!workspace) return;

    // Sanitize title and content
    const safeTitle = sanitizeTitle(title ?? 'Untitled Document');
    const safeContent = sanitizeDocumentContent(content || '');

    const { plainText, wordCount, characterCount } =
      getPlainTextWordCountCharCount(safeContent);

    const document = new Document({
      title: safeTitle,
      content: safeContent,
      plainText,
      workspaceId,
      createdBy: userId,
      lastEditedBy: userId,
      wordCount,
      characterCount,
    });

    const savedDocument = await document.save();
    response.status(201).json(savedDocument);
  },
);

// Get documents in workspace
export const getDocuments = asyncHandler(
  async (
    request: Request<{ workspaceId: string }>,
    response: Response,
  ): Promise<void> => {
    const { workspaceId } = request.params;
    const userId = request.userId;

    // Use helper to check workspace access
    const workspace = await getWorkspaceWithAccess(
      workspaceId,
      userId,
      response,
    );
    if (!workspace) return;

    const documents = await Document.find({
      workspaceId,
      isArchived: false,
    })
      .select('title createdAt updatedAt isPinned wordCount')
      .lean()
      .sort({ isPinned: -1, updatedAt: -1 });

    response.json(documents);
    return;
  },
);

// Get single document
export const getDocumentById = asyncHandler(
  async (
    request: Request<{ id: string }>,
    response: Response,
  ): Promise<void> => {
    const { id } = request.params;
    const userId = request.userId;

    // Use helper - handles all checks
    const result = await getDocumentWithAccess(id, userId, response);
    if (!result) return;

    const populatedDocument = await Document.findById(id)
      .populate('createdBy', 'name email')
      .populate('lastEditedBy', 'name email');

    response.json(populatedDocument);
    return;
  },
);

// Update document
export const updateDocument = asyncHandler(
  async (
    request: Request<{ id: string }, object, DocumentBody>,
    response: Response,
  ): Promise<void> => {
    const { id } = request.params;
    const { title, content } = request.body;
    const userId = request.userId;

    const result = await getDocumentWithAccess(id, userId, response);
    if (!result) return;

    const { document } = result;

    if (content !== undefined && content !== document.content) {
      // Skip version if old content is effectively empty
      const oldContent = (document.content || '').trim();
      if (oldContent.length > 10) {
        // Only version meaningful changes
        const maxVersion =
          document.versions && document.versions.length > 0
            ? Math.max(...document.versions.map((v) => Number(v.versionNumber)))
            : 0;
        const nextVersionNumber = maxVersion + 1;

        const currentVersion = {
          content: document.content || '',
          timestamp: new Date(),
          versionNumber: nextVersionNumber,
        };

        // Initialize versions array if it doesn't exist
        if (!document.versions) {
          document.versions = [];
        }

        // Keep only last 10 versions
        if (document.versions.length >= 10) {
          document.versions.shift();
        }
        document.versions.push(currentVersion);
      }
    }

    if (title !== undefined) {
      document.title = sanitizeTitle(title);
    }

    if (content !== undefined) {
      const safeContent = sanitizeDocumentContent(content);
      document.content = safeContent;
      Object.assign(document, getPlainTextWordCountCharCount(safeContent));
    }

    document.lastEditedBy = new mongoose.Types.ObjectId(userId!);
    const updatedDocument = await document.save();
    response.json(updatedDocument);
  },
);

// Delete document
export const deleteDocument = asyncHandler(
  async (
    request: Request<{ id: string }>,
    response: Response,
  ): Promise<void> => {
    const { id } = request.params;
    const userId = request.userId;

    const result = await getDocumentWithAccess(id, userId, response);
    if (!result) return;

    const { document } = result;

    document.isArchived = true;
    await document.save();

    response.json({ message: 'Document deleted' });
    return;
  },
);
