"use strict";

const express = require("express");
const router = express.Router();
const multer = require("multer");
const { verifyToken } = require("../middleware/auth-middleware");
const c = require("../controllers/quiz-controller");

const upload = multer({
  dest: "uploads/temp/",
  limits: { fileSize: 25 * 1024 * 1024 },
});

router.use(verifyToken);

router.post("/generate", upload.single("file"), c.generateQuiz);
router.post("/:id/submit", c.submitAttempt);
router.get("/history", c.getHistory);
router.get("/:id", c.getQuizById);

module.exports = router;