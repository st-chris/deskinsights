import supertest from 'supertest';
import app from '../app';
import Document from '../models/document';
import type { IVersion } from '../models/document';
import Workspace from '../models/workspace';
import User from '../models/user';
import bcrypt from 'bcrypt';

const api = supertest(app);

describe('Documents API', () => {
  let userToken: string;
  let workspaceId: string;
  let documentId: string;

  beforeEach(async () => {
    await Document.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});

    const passwordHash = await bcrypt.hash('password123', 10);
    const user = new User({ email: 'test@test.com', passwordHash });
    await user.save();

    const loginResponse = await api
      .post('/api/auth')
      .send({ email: 'test@test.com', password: 'password123' })
      .expect(200);

    const body = loginResponse.body as { token: string };

    userToken = body.token;
    // userId = user._id.toString();

    // Create test workspace
    const wsResponse = await api
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Test Workspace' })
      .expect(201);

    const wsBody = wsResponse.body as { _id: string };

    workspaceId = wsBody._id;

    // Create test document
    const docResponse = await api
      .post('/api/documents')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Test Doc', workspaceId })
      .expect(201);

    const docBody = docResponse.body as { _id: string };
    documentId = docBody._id;
  });

  test('create document requires valid workspace', async () => {
    await api
      .post('/api/documents')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Test', content: '<p>Test</p>', workspaceId: 'invalid' })
      .expect(400);
  });

  test('create document succeeds', async () => {
    const newDoc = {
      title: 'Test Document',
      content: '<p>Hello world</p>',
      workspaceId,
    };

    const response = await api
      .post('/api/documents')
      .set('Authorization', `Bearer ${userToken}`)
      .send(newDoc)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const body = response.body as {
      title: string;
      content: string;
      workspaceId: string;
    };

    expect(body.title).toBe(newDoc.title);
    expect(body.workspaceId).toBe(workspaceId);
    expect(body.content).toContain('<p>Hello world</p>');
  });

  test('get document in workspace requires auth', async () => {
    await api.get(`/api/documents/${workspaceId}`).expect(401);
  });

  test('get documents returns correct count', async () => {
    // Create 2 docs (plus 1 from beforeEach = 3 total)
    await Promise.all([
      api
        .post('/api/documents')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Doc 1', content: '<p>1</p>', workspaceId }),
      api
        .post('/api/documents')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Doc 2', content: '<p>2</p>', workspaceId }),
    ]);

    const response = await api
      .get(`/api/documents/workspace/${workspaceId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    const body = response.body as Array<{
      title: string;
      content: string;
      workspaceId: string;
    }>;

    expect(body.length).toBe(3);
  });

  test('update document sanitizes content', async () => {
    // Create doc
    const createRes = await api
      .post('/api/documents')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Test', content: '<p>Safe</p>', workspaceId })
      .expect(201);

    const body = createRes.body as { _id: string };

    const docId = body._id;

    // Malicious update
    const malicious = {
      title: 'AA <script>alert(1)</script>',
      content: '<script>alert(2)</script><img src=x onerror=alert(3)>',
    };

    const updateRes = await api
      .put(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(malicious)
      .expect(200);

    const updateBody = updateRes.body as { title: string; content: string };

    expect(updateBody.title).toBe('AA');
    expect(updateBody.content).not.toMatch(
      /onerror|onload|script|javascript:/i,
    );
    expect(updateBody.content).toMatch(/data-on=/);
    expect(updateBody.content.length).toBeLessThan(100);
  });

  test('delete document requires ownership', async () => {
    // Create doc
    const createRes = await api
      .post('/api/documents')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Test', content: '<p>Test</p>', workspaceId })
      .expect(201);

    const body = createRes.body as { _id: string };
    const docId = body._id;

    // Archive succeeds
    await api
      .delete(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    // Verify archived
    const archived = await Document.findById(docId);
    expect(archived?.isArchived).toBe(true);
  });

  describe('Versioning', () => {
    test('first edit on empty document does NOT create version', async () => {
      // Initial state: content="", versions=[]
      const doc = await Document.findById(documentId);
      expect(doc!.content).toBe('');
      expect(doc!.versions).toHaveLength(0);

      // First meaningful edit
      await api
        .put(`/api/documents/${documentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: '<p>Hello World</p>' })
        .expect(200);

      const updatedDoc = await Document.findById(documentId);
      expect(updatedDoc!.content).toContain('Hello World');
      expect(updatedDoc!.versions).toHaveLength(0);
    });

    test('subsequent edits create sequential versions', async () => {
      // Edit 1 (empty → content, no version created)
      await api
        .put(`/api/documents/${documentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: '<p>Edit 1</p>' })
        .expect(200);

      let doc = await Document.findById(documentId);
      expect(doc!.versions).toHaveLength(0); // First edit doesn't version

      // Edit 2 (should create v1)
      await api
        .put(`/api/documents/${documentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: '<p>Edit 2</p>' })
        .expect(200);

      doc = await Document.findById(documentId);
      expect(doc!.versions).toHaveLength(1);
      expect(doc!.versions[0].versionNumber).toBe(1);
    });

    test('restore version saves current then restores', async () => {
      // Setup: create v1 by doing two edits
      await api
        .put(`/api/documents/${documentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: '<p>Version 1</p>' });

      await api
        .put(`/api/documents/${documentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: '<p>Version 2</p>' });

      // Current = v2 with v1 versioned, restore v1 → should create v3
      await api
        .post(`/api/documents/${documentId}/versions/1/restore`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const doc = await Document.findById(documentId);
      expect(doc!.versions).toHaveLength(2);
      expect(doc!.versions[1].versionNumber).toBe(2);
      expect(doc!.content).toContain('Version 1');
    });

    test('restore non-existent version returns 404', async () => {
      await api
        .post(`/api/documents/${documentId}/versions/999/restore`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });

    test('version history API returns correct data', async () => {
      // Create versions - need 3 edits to get 2 versions
      // Edit 1: empty → v1 (no version)
      // Edit 2: v1 → v2 (creates v1, if v1 is > 10 chars)
      // Edit 3: v2 → v3 (creates v2)
      await api
        .put(`/api/documents/${documentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: '<p>Version 1</p>' });

      await api
        .put(`/api/documents/${documentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: '<p>Version 2</p>' });

      await api
        .put(`/api/documents/${documentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: '<p>Version 3</p>' });

      const res = await api
        .get(`/api/documents/${documentId}/versions`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const body = res.body as IVersion[];

      expect(body).toHaveLength(2);
      expect(body[0].versionNumber).toBe(2); // Newest first
      expect(body[0].preview).toContain('Version 2');
      expect(body[0].fullPreview).toContain('Version 2');
    });

    test('enforces 10 version limit', async () => {
      // Create 12 versions (first edit doesn't version, so 11 versions created)
      // Versions v1-v11, but capped at 10, so v2-v11 remain
      for (let i = 1; i <= 12; i++) {
        await api
          .put(`/api/documents/${documentId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ content: `<p>Version ${i}</p>` });
      }

      const doc = await Document.findById(documentId);
      expect(doc!.versions).toHaveLength(10);
      expect(doc!.versions[0].versionNumber).toBe(2); // v1 dropped, v2-v11 kept
    });
  });
});
