import bcrypt from 'bcrypt';
import User from '../models/user';
import supertest from 'supertest';
import app from '../app';

const api = supertest(app);

describe('Auth API', () => {
  beforeEach(async () => {
    await User.deleteMany({});

    const passwordHash = await bcrypt.hash('password123', 10);
    const user = new User({ email: 'root@test.com', passwordHash });

    await user.save();
  });

  describe('Login', () => {
    test('a user can log in with valid credentials', async () => {
      const loginData = {
        email: 'root@test.com',
        password: 'password123',
      };
      const response = await api
        .post('/api/auth')
        .send(loginData)
        .expect(200)
        .expect('Content-Type', /application\/json/);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('email', 'root@test.com');
      expect(response.body).toHaveProperty('id');
    });

    test('login fails with missing email or password', async () => {
      const loginData = {
        email: 'root@test.com',
      };
      const response = await api
        .post('/api/auth')
        .send(loginData)
        .expect(400)
        .expect('Content-Type', /application\/json/);

      const body = response.body as { error: string };
      expect(body.error).toBe(
        'Invalid input: expected string, received undefined'
      );
    });

    test('login fails with invalid credentials', async () => {
      const loginData = {
        email: 'root@test.com',
        password: 'wrongpassword',
      };
      const response = await api
        .post('/api/auth')
        .send(loginData)
        .expect(401)
        .expect('Content-Type', /application\/json/);

      const body = response.body as { error: string };

      expect(body.error).toBe('Invalid email or password');
    });

    test('login generates a valid token', async () => {
      const loginData = {
        email: 'root@test.com',
        password: 'password123',
      };

      const response = await api
        .post('/api/auth')
        .send(loginData)
        .expect(200)
        .expect('Content-Type', /application\/json/);

      const body = response.body as { token: string };
      const token = body.token;

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    describe('Login data validation', () => {
      test('login fails with invalid email address', async () => {
        const loginData = {
          email: 'ro',
          password: 'password',
        };
        const response = await api
          .post('/api/auth')
          .send(loginData)
          .expect(400)
          .expect('Content-Type', /application\/json/);

        const body = response.body as { error: string };
        expect(body.error).toBe('Invalid email address');
      });

      test('login fails with random login details', async () => {
        const loginData = {
          email: 'nonexistent@test.com',
          password: 'password123',
        };
        const response = await api
          .post('/api/auth')
          .send(loginData)
          .expect(401)
          .expect('Content-Type', /application\/json/);

        const body = response.body as { error: string };
        expect(body.error).toBe('Invalid email or password');
      });
    });
  });
  describe('Refresh Token', () => {
    test('refresh token with valid token', async () => {
      const loginData = {
        email: 'root@test.com',
        password: 'password123',
      };
      const loginResponse = await api
        .post('/api/auth')
        .send(loginData)
        .expect(200)
        .expect('Content-Type', /application\/json/);

      const refreshToken = loginResponse.headers['set-cookie'][0]
        .split(';')[0]
        .split('=')[1];

      const response = await api
        .post('/api/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(200)
        .expect('Content-Type', /application\/json/);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('email', 'root@test.com');
      expect(response.body).toHaveProperty('id');
    });

    test('refresh token fails with old token', async () => {
      const loginData = {
        email: 'root@test.com',
        password: 'password123',
      };
      const loginResponse = await api
        .post('/api/auth')
        .send(loginData)
        .expect(200)
        .expect('Content-Type', /application\/json/);

      const refreshToken = loginResponse.headers['set-cookie'][0]
        .split(';')[0]
        .split('=')[1];

      await api
        .post('/api/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(200)
        .expect('Content-Type', /application\/json/);

      const response2 = await api
        .post('/api/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(401)
        .expect('Content-Type', /application\/json/);

      const body = response2.body as { error: string };

      expect(body.error).toBe('Invalid refresh token');

      const cookies = response2.headers['set-cookie'];

      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('refreshToken=;');
    });

    test('refresh fails with invalid token', async () => {
      const response = await api
        .post('/api/auth/refresh')
        .set('Cookie', 'refreshToken=invalidToken')
        .expect(401)
        .expect('Content-Type', /application\/json/);

      const body = response.body as { error: string };

      expect(body.error).toBe('Invalid token');
    });

    test('refresh fails without token', async () => {
      const response = await api
        .post('/api/auth/refresh')
        .expect(401)
        .expect('Content-Type', /application\/json/);

      const body = response.body as { error: string };

      expect(body.error).toBe('Invalid refresh token');
    });
  });

  describe('Logout', () => {
    test('logout clears refresh token', async () => {
      const loginData = {
        email: 'root@test.com',
        password: 'password123',
      };

      const loginResponse = await api
        .post('/api/auth')
        .send(loginData)
        .expect(200)
        .expect('Content-Type', /application\/json/);

      const refreshToken = loginResponse.headers['set-cookie'][0]
        .split(';')[0]
        .split('=')[1];

      const response = await api
        .post('/api/auth/logout')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(204);

      const cookies = response.headers['set-cookie'];

      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('refreshToken=;');
    });

    test('logout without refresh token', async () => {
      await api.post('/api/auth/logout').expect(204);
    });

    test('logout with invalid refresh token', async () => {
      const response = await api
        .post('/api/auth/logout')
        .set('Cookie', 'refreshToken=invalidToken')
        .expect(401)
        .expect('Content-Type', /application\/json/);

      const body = response.body as { error: string };

      expect(body.error).toBe('Invalid token');
    });
  });
});
