const mongoose = require('mongoose');
const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  date: { type: Date, required: true },
  slot: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'Rejected'], default: 'Pending' },
  paymentStatus: { type: String, enum: ['Unpaid', 'Paid', 'Refunded'], default: 'Unpaid' }
}, { timestamps: true });
// one active booking per service+date+slot (prevents double booking)
bookingSchema.index({ service: 1, date: 1, slot: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['Pending', 'Confirmed'] } } });
module.exports = mongoose.model('Booking', bookingSchema);
