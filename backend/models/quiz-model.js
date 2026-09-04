"use strict";

const mongoose = require("mongoose");

const quizQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["mcq", "true_false", "short_answer"],
      default: "mcq",
    },
    options: [{ type: String, trim: true }],
    correctAnswer: { type: String, required: true, trim: true },
    explanation: { type: String, trim: true, default: "" },
    topic: { type: String, trim: true, default: "General" },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
  },
  { _id: true }
);

const quizDocumentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    sourceFileName: {
      type: String,
      trim: true,
      default: "",
    },
    sourceFileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StorageFile",
      default: null,
    },
    numQuestions: {
      type: Number,
      default: 5,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    topics: [{ type: String, trim: true }],
    questions: [quizQuestionSchema],
  },
  { timestamps: true }
);

const quizAttemptAnswerSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true },
    questionText: { type: String, required: true },
    userAnswer: { type: String, default: "" },
    correctAnswer: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
    explanation: { type: String, default: "" },
    topic: { type: String, default: "General" },
  },
  { _id: false }
);

const quizAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuizDocument",
      required: true,
      index: true,
    },
    quizTitle: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
    strongTopics: [{ type: String }],
    weakTopics: [{ type: String }],
    answers: [quizAttemptAnswerSchema],
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

quizAttemptSchema.index({ user: 1, completedAt: -1 });

const QuizDocument = mongoose.model("QuizDocument", quizDocumentSchema);
const QuizAttempt = mongoose.model("QuizAttempt", quizAttemptSchema);

module.exports = {
  QuizDocument,
  QuizAttempt,
};
