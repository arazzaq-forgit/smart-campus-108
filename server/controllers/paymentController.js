const crypto = require('crypto');
const Booking = require('../models/Booking'), Payment = require('../models/Payment');
const { notify } = require('../utils/mailer');
const mock = () => (process.env.PAYMENT_MODE || 'mock') === 'mock';
const rzp = () => new (require('razorpay'))({ key_id: process.env.RZP_KEY, key_secret: process.env.RZP_SECRET });

exports.createOrder = async (req, res) => {
  const b = await Booking.findOne({ _id: req.body.bookingId, user: req.user.id });
  if (!b) return res.status(404).json({ message: 'Booking not found' });
  if (b.paymentStatus === 'Paid') return res.status(400).json({ message: 'Already paid' });
  if (mock()) return res.json({ mode: 'mock', orderId: 'order_mock_' + Date.now(), amount: b.amount * 100 });
  const order = await rzp().orders.create({ amount: b.amount * 100, currency: 'INR', receipt: b.id });
  res.json({ mode: 'razorpay', orderId: order.id, amount: order.amount, key: process.env.RZP_KEY });
};

exports.verify = async (req, res) => {
  const { bookingId, orderId, paymentId, signature } = req.body;
  const b = await Booking.findOne({ _id: bookingId, user: req.user.id });
  if (!b) return res.status(404).json({ message: 'Booking not found' });
  if (!mock()) {
    const expected = crypto.createHmac('sha256', process.env.RZP_SECRET).update(orderId + '|' + paymentId).digest('hex');
    if (expected !== signature) return res.status(400).json({ message: 'Payment verification failed' });
  }
  await Payment.create({ booking: b._id, user: req.user.id, orderId, paymentId: paymentId || 'pay_mock_' + Date.now(), amount: b.amount, paidAt: new Date() });
  b.paymentStatus = 'Paid'; b.status = 'Confirmed'; await b.save();
  notify(b, 'paid');
  res.json({ message: 'Payment successful', booking: b });
};
