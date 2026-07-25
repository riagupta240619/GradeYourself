const express = require("express");
const router = express.Router();
const {
  addSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
} = require("../controllers/subject-controller");
const { verifyToken } = require("../middleware/auth-middleware");

router.post("/", verifyToken, addSubject);
router.get("/", verifyToken, getSubjects);
router.get("/:id", verifyToken, getSubjectById);
router.put("/:id", verifyToken, updateSubject);
router.delete("/:id", verifyToken, deleteSubject);

module.exports = router;
