// Full-flow tests against a SEPARATE database named "smartcampus_test" (derived from your MONGO_URI).
// Skipped automatically if MONGO_URI is not set.
const { testUri, ymd } = require('./helpers');
const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const suite = testUri() ? describe : describe.skip;
suite('End-to-end booking flow (test database)', () => {
  let app, User, Service, Booking, Feedback;
  let adminToken, studentToken, otherToken, service, booking;
  const date = ymd(3), slot = '10:00-11:00';
  const auth = t => ({ Authorization: `Bearer ${t}` });

  // Atlas "read and write" users cannot dropDatabase, so we empty the collections instead.
  const clean = async () => { for (const c of Object.values(mongoose.connection.collections)) await c.deleteMany({}); };

  beforeAll(async () => {
    app = require('../app');
    User = require('../models/User'); Service = require('../models/Service');
    Booking = require('../models/Booking'); Feedback = require('../models/Feedback');
    require('../models/Payment');
    await mongoose.connect(testUri());
    await Promise.all([User.init(), Service.init(), Booking.init(), Feedback.init()]);
    await clean();
    await User.create({ name: 'Admin', email: 'admin@test.edu', role: 'admin', passwordHash: await bcrypt.hash('Admin@123', 10) });
    service = await Service.create({ name: 'Test Hall', category: 'Hall', price: 500, capacity: 100 });
  }, 60000);
  afterAll(async () => { await clean(); await mongoose.disconnect(); });

  describe('Accounts', () => {
    test('register a student', async () => {
      const r = await request(app).post('/api/auth/register').send({ name: 'Student One', email: 's1@test.edu', password: 'Student@123' });
      expect(r.status).toBe(201); expect(r.body.token).toBeTruthy(); studentToken = r.body.token;
    });
    test('duplicate email is rejected (409)', async () => {
      const r = await request(app).post('/api/auth/register').send({ name: 'Student One', email: 's1@test.edu', password: 'Student@123' });
      expect(r.status).toBe(409);
    });
    test('wrong password returns 401', async () => {
      expect((await request(app).post('/api/auth/login').send({ email: 's1@test.edu', password: 'Wrong@123' })).status).toBe(401);
    });
    test('correct login returns a token', async () => {
      const r = await request(app).post('/api/auth/login').send({ email: 's1@test.edu', password: 'Student@123' });
      expect(r.status).toBe(200); expect(r.body.user.role).toBe('user');
    });
    test('admin login works and returns role admin', async () => {
      const r = await request(app).post('/api/auth/login').send({ email: 'admin@test.edu', password: 'Admin@123' });
      expect(r.body.user.role).toBe('admin'); adminToken = r.body.token;
    });
    test('second student for ownership checks', async () => {
      const r = await request(app).post('/api/auth/register').send({ name: 'Student Two', email: 's2@test.edu', password: 'Student@123' });
      otherToken = r.body.token; expect(otherToken).toBeTruthy();
    });
  });

  describe('Services', () => {
    test('public list returns the service', async () => {
      const r = await request(app).get('/api/services');
      expect(r.status).toBe(200); expect(r.body.total).toBe(1);
    });
    test('search and category filter work', async () => {
      expect((await request(app).get('/api/services?q=hall')).body.total).toBe(1);
      expect((await request(app).get('/api/services?q=zzz')).body.total).toBe(0);
      expect((await request(app).get('/api/services?category=Lab')).body.total).toBe(0);
      expect((await request(app).get('/api/services?maxPrice=100')).body.total).toBe(0);
    });
    test('student cannot create a service (403)', async () => {
      const r = await request(app).post('/api/services').set(auth(studentToken)).send({ name: 'X', category: 'Lab', price: 10 });
      expect(r.status).toBe(403);
    });
    test('admin can create and update a service', async () => {
      const c = await request(app).post('/api/services').set(auth(adminToken)).send({ name: 'Lab 1', category: 'Lab', price: 200 });
      expect(c.status).toBe(201);
      const u = await request(app).put(`/api/services/${c.body._id}`).set(auth(adminToken)).send({ price: 250 });
      expect(u.body.price).toBe(250);
    });
  });

  describe('Booking rules', () => {
    test('student books a free slot', async () => {
      const r = await request(app).post('/api/bookings').set(auth(studentToken)).send({ service: String(service._id), date, slot });
      expect(r.status).toBe(201); expect(r.body.status).toBe('Pending'); expect(r.body.amount).toBe(500); booking = r.body;
    });
    test('same slot cannot be double booked (409)', async () => {
      const r = await request(app).post('/api/bookings').set(auth(otherToken)).send({ service: String(service._id), date, slot });
      expect(r.status).toBe(409); expect(r.body.message).toMatch(/already booked/i);
    });
    test('availability marks the slot as taken', async () => {
      const r = await request(app).get(`/api/services/${service._id}/availability?date=${date}`);
      expect(r.body.find(s => s.slot === slot).available).toBe(false);
      expect(r.body.find(s => s.slot === '11:00-12:00').available).toBe(true);
    });
    test('invalid slot name is rejected (400)', async () => {
      const r = await request(app).post('/api/bookings').set(auth(studentToken)).send({ service: String(service._id), date, slot: '03:00-04:00' });
      expect(r.status).toBe(400);
    });
    test("a student sees only their own bookings", async () => {
      expect((await request(app).get('/api/bookings/mine').set(auth(studentToken))).body).toHaveLength(1);
      expect((await request(app).get('/api/bookings/mine').set(auth(otherToken))).body).toHaveLength(0);
    });
    test('another student cannot cancel or open it (404)', async () => {
      expect((await request(app).patch(`/api/bookings/${booking._id}/cancel`).set(auth(otherToken))).status).toBe(404);
      expect((await request(app).get(`/api/bookings/${booking._id}`).set(auth(otherToken))).status).toBe(404);
    });
    test('owner can cancel when more than 24h ahead, and the slot is freed', async () => {
      const c = await request(app).patch(`/api/bookings/${booking._id}/cancel`).set(auth(studentToken));
      expect(c.status).toBe(200); expect(c.body.status).toBe('Cancelled');
      const again = await request(app).post('/api/bookings').set(auth(studentToken)).send({ service: String(service._id), date, slot });
      expect(again.status).toBe(201); booking = again.body;
    });
    test('cancelling within 24h is refused (400)', async () => {
      const soon = await Booking.create({ user: (await User.findOne({ email: 's1@test.edu' }))._id, service: service._id,
        date: new Date(Date.now() + 2 * 36e5), slot: '15:00-16:00', amount: 500 });
      const r = await request(app).patch(`/api/bookings/${soon._id}/cancel`).set(auth(studentToken));
      expect(r.status).toBe(400); expect(r.body.message).toMatch(/24h/);
    });
  });

  describe('Payment and status tracking', () => {
    test('order is created in mock mode', async () => {
      const r = await request(app).post('/api/payments/order').set(auth(studentToken)).send({ bookingId: booking._id });
      expect(r.status).toBe(200); expect(r.body.mode).toBe('mock'); expect(r.body.amount).toBe(50000);
    });
    test("another student cannot pay for someone else's booking (404)", async () => {
      expect((await request(app).post('/api/payments/order').set(auth(otherToken)).send({ bookingId: booking._id })).status).toBe(404);
    });
    test('verify marks the booking Paid and Confirmed', async () => {
      const r = await request(app).post('/api/payments/verify').set(auth(studentToken)).send({ bookingId: booking._id, orderId: 'order_mock_1' });
      expect(r.status).toBe(200); expect(r.body.booking.paymentStatus).toBe('Paid'); expect(r.body.booking.status).toBe('Confirmed');
    });
    test('paying twice is refused (400)', async () => {
      expect((await request(app).post('/api/payments/order').set(auth(studentToken)).send({ bookingId: booking._id })).status).toBe(400);
    });
    test('receipt contains the payment record', async () => {
      const r = await request(app).get(`/api/bookings/${booking._id}`).set(auth(studentToken));
      expect(r.status).toBe(200); expect(r.body.payment.amount).toBe(500);
    });
    test('malformed receipt id returns 404, not a crash', async () => {
      expect((await request(app).get('/api/bookings/not-an-id').set(auth(studentToken))).status).toBe(404);
    });
  });

  describe('Admin and feedback', () => {
    test('feedback is refused before the booking is completed (400)', async () => {
      const r = await request(app).post('/api/feedback').set(auth(studentToken)).send({ booking: booking._id, rating: 5 });
      expect(r.status).toBe(400);
    });
    test('admin can mark the booking completed', async () => {
      const r = await request(app).patch(`/api/bookings/${booking._id}/status`).set(auth(adminToken)).send({ status: 'Completed' });
      expect(r.body.status).toBe('Completed');
    });
    test('admin status endpoint rejects unknown statuses (400)', async () => {
      expect((await request(app).patch(`/api/bookings/${booking._id}/status`).set(auth(adminToken)).send({ status: 'Banana' })).status).toBe(400);
    });
    test('feedback is accepted once, and updates the service rating', async () => {
      const r = await request(app).post('/api/feedback').set(auth(studentToken)).send({ booking: booking._id, rating: 4, comment: 'Great' });
      expect(r.status).toBe(201);
      expect((await Service.findById(service._id)).avgRating).toBe(4);
      expect((await request(app).post('/api/feedback').set(auth(studentToken)).send({ booking: booking._id, rating: 5 })).status).toBe(409);
    });
    test('admin stats report the booking and revenue', async () => {
      const r = await request(app).get('/api/admin/stats').set(auth(adminToken));
      expect(r.status).toBe(200); expect(r.body.revenue).toBe(500); expect(r.body.totalBookings).toBeGreaterThanOrEqual(1);
    });
    test('admin can block a user, who then cannot log in (403)', async () => {
      const u = await User.findOne({ email: 's2@test.edu' });
      const b = await request(app).patch(`/api/admin/users/${u._id}/block`).set(auth(adminToken));
      expect(b.body.isBlocked).toBe(true);
      expect((await request(app).post('/api/auth/login').send({ email: 's2@test.edu', password: 'Student@123' })).status).toBe(403);
    });
    test('admin cannot be blocked (400)', async () => {
      const a = await User.findOne({ email: 'admin@test.edu' });
      expect((await request(app).patch(`/api/admin/users/${a._id}/block`).set(auth(adminToken))).status).toBe(400);
    });
  });
});