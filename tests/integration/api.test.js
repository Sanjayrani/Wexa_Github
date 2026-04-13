'use strict';

process.env.LINEAR_API_KEY  = 'test-linear-key';
process.env.SLACK_BOT_TOKEN = 'xoxb-test';
process.env.APP_API_KEY     = 'test-api-key';
process.env.APP_ADMIN_KEY   = 'test-admin-key';
process.env.DB_PATH         = ':memory:';
process.env.NODE_ENV        = 'test';

const request    = require('supertest');
const app        = require('../../src/app');
const { initDb } = require('../../src/db');

beforeAll(async () => { await initDb(); });

describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('schedules');
  });
});

describe('POST /api/trigger (auth)', () => {
  it('returns 401 without API key', async () => {
    const res = await request(app).post('/api/trigger');
    expect(res.statusCode).toBe(401);
  });
  it('returns 401 with wrong API key', async () => {
    const res = await request(app).post('/api/trigger').set('x-api-key', 'wrong-key');
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/runs (auth)', () => {
  it('returns 401 without API key', async () => {
    const res = await request(app).get('/api/runs');
    expect(res.statusCode).toBe(401);
  });
  it('returns 200 with correct API key', async () => {
    const res = await request(app).get('/api/runs').set('x-api-key', 'test-api-key');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('GET /api/config (admin)', () => {
  it('returns 403 without admin key', async () => {
    const res = await request(app).get('/api/config');
    expect(res.statusCode).toBe(403);
  });
  it('returns 200 with admin key', async () => {
    const res = await request(app).get('/api/config').set('x-admin-key', 'test-admin-key');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('POST /api/config (admin)', () => {
  it('updates a config value', async () => {
    const res = await request(app).post('/api/config').set('x-admin-key', 'test-admin-key').send({ comment_template: 'New template {{developer_name}}' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.comment_template.value).toBe('New template {{developer_name}}');
  });
});