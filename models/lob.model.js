const mongoose = require('mongoose');

const lobSchema = new mongoose.Schema({
  categoryName: { type: String, required: true, index: true }
}, { timestamps: true });

module.exports = mongoose.model('LOB', lobSchema);