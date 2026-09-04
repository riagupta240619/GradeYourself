"use strict";

const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth-middleware");
const interviewController = require("../controllers/interview-controller");

// Interview Preparation Hub routes
router.use(verifyToken);

router.get("/interview-prep", interviewController.listQuestions);
router.post("/interview-prep", interviewController.createQuestion);
router.post("/interview-prep/sync", interviewController.syncCuratedQuestions);
router.patch("/interview-prep/:id", interviewController.updateQuestion);
router.delete("/interview-prep/:id", interviewController.deleteQuestion);
router.get("/interview-prep/progress", interviewController.getProgress);
router.get("/interview-prep/discover", interviewController.discoverCompanyQuestions);

// Retain legacy resume route stubs
router.get("/resume", async (req, res) => res.json({ resumes: [] }));
router.get("/resume/ats-comparison", async (req, res) => res.json({ comparisons: [] }));

module.exports = router;