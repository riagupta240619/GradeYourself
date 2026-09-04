"use strict";

const mongoose = require("mongoose");

const attendanceSubjectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subjectCode: {
      type: String,
      trim: true,
      default: "",
    },
    subjectName: {
      type: String,
      required: [true, "Subject name is required"],
      trim: true,
    },
    teacherName: {
      type: String,
      trim: true,
      default: "",
    },
    deliveredClasses: {
      type: Number,
      default: 0,
      min: 0,
    },
    attendedClasses: {
      type: Number,
      default: 0,
      min: 0,
    },
    dutyLeaves: {
      type: Number,
      default: 0,
      min: 0,
    },
    medicalLeaves: {
      type: Number,
      default: 0,
      min: 0,
    },
    requiredPercentage: {
      type: Number,
      default: 75,
      min: 1,
      max: 100,
    },
    lectureDurationHours: {
      type: Number,
      default: 1,
      min: 0.5,
      max: 6,
    },
    lecturesPerWeek: {
      type: Number,
      default: 3,
      min: 1,
      max: 20,
    },
    colorTag: {
      type: String,
      default: "#8b5cf6",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

attendanceSubjectSchema.index({ user: 1, subjectName: 1 });

const attendanceRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttendanceSubject",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["present", "absent", "dl", "ml"],
      default: "present",
    },
    durationHours: {
      type: Number,
      default: 1,
    },
    topic: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

attendanceRecordSchema.index({ user: 1, date: -1 });

const timetableEntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    dayOfWeek: {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttendanceSubject",
      default: null,
    },
    subjectName: {
      type: String,
      required: true,
      trim: true,
    },
    teacherName: {
      type: String,
      trim: true,
      default: "",
    },
    room: {
      type: String,
      trim: true,
      default: "",
    },
    lectureDurationHours: {
      type: Number,
      default: 1,
      min: 0.5,
      max: 6,
    },
  },
  { timestamps: true }
);

timetableEntrySchema.index({ user: 1, dayOfWeek: 1 });

const attendanceSettingsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    defaultRequiredPercentage: {
      type: Number,
      default: 75,
      min: 1,
      max: 100,
    },
    calculationMode: {
      type: String,
      enum: ["session", "hours"],
      default: "session",
    },
  },
  { timestamps: true }
);

const AttendanceSubject = mongoose.model(
  "AttendanceSubject",
  attendanceSubjectSchema
);
const AttendanceRecord = mongoose.model(
  "AttendanceRecord",
  attendanceRecordSchema
);
const TimetableEntry = mongoose.model(
  "TimetableEntry",
  timetableEntrySchema
);
const AttendanceSettings = mongoose.model(
  "AttendanceSettings",
  attendanceSettingsSchema
);

module.exports = {
  AttendanceSubject,
  AttendanceRecord,
  TimetableEntry,
  AttendanceSettings,
};
