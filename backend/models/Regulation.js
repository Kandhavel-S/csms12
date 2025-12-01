// models/Regulation.ts
const mongoose = require("mongoose");

const regulationSchema = new mongoose.Schema(
  {
    regulationCode: { type: String, required: true },
    department: { type: String, required: true },
    hod: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    curriculumUrl: { type: mongoose.Schema.Types.ObjectId, ref: "uploads.files", default: null },
    status: {
      type: String,
      enum: [
        "Pending",
        "Draft",
        "Submitted",
        "Under Review",
        "Approved",
        "Changes Requested",
        "Archived",
      ],
      default: "Pending",
    },
    lastUpdated: { type: Date, default: null },
    version: { type: Number, required: true, default: 1 },
    formData: { type: mongoose.Schema.Types.Mixed, default: null },
    isDraft: { type: Boolean, default: true },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    submittedAt: { type: Date, default: null },
    changeSummary: { type: String, default: "" },
    savedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    savedAt: { type: Date, default: null },
    isLatest: { type: Boolean, default: true },
  },
  { timestamps: true }
);

regulationSchema.index({ regulationCode: 1, department: 1, version: 1 });

module.exports = mongoose.model("Regulation", regulationSchema);
