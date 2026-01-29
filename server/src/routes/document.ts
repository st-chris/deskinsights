import { Router } from 'express';
import { isAuthenticated } from '../utils/middleware';
import * as documentsController from '../controllers/document';
import * as versionController from '../controllers/document-version';

const documentRouter = Router();

documentRouter.use(isAuthenticated);

// Create document
documentRouter.post('/', documentsController.createDocument);

// Get documents in workspace
documentRouter.get('/workspace/:workspaceId', documentsController.getDocuments);

// Version routes (must come before /:id routes)
// Get versions for a document
documentRouter.get('/:documentId/versions', versionController.getVersions);

// Get specific version content
documentRouter.get(
  '/:documentId/versions/:versionNumber',
  versionController.getVersionContent,
);

// Restore a specific version
documentRouter.post(
  '/:documentId/versions/:versionNumber/restore',
  versionController.restoreVersion,
);

// Get single document
documentRouter.get('/:id', documentsController.getDocumentById);

// Update document
documentRouter.put('/:id', documentsController.updateDocument);

// Delete document
documentRouter.delete('/:id', documentsController.deleteDocument);

export default documentRouter;
