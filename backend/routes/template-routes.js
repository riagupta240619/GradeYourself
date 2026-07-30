const express = require("express");
const router = express.Router();
const { getTemplates, createTemplate, deleteTemplate } = require("../controllers/template-controller");
const { verifyToken } = require("../middleware/auth-middleware");

router.get("/", verifyToken, getTemplates);
router.post("/", verifyToken, createTemplate);
router.delete("/:id", verifyToken, deleteTemplate);

module.exports = router;
