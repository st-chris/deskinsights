import bcrypt from 'bcrypt';
import User from '../models/user';
import supertest from 'supertest';
import app from '../app';

const api = supertest(app);

describe.skip('Rate Limiting - Workspace', () => {
  beforeEach(async () => {
    await User.deleteMany({});

    const passwordHash = await bcrypt.hash('password123', 10);
    const user = new User({ email: 'root@test.com', passwordHash });

    await user.save();
  });

  it('workspaces respects 50 req limit', async () => {
    // Login
    const loginResponse = await api
      .post('/api/auth')
      .send({ email: 'root@test.com', password: 'password123' })
      .expect(200);

    const responseBody = loginResponse.body as { token: string };
    const userToken = responseBody.token;

    // GET /api/workspaces 51x
    const responses = await Promise.all(
      Array(51)
        .fill(0)
        .map(() =>
          api.get('/api/workspaces').set('Authorization', 'Bearer ' + userToken)
        )
    );

    expect(responses[50].status).toBe(429); // 51st fails
  });
});
