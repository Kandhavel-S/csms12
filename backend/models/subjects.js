// models/Subject.js
const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  code: { type: String, required: true },
  title: { type: String, required: true },
  assignedFaculty: { type: String, ref: "User", default: "" }, 
  assignedExpert: { type: String, ref: "User", default: "" }, 
  createdBy: {type: String, required: true},
  regulationId: { type: mongoose.Schema.Types.ObjectId, ref: "Regulation" },
  regulationCode: { type: String, default: "" },
  department: { type: String, default: "" },
  syllabusUrl: { type: mongoose.Schema.Types.ObjectId, ref: "uploads.files" },
  status: { type: String, default: "Draft" },
  feedback: { type: String, default: "" },
  lastUpdated: { type: Date },
  semester: { type: Number, min: 1, max: 8 },
  displayOrder: { type: Number, default: 0 },
  courseType: { type: String, default: "" },
  subjectType: { type: String, default: "" },
  ltpcCode: { type: String, default: "" }
}, { timestamps: true });

// Drop the old unique index on 'code' field if it exists
subjectSchema.index({ code: 1 }, { unique: false });

// Ensure we drop the old unique index when the model is initialized
const Subject = mongoose.model("Subject", subjectSchema);

// Drop the unique index on startup (only runs once when server starts)
Subject.collection.dropIndex("code_1").catch(() => {
  // Ignore error if index doesn't exist
  console.log("Note: code_1 index already removed or doesn't exist");
});

module.exports = Subject;
 