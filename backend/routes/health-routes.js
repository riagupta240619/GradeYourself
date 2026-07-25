"use strict";

const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Health check endpoint verifying Express status and MongoDB connectivity
 * @access  Public
 */
router.get("/health", (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;

  if (isDbConnected) {
    return res.status(200).json({
      status: "ok",
      database: "connected",
    });
  }

  return res.status(503).json({
    status: "error",
    database: "disconnected",
  });
});

module.exports = router;
