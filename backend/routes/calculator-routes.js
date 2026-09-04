const express = require("express");
const router = express.Router();
const {
  calculateCgpaPublic,
  calculateSgpaPublic,
  predictGradesPublic,
  calculateCustomSchemePublic,
} = require("../controllers/calculator-controller");

// Public calculator routes - no authentication required
router.post("/cgpa", calculateCgpaPublic);
router.post("/sgpa", calculateSgpaPublic);
router.post("/grade-prediction", predictGradesPublic);
router.post("/custom-scheme", calculateCustomSchemePublic);

module.exports = router;