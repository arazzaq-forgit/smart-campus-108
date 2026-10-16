const Service = require('../models/Service'), Booking = require('../models/Booking');
exports.list = async (req, res) => {
  const { q, category, minPrice, maxPrice, sort = '-avgRating', page = 1, limit = 12 } = req.query;
  const filter = { isActive: true };
  if (q) filter.name = { $regex: String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  if (category) filter.category = category;
  if (minPrice || maxPrice) filter.price = { ...(minPrice && { $gte: +minPrice }), ...(maxPrice && { $lte: +maxPrice }) };
  const data = await Service.find(filter).sort(sort).skip((page - 1) * limit).limit(+limit);
  const total = await Service.countDocuments(filter);
  res.json({ data, total, pages: Math.ceil(total / limit) });
};
exports.get = async (req, res) => {
  const s = await Service.findById(req.params.id);
  s ? res.json(s) : res.status(404).json({ message: 'Service not found' });
};
exports.availability = async (req, res) => {
  const s = await Service.findById(req.params.id);
  if (!s) return res.status(404).json({ message: 'Service not found' });
  const taken = await Booking.find({ service: s._id, date: new Date(req.query.date), status: { $in: ['Pending', 'Confirmed'] } }).distinct('slot');
  res.json(s.slots.map(slot => ({ slot, available: !taken.includes(slot) })));
};
exports.create = async (req, res) => res.status(201).json(await Service.create(req.body));
exports.update = async (req, res) => {
  const s = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  s ? res.json(s) : res.status(404).json({ message: 'Service not found' });
};
exports.remove = async (req, res) => {
  const s = await Service.findByIdAndDelete(req.params.id);
  s ? res.json({ message: 'Deleted' }) : res.status(404).json({ message: 'Service not found' });
};
