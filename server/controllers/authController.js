const bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken');
const User = require('../models/User');
const sign = u => jwt.sign({ id: u._id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
const pub = u => ({ id: u._id, name: u.name, email: u.email, role: u.role });
exports.register = async (req, res) => {
  const { name, email, password, department } = req.body;
  if (await User.findOne({ email })) return res.status(409).json({ message: 'Email already registered' });
  const user = await User.create({ name, email, department, passwordHash: await bcrypt.hash(password, 10) });
  res.status(201).json({ token: sign(user), user: pub(user) });
};
exports.login = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash)))
    return res.status(401).json({ message: 'Invalid credentials' });
  if (user.isBlocked) return res.status(403).json({ message: 'Account blocked' });
  res.json({ token: sign(user), user: pub(user) });
};
exports.me = async (req, res) => res.json(pub(await User.findById(req.user.id)));
