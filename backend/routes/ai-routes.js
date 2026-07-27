"use strict";

const express = require("express");
const router = express.Router();
const { parseTranscriptWithAi } = require("../controllers/ai-controller");
const { protect } = require("../middleware/auth-middleware");

// AI Document Understanding endpoint (protected for authenticated users)
router.post("/parse-transcript", protect, parseTranscriptWithAi);

module.exports = router;
