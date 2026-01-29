import supertest from 'supertest';
import app from '../app';
import * as helper from './helper';
import User from '../models/user';
import bcrypt from 'bcrypt';

const api = supertest(app);

describe('Users API', () => {
  beforeEach(async () => {
    await User.deleteMany({});

    const passwordHash = await bcrypt.hash('password123', 10);
    const user = new User({ email: 'root@test.com', passwordHash });

    await user.save();
  });

  test('a new user can be added', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      email: 'johndoe23@test.com',
      name: 'John Doe',
      password: 'password123',
      confirmPassword: 'password123',
    };

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd.length).toEqual(usersAtStart.length + 1);

    const usernames = usersAtEnd.map((u) => u.email);
    expect(usernames).toContain(newUser.email);
  });

  test('email has to be unique', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      email: 'root@test.com',
      name: 'John Doe',
      password: 'password123',
      confirmPassword: 'password123',
    };

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    const body = response.body as { error: string };

    expect(body.error).toBe('Expected `email` to be unique');

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd.length).toEqual(usersAtStart.length);
  });

  test('get all users without begin authenticated', async () => {
    const response = await api
      .get('/api/users')
      .expect(401)
      .expect('Content-Type', /application\/json/);

    const body = response.body as { error: string };

    expect(body.error).toBe('Token missing or invalid');
  });

  test('get all users with invalid token', async () => {
    const response = await api
      .get('/api/users')
      .set('Authorization', 'Bearer invalidToken')
      .expect(401)
      .expect('Content-Type', /application\/json/);

    const body = response.body as { error: string };

    expect(body.error).toBe('Invalid token');
  });

  test('get all users with valid token', async () => {
    const payload = {
      email: 'root@test.com',
      password: 'password123',
    };

    const loginResponse = await api.post('/api/auth').send(payload).expect(200);

    const loginResponseBody = loginResponse.body as { token: string };

    const token = loginResponseBody.token;

    const getUsersResponse = await api
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const body = getUsersResponse.body as { email: string }[];

    expect(body.length).toBeGreaterThan(0);
    expect(body[0].email).toBe(payload.email);
  });
});
