const mongoose = require("mongoose");

const assessmentTypeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  maxMarks: { type: Number, required: true },
  weightPct: { type: Number, required: true },
});

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, default: "" },
  credits: { type: Number, default: 3 },
  targetGrade: { type: String, default: "A" },
  marks: {
    type: Map,
    of: Number,
    default: {},
  },
  scheme: {
    assessmentTypes: [assessmentTypeSchema],
  },
});

const semesterSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Semester name is required"],
      trim: true,
    },
    isCurrent: {
      type: Boolean,
      default: false,
    },
    finalizedSgpa: {
      type: Number,
      default: null,
    },
    credits: {
      type: Number,
      default: 20,
    },
    subjects: [subjectSchema],
  },
  {
    timestamps: true,
  }
);

const Semester = mongoose.model("Semester", semesterSchema);

module.exports = Semester;
