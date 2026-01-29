import { Request, Response } from 'express';
import Workspace, { IWorkspace } from '../models/workspace';
import Document from '../models/document';
import { Types } from 'mongoose';
import {
  getWorkspaceWithAccess,
  getWorkspaceWithOwnerAccess,
} from '../utils/documentHelpers';
import { asyncHandler } from '../utils/asyncHandler';

interface WorkspaceBody {
  name: string;
  description?: string;
}

interface CountResult {
  _id: Types.ObjectId;
  count: number;
}

// Get all workspaces for current user
export const getWorkspacesForUser = asyncHandler(
  async (request: Request, response: Response): Promise<void> => {
    const userId = request.userId;

    const [workspaces, counts] = (await Promise.all([
      Workspace.find({
        $or: [{ ownerId: userId }, { 'members.userId': userId }],
        isArchived: false,
      })
        .select('name description ownerId createdAt updatedAt')
        .lean(),
      Document.aggregate([
        { $match: { isArchived: false } },
        { $group: { _id: '$workspaceId', count: { $sum: 1 } } },
      ]),
    ])) as [IWorkspace[], CountResult[]];

    const countMap = new Map<string, number>(
      counts.map((c) => [c._id.toString(), c.count])
    );

    const workspacesWithCounts = workspaces.map((ws) => ({
      ...ws,
      documentCount: countMap.get(ws._id.toString()) ?? 0,
    }));

    response.json(workspacesWithCounts);
    return;
  }
);

// Create workspace
export const createWorkspace = asyncHandler(
  async (
    request: Request<object, object, WorkspaceBody>,
    response: Response
  ): Promise<void> => {
    const { name, description } = request.body;
    const userId = request.userId;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      response.status(400).json({ error: 'Workspace name is required' });
      return;
    }

    const workspace = new Workspace({
      name: name.trim(),
      description: description?.trim() || '',
      ownerId: userId,
      members: [
        {
          userId: userId,
          role: 'owner',
        },
      ],
    });

    const savedWorkspace = await workspace.save();
    response.status(201).json(savedWorkspace);
    return;
  }
);

// Get workspace by ID
export const getWorkspaceById = asyncHandler(
  async (request: Request, response: Response): Promise<void> => {
    const { id } = request.params;
    const userId = request.userId;

    // Use helper to check workspace access
    const workspace = await getWorkspaceWithAccess(id, userId, response);
    if (!workspace) return;

    response.json(workspace);
  }
);

// Update workspace
export const updateWorkspace = asyncHandler(
  async (
    request: Request<{ id: string }, object, Partial<WorkspaceBody>>,
    response: Response
  ): Promise<void> => {
    const { id } = request.params;
    const { name, description } = request.body;
    const userId = request.userId;

    const workspace = await getWorkspaceWithOwnerAccess(id, userId, response); // Owner-only!
    if (!workspace) return;

    if (name) workspace.name = name.trim();
    if (description !== undefined)
      workspace.description = description?.trim() || '';

    const updatedWorkspace = await workspace.save();
    response.json(updatedWorkspace);
    return;
  }
);

export const deleteWorkspace = asyncHandler(
  async (request: Request, response: Response): Promise<void> => {
    const { id } = request.params;
    const userId = request.userId;

    const workspace = await getWorkspaceWithOwnerAccess(id, userId, response); // Owner-only!
    if (!workspace) return;

    workspace.isArchived = true;
    await workspace.save();

    // Archive all documents in workspace
    await Document.updateMany({ workspaceId: id }, { isArchived: true });

    response.json({ message: 'Workspace deleted' });
    return;
  }
);
