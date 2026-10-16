// Loads .env, forces safe test settings and builds a SEPARATE test database URI
// so the real "smartcampus" data is never touched.
require('dotenv').config();
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
process.env.PAYMENT_MODE = 'mock';
process.env.SMTP_USER = '';           // never send real emails while testing

exports.testUri = () => {
  if (!process.env.MONGO_URI) return null;
  const u = new URL(process.env.MONGO_URI);
  u.pathname = '/smartcampus_test';
  return u.toString();
};
exports.ymd = (daysAhead) => new Date(Date.now() + daysAhead * 864e5).toISOString().slice(0, 10);
