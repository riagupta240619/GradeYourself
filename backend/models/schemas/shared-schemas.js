"use strict";

const mongoose = require("mongoose");

/**
 * Shared Mongoose sub-schemas used across Subject and Template models.
 * Extracted to a single source of truth to eliminate duplication.
 */

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

module.exports = {
  assessmentTypeSchema,
  hierarchicalAssessmentSchema,
  componentSchema,
};
