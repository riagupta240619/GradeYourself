const express = require("express");
const router = express.Router();
const {
  addSemester,
  getSemesters,
  updateSemester,
  deleteSemester,
} = require("../controllers/semester-controller");
const { verifyToken } = require("../middleware/auth-middleware");

router.post("/", verifyToken, addSemester);
router.get("/", verifyToken, getSemesters);
router.put("/:id", verifyToken, updateSemester);
router.delete("/:id", verifyToken, deleteSemester);

module.exports = router;
