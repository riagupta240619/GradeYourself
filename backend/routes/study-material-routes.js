const express = require("express");
const router = express.Router();
const {
  uploadMaterial,
  getMaterials,
  getMaterialById,
  updateMaterialVisibility,
  incrementDownloadCount,
  deleteMaterial,
  searchMaterials,
} = require("../controllers/study-material-controller");
const { verifyToken } = require("../middleware/auth-middleware");

router.post("/upload", verifyToken, uploadMaterial);
router.get("/", verifyToken, getMaterials);
router.get("/:id", verifyToken, getMaterialById);
router.patch("/:id/visibility", verifyToken, updateMaterialVisibility);
router.patch("/:id/downloads", verifyToken, incrementDownloadCount);
router.delete("/:id", verifyToken, deleteMaterial);
router.get("/search", verifyToken, searchMaterials);

module.exports = router;