const express = require("express");
const router = express.Router();
const { getAnalyticsSummary } = require("../controllers/analytics-controller");
const { verifyToken } = require("../middleware/auth-middleware");

router.get("/", verifyToken, getAnalyticsSummary);

module.exports = router;
