"use strict";

const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    itemType: {
      type: String,
      enum: [
        "file",
        "link",
        "interview_question",
        "coding_question",
        "study_resource",
        "learning_sheet",
      ],
      required: true,
      index: true,
    },
    itemId: {
      type: String,
      default: "",
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    url: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      trim: true,
      default: "General",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

favoriteSchema.index({ user: 1, itemType: 1, itemId: 1 });
favoriteSchema.index({ user: 1, url: 1 });

module.exports = mongoose.model("Favorite", favoriteSchema);
