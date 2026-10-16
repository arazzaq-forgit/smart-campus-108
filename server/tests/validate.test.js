const { schemas } = require('../middleware/validate');
test('rejects weak password', () => {
  expect(schemas.register.validate({ name: 'Ab', email: 'a@b.com', password: 'abc' }).error).toBeDefined();
});
test('accepts valid registration', () => {
  expect(schemas.register.validate({ name: 'Ravi', email: 'r@c.edu', password: 'Strong123' }).error).toBeUndefined();
});
test('rejects past booking date', () => {
  expect(schemas.booking.validate({ service: 'a'.repeat(24), date: '2020-01-01', slot: '09:00-10:00' }).error).toBeDefined();
});
