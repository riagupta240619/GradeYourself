"use strict";

const {
  AttendanceSubject,
  AttendanceRecord,
  TimetableEntry,
  AttendanceSettings,
} = require("../models/attendance-model");
const Subject = require("../models/subject-model");

function computeSubjectMetrics(subj, defaultReqPct = 75, mode = "session") {
  const reqPct = subj.requiredPercentage || defaultReqPct;
  const multiplier = mode === "hours" ? (subj.lectureDurationHours || 1) : 1;

  const delivered = (subj.deliveredClasses || 0) * multiplier;
  const attendedEffective =
    ((subj.attendedClasses || 0) +
      (subj.dutyLeaves || 0) +
      (subj.medicalLeaves || 0)) *
    multiplier;

  let percentage = 100;
  let safeBunks = 0;
  let classesToRecover = 0;
  let isAtRisk = false;

  if (delivered > 0) {
    percentage = Number(((attendedEffective / delivered) * 100).toFixed(1));

    if (percentage >= reqPct) {
      // Safe bunks calculation: A / (T + X) >= R / 100 => X <= (A * 100 / R) - T
      const maxMiss = Math.floor((attendedEffective * 100) / reqPct - delivered);
      safeBunks = Math.max(0, maxMiss);
      classesToRecover = 0;
      isAtRisk = false;
    } else {
      safeBunks = 0;
      isAtRisk = true;
      // Recovery calculation: (A + C) / (T + C) >= R / 100 => C >= (R * T - 100 * A) / (100 - R)
      if (reqPct < 100) {
        const needed = Math.ceil(
          (reqPct * delivered - 100 * attendedEffective) / (100 - reqPct)
        );
        classesToRecover = Math.max(1, needed);
      } else {
        classesToRecover = 1;
      }
    }
  }

  return {
    ...subj,
    effectiveDelivered: delivered,
    effectiveAttended: attendedEffective,
    attendancePercentage: percentage,
    safeBunks,
    classesToRecover,
    isAtRisk,
    requiredPercentage: reqPct,
  };
}

/**
 * GET /api/attendance/dashboard
 */
async function getDashboard(req, res, next) {
  try {
    const userId = req.user._id;

    let settings = await AttendanceSettings.findOne({ user: userId }).lean();
    if (!settings) {
      settings = { defaultRequiredPercentage: 75, calculationMode: "session" };
    }

    const rawSubjects = await AttendanceSubject.find({ user: userId })
      .sort({ subjectName: 1 })
      .lean();

    const subjects = rawSubjects.map((s) =>
      computeSubjectMetrics(s, settings.defaultRequiredPercentage, settings.calculationMode)
    );

    let totalDelivered = 0;
    let totalAttended = 0;
    let totalSafeBunks = 0;
    let subjectsAtRisk = 0;

    subjects.forEach((s) => {
      totalDelivered += s.effectiveDelivered;
      totalAttended += s.effectiveAttended;
      totalSafeBunks += s.safeBunks;
      if (s.isAtRisk) subjectsAtRisk++;
    });

    const overallPercentage =
      totalDelivered > 0
        ? Number(((totalAttended / totalDelivered) * 100).toFixed(1))
        : 100;

    // Recent records for timeline
    const recentRecords = await AttendanceRecord.find({ user: userId })
      .populate("subject", "subjectName subjectCode colorTag")
      .sort({ date: -1 })
      .limit(10)
      .lean();

    res.json({
      overallPercentage,
      requiredPercentage: settings.defaultRequiredPercentage,
      calculationMode: settings.calculationMode,
      totalSubjects: subjects.length,
      subjectsAtRisk,
      totalSafeBunks,
      totalDelivered,
      totalAttended,
      subjects,
      recentRecords,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/attendance/subjects
 */
async function getSubjects(req, res, next) {
  try {
    const userId = req.user._id;
    const settings = (await AttendanceSettings.findOne({ user: userId }).lean()) || {
      defaultRequiredPercentage: 75,
      calculationMode: "session",
    };

    const rawSubjects = await AttendanceSubject.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean();

    const subjects = rawSubjects.map((s) =>
      computeSubjectMetrics(s, settings.defaultRequiredPercentage, settings.calculationMode)
    );

    res.json({ subjects, settings });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/attendance/subjects
 */
async function createSubject(req, res, next) {
  try {
    const userId = req.user._id;
    const {
      subjectCode,
      subjectName,
      teacherName,
      deliveredClasses,
      attendedClasses,
      dutyLeaves,
      medicalLeaves,
      requiredPercentage,
      lectureDurationHours,
      lecturesPerWeek,
      colorTag,
      notes,
    } = req.body;

    if (!subjectName || !subjectName.trim()) {
      res.status(400);
      throw new Error("Subject name is required");
    }

    const newSubj = await AttendanceSubject.create({
      user: userId,
      subjectCode: (subjectCode || "").trim(),
      subjectName: subjectName.trim(),
      teacherName: (teacherName || "").trim(),
      deliveredClasses: Number(deliveredClasses) || 0,
      attendedClasses: Number(attendedClasses) || 0,
      dutyLeaves: Number(dutyLeaves) || 0,
      medicalLeaves: Number(medicalLeaves) || 0,
      requiredPercentage: Number(requiredPercentage) || 75,
      lectureDurationHours: Number(lectureDurationHours) || 1,
      lecturesPerWeek: Number(lecturesPerWeek) || 3,
      colorTag: colorTag || "#8b5cf6",
      notes: (notes || "").trim(),
    });

    res.status(201).json({ subject: newSubj });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/attendance/subjects/:id
 */
async function updateSubject(req, res, next) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const allowedFields = [
      "subjectCode",
      "subjectName",
      "teacherName",
      "deliveredClasses",
      "attendedClasses",
      "dutyLeaves",
      "medicalLeaves",
      "requiredPercentage",
      "lectureDurationHours",
      "lecturesPerWeek",
      "colorTag",
      "notes",
    ];

    const patch = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        patch[key] = req.body[key];
      }
    }

    const updated = await AttendanceSubject.findOneAndUpdate(
      { _id: id, user: userId },
      patch,
      { new: true, runValidators: true }
    );

    if (!updated) {
      res.status(404);
      throw new Error("Attendance subject not found");
    }

    res.json({ subject: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/attendance/subjects/:id
 */
async function deleteSubject(req, res, next) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const deleted = await AttendanceSubject.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!deleted) {
      res.status(404);
      throw new Error("Attendance subject not found");
    }

    // Also clean up records and timetable entries for this subject
    await AttendanceRecord.deleteMany({ user: userId, subject: id });
    await TimetableEntry.deleteMany({ user: userId, subject: id });

    res.json({ message: "Subject and related records deleted successfully" });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/attendance/subjects/sync-from-cgpa
 * One-click import existing academic subjects into Attendance
 */
async function syncFromCgpa(req, res, next) {
  try {
    const userId = req.user._id;
    const academicSubjects = await Subject.find({ user: userId }).lean();

    if (!academicSubjects.length) {
      return res.json({
        imported: 0,
        message: "No existing CGPA subjects found to import.",
      });
    }

    let count = 0;
    for (const s of academicSubjects) {
      const exists = await AttendanceSubject.findOne({
        user: userId,
        subjectName: s.name,
      });

      if (!exists) {
        await AttendanceSubject.create({
          user: userId,
          subjectCode: s.code || "",
          subjectName: s.name,
          colorTag: s.colorTag || "#8b5cf6",
          deliveredClasses: 10,
          attendedClasses: 9,
          requiredPercentage: 75,
          lectureDurationHours: 1,
        });
        count++;
      }
    }

    res.json({
      imported: count,
      message: `Imported ${count} subjects from your academic profile.`,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/attendance/records
 * Mark attendance: present, absent, dl, ml
 */
async function markAttendance(req, res, next) {
  try {
    const userId = req.user._id;
    const { subjectId, status, date, durationHours, topic, notes } = req.body;

    if (!subjectId) {
      res.status(400);
      throw new Error("Subject is required");
    }

    const subject = await AttendanceSubject.findOne({
      _id: subjectId,
      user: userId,
    });
    if (!subject) {
      res.status(404);
      throw new Error("Subject not found");
    }

    const record = await AttendanceRecord.create({
      user: userId,
      subject: subjectId,
      status: status || "present",
      date: date ? new Date(date) : new Date(),
      durationHours: durationHours || subject.lectureDurationHours || 1,
      topic: topic || "",
      notes: notes || "",
    });

    // Automatically update subject totals
    subject.deliveredClasses += 1;
    if (status === "present") {
      subject.attendedClasses += 1;
    } else if (status === "dl") {
      subject.dutyLeaves += 1;
    } else if (status === "ml") {
      subject.medicalLeaves += 1;
    }
    // "absent" only increments deliveredClasses
    await subject.save();

    res.status(201).json({ record, subject });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/attendance/records
 */
async function getRecords(req, res, next) {
  try {
    const userId = req.user._id;
    const { subjectId, limit = 50 } = req.query;

    const query = { user: userId };
    if (subjectId) query.subject = subjectId;

    const records = await AttendanceRecord.find(query)
      .populate("subject", "subjectName subjectCode colorTag")
      .sort({ date: -1 })
      .limit(Number(limit))
      .lean();

    res.json({ records });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/attendance/records/:id
 */
async function deleteRecord(req, res, next) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const record = await AttendanceRecord.findOne({ _id: id, user: userId });
    if (!record) {
      res.status(404);
      throw new Error("Attendance record not found");
    }

    // Revert count on subject
    const subject = await AttendanceSubject.findOne({
      _id: record.subject,
      user: userId,
    });
    if (subject) {
      subject.deliveredClasses = Math.max(0, subject.deliveredClasses - 1);
      if (record.status === "present") {
        subject.attendedClasses = Math.max(0, subject.attendedClasses - 1);
      } else if (record.status === "dl") {
        subject.dutyLeaves = Math.max(0, subject.dutyLeaves - 1);
      } else if (record.status === "ml") {
        subject.medicalLeaves = Math.max(0, subject.medicalLeaves - 1);
      }
      await subject.save();
    }

    await AttendanceRecord.deleteOne({ _id: id, user: userId });

    res.json({ message: "Record deleted and totals updated", subject });
  } catch (err) {
    next(err);
  }
}

/**
 * Timetable Management
 */
async function getTimetable(req, res, next) {
  try {
    const userId = req.user._id;
    const timetable = await TimetableEntry.find({ user: userId })
      .populate("subject", "subjectName subjectCode colorTag teacherName lectureDurationHours")
      .sort({ dayOfWeek: 1, startTime: 1 })
      .lean();

    res.json({ timetable });
  } catch (err) {
    next(err);
  }
}

async function addTimetableEntry(req, res, next) {
  try {
    const userId = req.user._id;
    const {
      dayOfWeek,
      startTime,
      endTime,
      subjectId,
      subjectName,
      teacherName,
      room,
      lectureDurationHours,
    } = req.body;

    if (!dayOfWeek || !startTime || !endTime) {
      res.status(400);
      throw new Error("Day of week, start time, and end time are required");
    }

    let finalSubjectName = subjectName;
    let finalTeacher = teacherName;
    let finalDuration = Number(lectureDurationHours) || 1;

    if (subjectId) {
      const sub = await AttendanceSubject.findOne({ _id: subjectId, user: userId });
      if (sub) {
        finalSubjectName = sub.subjectName;
        finalTeacher = finalTeacher || sub.teacherName;
        finalDuration = finalDuration || sub.lectureDurationHours || 1;
      }
    }

    if (!finalSubjectName) {
      res.status(400);
      throw new Error("Subject name is required");
    }

    const entry = await TimetableEntry.create({
      user: userId,
      dayOfWeek,
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      subject: subjectId || null,
      subjectName: finalSubjectName.trim(),
      teacherName: (finalTeacher || "").trim(),
      room: (room || "").trim(),
      lectureDurationHours: finalDuration,
    });

    res.status(201).json({ entry });
  } catch (err) {
    next(err);
  }
}

async function deleteTimetableEntry(req, res, next) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const deleted = await TimetableEntry.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!deleted) {
      res.status(404);
      throw new Error("Timetable slot not found");
    }

    res.json({ message: "Timetable slot deleted" });
  } catch (err) {
    next(err);
  }
}

/**
 * Attendance Settings
 */
async function getSettings(req, res, next) {
  try {
    const userId = req.user._id;
    let settings = await AttendanceSettings.findOne({ user: userId }).lean();
    if (!settings) {
      settings = await AttendanceSettings.create({
        user: userId,
        defaultRequiredPercentage: 75,
        calculationMode: "session",
      });
    }
    res.json({ settings });
  } catch (err) {
    next(err);
  }
}

async function updateSettings(req, res, next) {
  try {
    const userId = req.user._id;
    const { defaultRequiredPercentage, calculationMode } = req.body;

    const patch = {};
    if (defaultRequiredPercentage !== undefined) {
      patch.defaultRequiredPercentage = Math.min(
        100,
        Math.max(1, Number(defaultRequiredPercentage))
      );
    }
    if (calculationMode !== undefined && ["session", "hours"].includes(calculationMode)) {
      patch.calculationMode = calculationMode;
    }

    const settings = await AttendanceSettings.findOneAndUpdate(
      { user: userId },
      patch,
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ settings });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboard,
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  syncFromCgpa,
  markAttendance,
  getRecords,
  deleteRecord,
  getTimetable,
  addTimetableEntry,
  deleteTimetableEntry,
  getSettings,
  updateSettings,
};
