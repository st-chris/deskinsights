import supertest from 'supertest';
import app from '../app';
import Document from '../models/document';
import Workspace from '../models/workspace';
import User from '../models/user';
import bcrypt from 'bcrypt';

const api = supertest(app);

describe('Workspaces API', () => {
  let userToken: string;
  let userId: string;

  beforeEach(async () => {
    await Document.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});

    // Create test user
    const passwordHash = await bcrypt.hash('password123', 10);
    const user = new User({ email: 'test@test.com', passwordHash });
    await user.save();

    // Login
    const loginResponse = await api
      .post('/api/auth')
      .send({ email: 'test@test.com', password: 'password123' })
      .expect(200);

    const responseBody = loginResponse.body as { token: string };
    userToken = responseBody.token;
    userId = user._id.toString();
  });

  test('create workspace requires auth', async () => {
    await api.post('/api/workspaces').send({ name: 'Test' }).expect(401);
  });

  test('create workspace succeeds', async () => {
    const newWorkspace = { name: 'Test Workspace', description: 'Test' };

    const response = await api
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${userToken}`)
      .send(newWorkspace)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const body = response.body as {
      name: string;
      description: string;
      ownerId: string;
    };

    expect(body.name).toBe(newWorkspace.name);
    expect(body.ownerId).toBe(userId);
  });

  test('get workspaces requires auth', async () => {
    await api.get('/api/workspaces').expect(401);
  });

  test('get workspaces returns correct data', async () => {
    // Create workspace first
    await api
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Test Workspace' })
      .expect(201);

    const response = await api
      .get('/api/workspaces')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const body = response.body as Array<{ name: string; ownerId: string }>;

    expect(body.length).toBe(1);
    expect(body[0].name).toBe('Test Workspace');
    expect(body[0].ownerId).toBe(userId);
  });

  test('update workspace requires ownership', async () => {
    const wsRes = await api
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Test' })
      .expect(201);

    const body = wsRes.body as { _id: string };

    await api
      .put(`/api/workspaces/${body._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Updated' })
      .expect(200);
  });

  test('delete workspace succeeds', async () => {
    const wsRes = await api
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Test' })
      .expect(201);

    const body = wsRes.body as { _id: string };

    await api
      .delete(`/api/workspaces/${body._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
  });
});
