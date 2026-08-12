const mongoose = require("mongoose");
const {
  assessmentTypeSchema,
  componentSchema,
} = require("./schemas/shared-schemas");

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
