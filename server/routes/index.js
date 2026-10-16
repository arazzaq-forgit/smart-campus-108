const r = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const w = c => Object.fromEntries(Object.entries(c).map(([k, f]) => [k, wrap(f)]));
const auth = w(require('../controllers/authController'));
const svc = w(require('../controllers/serviceController'));
const bk = w(require('../controllers/bookingController'));
const pay = w(require('../controllers/paymentController'));
const fb = w(require('../controllers/feedbackController'));
const adm = w(require('../controllers/adminController'));
const admin = [protect, authorize('admin')];

r.post('/auth/register', validate(schemas.register), auth.register);
r.post('/auth/login', validate(schemas.login), auth.login);
r.get('/auth/me', protect, auth.me);

r.get('/services', svc.list);
r.get('/services/:id', svc.get);
r.get('/services/:id/availability', svc.availability);
r.post('/services', ...admin, validate(schemas.service), svc.create);
r.put('/services/:id', ...admin, svc.update);
r.delete('/services/:id', ...admin, svc.remove);

r.post('/bookings', protect, validate(schemas.booking), bk.create);
r.get('/bookings/mine', protect, bk.mine);
r.get('/bookings/:id', protect, bk.getOne);
r.patch('/bookings/:id/cancel', protect, bk.cancel);
r.get('/bookings', ...admin, bk.all);
r.patch('/bookings/:id/status', ...admin, bk.setStatus);

r.post('/payments/order', protect, pay.createOrder);
r.post('/payments/verify', protect, pay.verify);

r.post('/feedback', protect, validate(schemas.feedback), fb.create);
r.get('/feedback/service/:id', fb.forService);

r.get('/admin/users', ...admin, adm.users);
r.patch('/admin/users/:id/block', ...admin, adm.toggleBlock);
r.get('/admin/stats', ...admin, adm.stats);
module.exports = r;
