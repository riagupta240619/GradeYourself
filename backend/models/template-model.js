const mongoose = require("mongoose");

const assessmentTypeSchema = new mongoose.Schema({
  id: { type: String, default: "" },
  name: { type: String, required: true },
  weightPct: { type: Number, required: true },
  maxMarks: { type: Number, required: true },
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
