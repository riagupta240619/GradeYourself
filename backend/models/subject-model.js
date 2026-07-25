const mongoose = require("mongoose");

const assessmentTypeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  maxMarks: { type: Number, required: true },
  weightPct: { type: Number, required: true },
});

const subjectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    semester: {
      type: String,
      required: [true, "Semester is required"],
      default: "Semester 4",
    },
    name: {
      type: String,
      required: [true, "Subject name is required"],
      trim: true,
    },
    code: {
      type: String,
      default: "",
      trim: true,
    },
    credits: {
      type: Number,
      required: [true, "Credits is required"],
      min: [1, "Credits must be at least 1"],
      max: [10, "Credits cannot exceed 10"],
      default: 3,
    },
    internalMarks: {
      type: Number,
      default: 0,
      min: [0, "Internal marks cannot be negative"],
      max: [100, "Internal marks cannot exceed 100"],
    },
    externalMarks: {
      type: Number,
      default: 0,
      min: [0, "External marks cannot be negative"],
      max: [100, "External marks cannot exceed 100"],
    },
    targetGrade: {
      type: String,
      default: "A",
    },
    colorTag: {
      type: String,
      default: "#3b82f6",
    },
    marks: {
      type: Map,
      of: Number,
      default: {},
    },
    scheme: {
      assessmentTypes: {
        type: [assessmentTypeSchema],
        default: [
          { id: "a1", name: "Assignments", maxMarks: 20, weightPct: 20 },
          { id: "m1", name: "Midterm Exam", maxMarks: 30, weightPct: 30 },
          { id: "f1", name: "Final Exam", maxMarks: 50, weightPct: 50 },
        ],
      },
    },
  },
  {
    timestamps: true,
  }
);

const SubjectModel = mongoose.model("Subject", subjectSchema);

module.exports = SubjectModel;
