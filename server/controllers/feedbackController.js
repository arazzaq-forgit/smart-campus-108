const Feedback = require('../models/Feedback'), Booking = require('../models/Booking'), Service = require('../models/Service');
exports.create = async (req, res, next) => {
  try {
    const b = await Booking.findOne({ _id: req.body.booking, user: req.user.id });
    if (!b || b.status !== 'Completed') return res.status(400).json({ message: 'Feedback allowed only for completed bookings' });
    const f = await Feedback.create({ user: req.user.id, service: b.service, booking: b._id, rating: req.body.rating, comment: req.body.comment });
    const [agg] = await Feedback.aggregate([{ $match: { service: b.service } }, { $group: { _id: null, avg: { $avg: '$rating' }, n: { $sum: 1 } } }]);
    await Service.findByIdAndUpdate(b.service, { avgRating: agg.avg, ratingCount: agg.n });
    res.status(201).json(f);
  } catch (e) { e.code === 11000 ? res.status(409).json({ message: 'Feedback already submitted' }) : next(e); }
};
exports.forService = async (req, res) =>
  res.json(await Feedback.find({ service: req.params.id }).populate('user', 'name').sort('-createdAt'));
