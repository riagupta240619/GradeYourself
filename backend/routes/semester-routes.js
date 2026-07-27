const express = require("express");
const router = express.Router();
const {
  addSemester,
  getSemesters,
  updateSemester,
  updateFullSemester,
  deleteSemester,
  bulkSaveTranscript,
  finalizeSemester,
} = require("../controllers/semester-controller");
const { verifyToken } = require("../middleware/auth-middleware");

router.post("/bulk-transcript", verifyToken, bulkSaveTranscript);
router.post("/:id/finalize", verifyToken, finalizeSemester);
router.post("/", verifyToken, addSemester);
router.get("/", verifyToken, getSemesters);
router.put("/:id/full", verifyToken, updateFullSemester);
router.put("/:id", verifyToken, updateSemester);
router.delete("/:id", verifyToken, deleteSemester);

module.exports = router;
