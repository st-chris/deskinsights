// Mock OpenAI and Gemini
jest.mock('openai', () => {
  const mockCreate = jest.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: 'AI generated result',
        },
      },
    ],
    usage: {
      total_tokens: 100,
    },
  });

  const MockOpenAI = jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));

  return {
    __esModule: true,
    OpenAI: MockOpenAI,
    default: MockOpenAI,
  };
});

jest.mock('@google/genai', () => {
  const mockGenerateContent = jest.fn().mockResolvedValue({
    text: 'AI generated result',
  });

  const MockGoogleGenAI = jest.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  }));

  return {
    __esModule: true,
    GoogleGenAI: MockGoogleGenAI,
    default: MockGoogleGenAI,
  };
});

import supertest from 'supertest';
import app from '../app';
import User from '../models/user';
import bcrypt from 'bcrypt';

const api = supertest(app);

describe('AI API', () => {
  let userToken: string;

  beforeEach(async () => {
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
  });

  describe('POST /api/ai/summarize', () => {
    test('summarize requires authentication', async () => {
      await api
        .post('/api/ai/summarize')
        .send({ text: 'Some text to summarize' })
        .expect(401);
    });

    test('summarize requires text', async () => {
      const response = await api
        .post('/api/ai/summarize')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ text: '' })
        .expect(400);

      const body = response.body as { error: string };
      expect(body.error).toBe('Text is required');
    });

    test('summarize succeeds with valid text', async () => {
      const response = await api
        .post('/api/ai/summarize')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ text: 'This is a long text that needs summarization.' })
        .expect(200)
        .expect('Content-Type', /application\/json/);

      const body = response.body as { result: string };
      expect(body.result).toBe('AI generated result');
    });
  });

  describe('POST /api/ai/rewrite', () => {
    test('rewrite requires authentication', async () => {
      await api
        .post('/api/ai/rewrite')
        .send({ text: 'Some text to rewrite' })
        .expect(401);
    });

    test('rewrite requires text', async () => {
      await api
        .post('/api/ai/rewrite')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(400);
    });

    test('rewrite succeeds with default tone', async () => {
      const response = await api
        .post('/api/ai/rewrite')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ text: 'Original text here.' })
        .expect(200)
        .expect('Content-Type', /application\/json/);

      const body = response.body as { result: string };
      expect(body.result).toBe('AI generated result');
    });

    test('rewrite succeeds with custom tone', async () => {
      const response = await api
        .post('/api/ai/rewrite')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ text: 'Original text here.', tone: 'casual' })
        .expect(200);

      const body = response.body as { result: string };
      expect(body.result).toBe('AI generated result');
    });
  });

  describe('POST /api/ai/expand', () => {
    test('expand requires authentication', async () => {
      await api.post('/api/ai/expand').send({ text: 'Short text' }).expect(401);
    });

    test('expand requires text', async () => {
      await api
        .post('/api/ai/expand')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(400);
    });

    test('expand succeeds with valid text', async () => {
      const response = await api
        .post('/api/ai/expand')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ text: 'Short text.' })
        .expect(200)
        .expect('Content-Type', /application\/json/);

      const body = response.body as { result: string };
      expect(body.result).toBe('AI generated result');
    });
  });

  describe('POST /api/ai/document-summary', () => {
    test('document summary requires authentication', async () => {
      await api
        .post('/api/ai/document-summary')
        .send({ text: 'Document text' })
        .expect(401);
    });

    test('document summary requires text', async () => {
      const response = await api
        .post('/api/ai/document-summary')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ text: '' })
        .expect(400);

      const body = response.body as { error: string };
      expect(body.error).toBe('Text is required');
    });

    test('document summary succeeds with valid text', async () => {
      const response = await api
        .post('/api/ai/document-summary')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ text: 'Long document text for summarization.' })
        .expect(200);

      const body = response.body as { summary: string; insights: string[] };
      expect(body.summary).toBeTruthy();
      expect(Array.isArray(body.insights)).toBe(true);
    });
  });

  describe('POST /api/ai/chat', () => {
    test('chat requires authentication', async () => {
      await api
        .post('/api/ai/chat')
        .send({ text: 'Document text', query: 'What is this about?' })
        .expect(401);
    });

    test('chat requires query', async () => {
      const response = await api
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ text: 'Document text', query: '' })
        .expect(400);

      const body = response.body as { error: string };
      expect(body.error).toBe('Query is required');
    });

    test('chat requires document text', async () => {
      const response = await api
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ text: '', query: 'What is this?' })
        .expect(400);

      const body = response.body as { error: string };
      expect(body.error).toBe('Document text is required');
    });

    test('chat succeeds with valid text and query', async () => {
      const response = await api
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          text: 'This is a document about AI.',
          query: 'What is this about?',
        })
        .expect(200);

      const body = response.body as { result: string };
      expect(body.result).toBe('AI generated result');
    });
  });
});
