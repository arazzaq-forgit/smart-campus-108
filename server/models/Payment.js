const mongoose = require('mongoose');
module.exports = mongoose.model('Payment', new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderId: String, paymentId: String, amount: Number,
  status: { type: String, enum: ['Success', 'Failed'], default: 'Success' },
  paidAt: Date
}, { timestamps: true }));
