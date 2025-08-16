const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    accountName: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Account", accountSchema);
