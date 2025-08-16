const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  policyNumber: { type: String, required: true, index: true },
  policyStartDate: { type: Date },
  policyEndDate: { type: Date },
  policyCategoryCollectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'LOB', required: true },
  companyCollectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Carrier', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Policy', policySchema);