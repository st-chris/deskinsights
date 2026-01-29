import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler';
import { getDocumentWithAccess } from '../utils/documentHelpers';

// Get all versions for a document
export const getVersions = asyncHandler(
  async (request: Request, response: Response): Promise<void> => {
    const { documentId } = request.params;
    const userId = request.userId;

    // Use helper - handles all checks
    const result = await getDocumentWithAccess(documentId, userId, response);
    if (!result) return;

    const { document } = result;

    // Return versions in reverse chronological order (newest first)
    // Only last 10 versions
    const versions =
      document.versions
        ?.slice(-10)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .map((v) => ({
          versionNumber: v.versionNumber,
          timestamp: v.timestamp,
          preview: v.content.substring(0, 100) + '...',
          fullPreview:
            v.content.length > 3000
              ? v.content.substring(0, 3000) + '...'
              : v.content,
        })) || [];

    response.json(versions);
    return;
  },
);

// Get specific version content
export const getVersionContent = asyncHandler(
  async (request: Request, response: Response): Promise<void> => {
    const { documentId, versionNumber } = request.params;
    const userId = request.userId;

    // Use helper - handles all checks
    const result = await getDocumentWithAccess(documentId, userId, response);
    if (!result) return;

    const { document } = result;

    const versionNum = parseInt(versionNumber);
    const version = document.versions?.find(
      (v) => v.versionNumber === versionNum,
    );

    if (!version) {
      response.status(404).json({ error: 'Version not found' });
      return;
    }

    response.json({
      versionNumber: version.versionNumber,
      timestamp: version.timestamp,
      content: version.content,
    });
    return;
  },
);

// Restore a version (makes it the current content)
export const restoreVersion = asyncHandler(
  async (request: Request, response: Response): Promise<void> => {
    const { documentId, versionNumber } = request.params;
    const userId = request.userId;

    // Use helper - handles all checks
    const result = await getDocumentWithAccess(documentId, userId, response);
    if (!result) return;

    const { document } = result;

    const versionNum = parseInt(versionNumber);
    const version = document.versions?.find(
      (v) => v.versionNumber === versionNum,
    );

    if (!version) {
      response.status(404).json({ error: 'Version not found' });
      return;
    }
    // Determine next version number
    const maxVersion =
      document.versions && document.versions.length > 0
        ? Math.max(...document.versions.map((v) => Number(v.versionNumber)))
        : 0;
    const nextVersionNumber = maxVersion + 1;

    // Save current content as a new version before restoring
    const currentVersion = {
      content: document.content,
      timestamp: new Date(),
      versionNumber: nextVersionNumber,
    };

    // Initialize versions if needed
    if (!document.versions) {
      document.versions = [];
    }

    // Keep only last 10 versions
    if (document.versions.length >= 10) {
      document.versions.shift();
    }
    document.versions.push(currentVersion);

    // Restore the selected version
    document.content = version.content;
    document.lastEditedBy = new mongoose.Types.ObjectId(userId!);

    const updatedDocument = await document.save();
    response.json(updatedDocument);
    return;
  },
);
