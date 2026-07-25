const express = require("express");
const router = express.Router();
const {
  getDashboardSummary,
  getSemesters,
  getSubjects,
  getCgpaSummary,
} = require("../controllers/dashboard-controller");
const { verifyToken } = require("../middleware/auth-middleware");

router.get("/summary", verifyToken, getDashboardSummary);
router.get("/semesters", verifyToken, getSemesters);
router.get("/subjects", verifyToken, getSubjects);
router.get("/cgpa", verifyToken, getCgpaSummary);

module.exports = router;
