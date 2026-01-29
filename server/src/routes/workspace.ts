import { Router } from 'express';
import { isAuthenticated } from '../utils/middleware';
import * as workspaceController from '../controllers/workspace';

const workspaceRouter = Router();

workspaceRouter.use(isAuthenticated);

// Get all workspaces for current user
workspaceRouter.get('/', workspaceController.getWorkspacesForUser);

// Create workspace
workspaceRouter.post('/', workspaceController.createWorkspace);

// Get workspace by ID
workspaceRouter.get('/:id', workspaceController.getWorkspaceById);

// Update workspace
workspaceRouter.put('/:id', workspaceController.updateWorkspace);

// Delete workspace
workspaceRouter.delete('/:id', workspaceController.deleteWorkspace);

export default workspaceRouter;
