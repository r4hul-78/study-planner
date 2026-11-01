import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';

describe('AI Routes & Error Handling', () => {
  it('POST /api/ai/test-connection responds with connection status', async () => {
    const res = await request(app).post('/api/ai/test-connection');
    expect(res.status).toBe(200);
    expect(typeof res.body.connected).toBe('boolean');
    expect(res.body.status).toBeDefined();
    expect(res.body.message).toBeDefined();
  });

  it('POST /api/ai/parse-syllabus rejects empty text input with 400', async () => {
    const res = await request(app)
      .post('/api/ai/parse-syllabus')
      .send({ text: '' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_INPUT');
  });

  it('POST /api/ai/study-assistant rejects missing message with 400', async () => {
    const res = await request(app)
      .post('/api/ai/study-assistant')
      .send({ message: '' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_INPUT');
  });
});
