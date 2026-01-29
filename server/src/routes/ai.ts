import { Router } from 'express';
import { isAuthenticated } from '../utils/middleware';
import {
  chatWithDocument,
  expandText,
  generateDocumentSummary,
  rewriteText,
  summarizeText,
} from '../controllers/ai';

const aiRouter = Router();

aiRouter.use(isAuthenticated);

aiRouter.post('/summarize', summarizeText);
aiRouter.post('/rewrite', rewriteText);
aiRouter.post('/expand', expandText);

// Sidebar routes
aiRouter.post('/document-summary', generateDocumentSummary);
aiRouter.post('/chat', chatWithDocument);

export default aiRouter;
