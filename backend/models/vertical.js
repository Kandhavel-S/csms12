// models/Vertical.js
const mongoose = require("mongoose");

const verticalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  regulationId: { type: String, required: true },
  regulationCode: { type: String, required: true },
  department: { type: String, required: true },
  displayOrder: { type: Number, default: 0 },
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

// Compound index to ensure unique vertical names per regulation and department
verticalSchema.index({ name: 1, regulationId: 1, department: 1 }, { unique: true });

module.exports = mongoose.model("Vertical", verticalSchema);
