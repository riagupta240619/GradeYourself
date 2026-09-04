"use strict";

const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth-middleware");
const c = require("../controllers/attendance-controller");

router.use(verifyToken);

router.get("/dashboard", c.getDashboard);
router.get("/subjects", c.getSubjects);
router.post("/subjects", c.createSubject);
router.patch("/subjects/:id", c.updateSubject);
router.delete("/subjects/:id", c.deleteSubject);
router.post("/subjects/sync-from-cgpa", c.syncFromCgpa);

router.post("/records", c.markAttendance);
router.get("/records", c.getRecords);
router.delete("/records/:id", c.deleteRecord);

router.get("/timetable", c.getTimetable);
router.post("/timetable", c.addTimetableEntry);
router.delete("/timetable/:id", c.deleteTimetableEntry);

router.get("/settings", c.getSettings);
router.put("/settings", c.updateSettings);

module.exports = router;
