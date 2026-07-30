const mongoose = require("mongoose");

const assessmentTypeSchema = new mongoose.Schema({
  id: { type: String, default: "" },
  name: { type: String, required: true },
  weightPct: { type: Number, required: true },
  maxMarks: { type: Number, required: true },
});

const hierarchicalAssessmentSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  maxMarks: { type: Number, required: true },
});

const componentSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  weightPct: { type: Number, required: true },
  rule: {
    type: String,
    enum: ["average", "sum", "highest", "best_n", "lowest", "custom"],
    default: "average",
  },
  bestN: { type: Number },
  assessments: [hierarchicalAssessmentSchema],
});

const templateSchema = new mongoose.Schema(
  {
    university: {
      type: String,
      required: [true, "University name is required"],
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Scheme name is required"],
      trim: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    usedBy: {
      type: Number,
      default: 0,
    },
    components: [componentSchema],
    assessmentTypes: [assessmentTypeSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const Template = mongoose.model("Template", templateSchema);

module.exports = Template;
