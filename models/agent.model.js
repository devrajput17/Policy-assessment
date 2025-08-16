const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
  agentName: { type: String, required: true, index: true }
}, { timestamps: true });

module.exports = mongoose.model('Agent', agentSchema);