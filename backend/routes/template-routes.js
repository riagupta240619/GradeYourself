const express = require("express");
const router = express.Router();
const { getTemplates } = require("../controllers/template-controller");
const { verifyToken } = require("../middleware/auth-middleware");

// Protected Route for Community Templates
router.get("/", verifyToken, getTemplates);

module.exports = router;
