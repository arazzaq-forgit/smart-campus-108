const mongoose = require('mongoose');
const Booking = require('../models/Booking'), Service = require('../models/Service'), Payment = require('../models/Payment');
const { notify } = require('../utils/mailer');
exports.create = async (req, res, next) => {
  try {
    const s = await Service.findById(req.body.service);
    if (!s || !s.isActive) return res.status(404).json({ message: 'Service unavailable' });
    if (!s.slots.includes(req.body.slot)) return res.status(400).json({ message: 'Invalid slot' });
    const b = await Booking.create({ user: req.user.id, service: s._id, date: req.body.date, slot: req.body.slot, amount: s.price });
    notify(b, 'created');
    res.status(201).json(b);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: 'Slot already booked' });
    next(e);
  }
};
exports.mine = async (req, res) =>
  res.json(await Booking.find({ user: req.user.id }).populate('service', 'name category image').sort('-createdAt'));
exports.cancel = async (req, res) => {
  const b = await Booking.findOne({ _id: req.params.id, user: req.user.id });
  if (!b) return res.status(404).json({ message: 'Booking not found' });
  if (!['Pending', 'Confirmed'].includes(b.status)) return res.status(400).json({ message: 'Cannot cancel this booking' });
  if (new Date(b.date) - Date.now() < 24 * 3600 * 1000) return res.status(400).json({ message: 'Cancellation allowed up to 24h before' });
  b.status = 'Cancelled';
  if (b.paymentStatus === 'Paid') b.paymentStatus = 'Refunded';
  await b.save(); notify(b, 'cancelled'); res.json(b);
};
exports.all = async (req, res) => {
  const f = {}; if (req.query.status) f.status = req.query.status;
  res.json(await Booking.find(f).populate('user', 'name email').populate('service', 'name').sort('-createdAt'));
};
exports.setStatus = async (req, res) => {
  const { status } = req.body;
  if (!['Confirmed', 'Completed', 'Rejected', 'Cancelled'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
  const b = await Booking.findById(req.params.id);
  if (!b) return res.status(404).json({ message: 'Booking not found' });
  b.status = status;
  if (['Rejected', 'Cancelled'].includes(status) && b.paymentStatus === 'Paid') b.paymentStatus = 'Refunded';
  await b.save(); notify(b, status.toLowerCase()); res.json(b);
};

exports.getOne = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Booking not found' });
  const b = await Booking.findById(req.params.id).populate('user', 'name email department').populate('service', 'name category');
  if (!b || (req.user.role !== 'admin' && String(b.user._id) !== req.user.id)) return res.status(404).json({ message: 'Booking not found' });
  const payment = await Payment.findOne({ booking: b._id });
  res.json({ booking: b, payment });
};
