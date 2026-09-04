"use strict";

const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth-middleware");
const controller = require("../controllers/resourceController");

// Public endpoints
router.get("/", controller.getTree);
router.get("/tree", controller.getTree);
router.get("/catalog", controller.legacyCatalog);
router.get("/subject/:subject", controller.getBySubject);
router.get("/subject/:subject/topic/:topic", controller.getByTopic);
router.get("/detail/:id", controller.getById);
router.get("/item/:id", controller.getById);
router.post("/refresh", controller.refresh);

// Bookmark endpoints (Authenticated)
router.get("/saved", verifyToken, controller.listBookmarks);
router.post("/saved", verifyToken, controller.saveBookmark);
router.delete("/saved/:id", verifyToken, controller.deleteBookmark);

// Catch-all single resource by ID (kept after specific sub-routes)
router.get("/:id", controller.getById);

module.exports = router;
