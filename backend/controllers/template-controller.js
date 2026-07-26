"use strict";

const Template = require("../models/template-model");

/**
 * @route   GET /api/templates
 * @desc    Get all community grading scheme templates from database
 * @access  Private (Protected by verifyToken)
 */
const getTemplates = async (req, res, next) => {
  try {
    const templates = await Template.find().sort({ usedBy: -1, createdAt: -1 });
    res.status(200).json(templates);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTemplates,
};
