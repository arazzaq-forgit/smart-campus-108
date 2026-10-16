const mongoose = require('mongoose');
const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, enum: ['Hall', 'Lab', 'Sports', 'Transport', 'Library', 'Equipment', 'Other'] },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  capacity: { type: Number, default: 1 },
  image: { type: String, default: '' },
  slots: { type: [String], default: ['09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00', '14:00-15:00', '15:00-16:00'] },
  isActive: { type: Boolean, default: true },
  avgRating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 }
}, { timestamps: true });
module.exports = mongoose.model('Service', serviceSchema);
