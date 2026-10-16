const User = require('../models/User'), Booking = require('../models/Booking');
exports.users = async (req, res) => res.json(await User.find().select('-passwordHash').sort('-createdAt'));
exports.toggleBlock = async (req, res) => {
  const u = await User.findById(req.params.id);
  if (!u) return res.status(404).json({ message: 'User not found' });
  if (u.role === 'admin') return res.status(400).json({ message: 'Cannot block an admin' });
  u.isBlocked = !u.isBlocked; await u.save(); res.json({ id: u._id, isBlocked: u.isBlocked });
};
exports.stats = async (req, res) => {
  const [byStatus, byService, monthly, users] = await Promise.all([
    Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Booking.aggregate([{ $group: { _id: '$service', count: { $sum: 1 } } },
      { $lookup: { from: 'services', localField: '_id', foreignField: '_id', as: 's' } }, { $unwind: '$s' },
      { $project: { _id: 0, name: '$s.name', count: 1 } }, { $sort: { count: -1 } }, { $limit: 5 }]),
    Booking.aggregate([{ $match: { paymentStatus: 'Paid' } },
      { $group: { _id: { $month: '$createdAt' }, revenue: { $sum: '$amount' } } }, { $sort: { _id: 1 } }]),
    User.countDocuments({ role: 'user' })
  ]);
  const revenue = monthly.reduce((a, m) => a + m.revenue, 0);
  res.json({ byStatus, byService, monthly, revenue, users, totalBookings: byStatus.reduce((a, s) => a + s.count, 0) });
};
