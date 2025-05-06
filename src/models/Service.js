const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  amount: { type: Number, required: true },
  category: { type: String, enum: ['land_rates', 'business_permit', 'parking', 'other'], required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Service', serviceSchema);