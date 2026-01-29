import bcrypt from 'bcrypt';
import User from '../models/user';
import supertest from 'supertest';
import app from '../app';

const api = supertest(app);

describe.skip('Rate Limiting - Login', () => {
  beforeEach(async () => {
    await User.deleteMany({});

    const passwordHash = await bcrypt.hash('password123', 10);
    const user = new User({ email: 'root@test.com', passwordHash });

    await user.save();
  });

  it('blocks after 5 login attempts', async () => {
    // 5 successful logins
    for (let i = 0; i < 5; i++) {
      await api
        .post('/api/auth')
        .send({ email: 'root@test.com', password: 'password123' })
        .expect(200);
    }

    // 6th fails
    const res = await api
      .post('/api/auth')
      .send({ email: 'root@test.com', password: 'password123' })
      .expect(429); // Too Many Requests

    const body = res.body as { error: string };
    expect(body.error).toContain('Too many login attempts');
    expect(res.headers['x-ratelimit-remaining']).toBe('0');
  });
});
