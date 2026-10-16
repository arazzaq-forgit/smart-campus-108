const Joi = require('joi');
exports.schemas = {
  register: Joi.object({ name: Joi.string().min(2).max(60).required(), email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(/[A-Za-z]/).pattern(/\d/).required(), department: Joi.string().allow('') }),
  login: Joi.object({ email: Joi.string().email().required(), password: Joi.string().required() }),
  booking: Joi.object({ service: Joi.string().hex().length(24).required(), date: Joi.date().min('now').required(), slot: Joi.string().required() }),
  service: Joi.object({ name: Joi.string().required(), category: Joi.string().required(), description: Joi.string().allow(''),
    price: Joi.number().min(0).required(), capacity: Joi.number().min(1), image: Joi.string().allow(''), slots: Joi.array().items(Joi.string()), isActive: Joi.boolean() }),
  feedback: Joi.object({ booking: Joi.string().hex().length(24).required(), rating: Joi.number().min(1).max(5).required(), comment: Joi.string().allow('').max(500) })
};
exports.validate = schema => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) return res.status(400).json({ message: 'Validation failed', errors: error.details.map(d => d.message) });
  next();
};
