// These tests need NO database: they check security rules that run before any DB call.
require('./helpers');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');

const token = role => jwt.sign({ id: '64b000000000000000000001', role }, process.env.JWT_SECRET, { expiresIn: '1h' });
const bearer = t => ({ Authorization: `Bearer ${t}` });

describe('Health and routing', () => {
  test('GET /api/health returns ok', async () => {
    const r = await request(app).get('/api/health');
    expect(r.status).toBe(200); expect(r.body.ok).toBe(true);
  });
});

describe('Authentication guard', () => {
  test('protected route without token returns 401', async () => {
    expect((await request(app).get('/api/bookings/mine')).status).toBe(401);
  });
  test('garbage token returns 401', async () => {
    expect((await request(app).get('/api/bookings/mine').set(bearer('abc.def.ghi'))).status).toBe(401);
  });
  test('expired token returns 401', async () => {
    const old = jwt.sign({ id: 'x', role: 'user' }, process.env.JWT_SECRET, { expiresIn: -10 });
    expect((await request(app).get('/api/bookings/mine').set(bearer(old))).status).toBe(401);
  });
  test('token signed with a wrong secret returns 401', async () => {
    const bad = jwt.sign({ id: 'x', role: 'admin' }, 'wrong_secret');
    expect((await request(app).get('/api/admin/stats').set(bearer(bad))).status).toBe(401);
  });
});

describe('Role-based access', () => {
  const adminOnly = [['get', '/api/admin/users'], ['get', '/api/admin/stats'], ['get', '/api/bookings'],
    ['post', '/api/services'], ['patch', '/api/bookings/64b000000000000000000002/status']];
  test.each(adminOnly)('user token is denied on %s %s (403)', async (m, url) => {
    expect((await request(app)[m](url).set(bearer(token('user'))).send({})).status).toBe(403);
  });
  test('no token is denied on admin routes (401)', async () => {
    expect((await request(app).get('/api/admin/users')).status).toBe(401);
  });
});

describe('Input validation', () => {
  test('register rejects weak password', async () => {
    const r = await request(app).post('/api/auth/register').send({ name: 'Ravi', email: 'r@c.edu', password: 'abc' });
    expect(r.status).toBe(400); expect(r.body.message).toMatch(/validation/i);
  });
  test('register rejects invalid email', async () => {
    expect((await request(app).post('/api/auth/register').send({ name: 'Ravi', email: 'nope', password: 'Strong123' })).status).toBe(400);
  });
  test('login rejects missing password', async () => {
    expect((await request(app).post('/api/auth/login').send({ email: 'a@b.com' })).status).toBe(400);
  });
  test('booking rejects a past date', async () => {
    const r = await request(app).post('/api/bookings').set(bearer(token('user')))
      .send({ service: 'a'.repeat(24), date: '2020-01-01', slot: '09:00-10:00' });
    expect(r.status).toBe(400);
  });
  test('booking rejects a malformed service id', async () => {
    const r = await request(app).post('/api/bookings').set(bearer(token('user')))
      .send({ service: '123', date: '2030-01-01', slot: '09:00-10:00' });
    expect(r.status).toBe(400);
  });
  test('feedback rejects rating above 5', async () => {
    const r = await request(app).post('/api/feedback').set(bearer(token('user')))
      .send({ booking: 'a'.repeat(24), rating: 9 });
    expect(r.status).toBe(400);
  });
});

describe('Security headers and sanitising', () => {
  test('helmet headers are present', async () => {
    const r = await request(app).get('/api/health');
    expect(r.headers['x-content-type-options']).toBe('nosniff');
    expect(r.headers['x-powered-by']).toBeUndefined();
  });
  test('NoSQL operator in login body does not crash the API', async () => {
    const r = await request(app).post('/api/auth/login').send({ email: { $gt: '' }, password: { $gt: '' } });
    expect(r.status).toBe(400);
  });
});
