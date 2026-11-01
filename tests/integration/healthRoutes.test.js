import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';

describe('Backend API Health & Status Routes', () => {
  it('GET /api/health returns HTTP 200 with status ok and version info', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.app).toBe('StudyPilot AI');
    expect(res.body.version).toBe('1.0.0');
    expect(res.body.timestamp).toBeDefined();
  });

  it('GET /api/ai/status returns configuration info without leaking keys', async () => {
    const res = await request(app).get('/api/ai/status');
    expect(res.status).toBe(200);
    expect(typeof res.body.configured).toBe('boolean');
    expect(res.body.model).toBeDefined();
    // Verify no secret leak
    expect(res.body.apiKey).toBeUndefined();
    expect(res.body.GEMINI_API_KEY).toBeUndefined();
  });

  it('returns 404 for nonexistent API routes', async () => {
    const res = await request(app).get('/api/nonexistent-route');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});
