const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  conditions: {
    type: Object,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  stats: {
    audienceSize: { type: Number, default: 0 },
    messagesSent: { type: Number, default: 0 },
    messagesFailed: { type: Number, default: 0 }
  }
});

module.exports = mongoose.model('Campaign', campaignSchema);