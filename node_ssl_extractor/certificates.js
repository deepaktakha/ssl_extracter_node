const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  url: String,
  subject: Object,
  issuer: Object,
  valid_from: Date,
  valid_to: Date,
  fingerprint: String
});

module.exports = mongoose.model('Certificate', certificateSchema);
