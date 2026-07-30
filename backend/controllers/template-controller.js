"use strict";

const Template = require("../models/template-model");

/**
 * @route   GET /api/templates
 * @desc    Get all community grading scheme templates from database
 * @access  Private (Protected by verifyToken)
 */
const getTemplates = async (req, res, next) => {
  try {
    let templates = await Template.find().sort({ usedBy: -1, createdAt: -1 });

    if (templates.length === 0) {
      const defaultTemplates = [
        {
          university: "Chitkara University",
          name: "Chitkara ST + ETE Scheme",
          verified: true,
          usedBy: 1420,
          components: [
            {
              id: "comp-st",
              name: "Sessional Tests",
              weightPct: 50,
              rule: "average",
              assessments: [
                { id: "st1", name: "ST1 (Sessional Test 1)", maxMarks: 25 },
                { id: "st2", name: "ST2 (Sessional Test 2)", maxMarks: 25 },
              ],
            },
            {
              id: "comp-ete",
              name: "End Term Examination (ETE)",
              weightPct: 50,
              rule: "average",
              assessments: [{ id: "ete", name: "Final ETE Paper", maxMarks: 100 }],
            },
          ],
        },
        {
          university: "Standard University",
          name: "Theory Subject (Internal 40% + Final 60%)",
          verified: true,
          usedBy: 980,
          components: [
            {
              id: "comp-internal",
              name: "Internal Continuous Assessment",
              weightPct: 40,
              rule: "average",
              assessments: [
                { id: "q1", name: "Quiz 1", maxMarks: 10 },
                { id: "q2", name: "Quiz 2", maxMarks: 10 },
                { id: "a1", name: "Assignment", maxMarks: 20 },
              ],
            },
            {
              id: "comp-final",
              name: "Final Examination",
              weightPct: 60,
              rule: "average",
              assessments: [{ id: "final", name: "Final Theory Paper", maxMarks: 100 }],
            },
          ],
        },
        {
          university: "Universal Engineering",
          name: "Practical / Lab Course",
          verified: true,
          usedBy: 750,
          components: [
            {
              id: "comp-lab",
              name: "Weekly Experiments",
              weightPct: 60,
              rule: "best_n",
              bestN: 4,
              assessments: [
                { id: "exp1", name: "Experiment 1", maxMarks: 10 },
                { id: "exp2", name: "Experiment 2", maxMarks: 10 },
                { id: "exp3", name: "Experiment 3", maxMarks: 10 },
                { id: "exp4", name: "Experiment 4", maxMarks: 10 },
                { id: "exp5", name: "Experiment 5", maxMarks: 10 },
              ],
            },
            {
              id: "comp-viva",
              name: "Final Practical & Viva",
              weightPct: 40,
              rule: "sum",
              assessments: [
                { id: "viva", name: "Viva Voce", maxMarks: 20 },
                { id: "prac", name: "Practical Execution", maxMarks: 30 },
              ],
            },
          ],
        },
      ];

      templates = await Template.insertMany(defaultTemplates);
    }

    res.status(200).json(templates);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/templates
 * @desc    Save a custom evaluation scheme as a reusable template
 * @access  Private
 */
const createTemplate = async (req, res, next) => {
  try {
    const { name, university, components, assessmentTypes } = req.body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      res.status(400);
      throw new Error("Template name is required");
    }

    const template = await Template.create({
      name: name.trim(),
      university: (university || "Custom User Scheme").trim(),
      components: components || [],
      assessmentTypes: assessmentTypes || [],
      createdBy: req.user._id,
      usedBy: 1,
    });

    res.status(201).json(template);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/templates/:id
 * @desc    Delete a custom template owned by the user
 * @access  Private
 */
const deleteTemplate = async (req, res, next) => {
  try {
    const template = await Template.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!template) {
      res.status(404);
      throw new Error("Template not found or unauthorized");
    }
    res.status(200).json({ message: "Template deleted successfully", id: req.params.id });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTemplates,
  createTemplate,
  deleteTemplate,
};
