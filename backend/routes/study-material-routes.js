const express = require("express");
const router = express.Router();
const {
  uploadResource,
  getResources,
  getResourceById,
  updateResourceVisibility,
  incrementDownloadCount,
  deleteResource,
  searchResources,
  getPublicResources,
  getResourceStats,
} = require("../controllers/study-material-controller");
const { verifyToken } = require("../middleware/auth-middleware");

// Protected routes (require authentication)
router.post("/upload", verifyToken, uploadResource);
router.get("/", verifyToken, getResources);
router.get("/stats", verifyToken, getResourceStats);
router.get("/:id", verifyToken, getResourceById);
router.patch("/:id/visibility", verifyToken, updateResourceVisibility);
router.patch("/:id/downloads", verifyToken, incrementDownloadCount);
router.delete("/:id", verifyToken, deleteResource);
router.get("/search", verifyToken, searchResources);

// Public routes (no authentication required)
router.get("/public", getPublicResources);

module.exports = router;