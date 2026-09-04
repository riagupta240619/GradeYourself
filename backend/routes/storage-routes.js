"use strict";

const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth-middleware");
const c = require("../controllers/storage-controller");

router.use(verifyToken);

// Files
router.get("/files", c.list);
router.post("/upload", c.uploadMiddleware.single("file"), c.upload);
router.get("/files/:id/content", c.download);
router.patch("/files/:id", c.patchFile);
router.delete("/files/:id", c.trash);
router.post("/files/:id/restore", c.restore);
router.delete("/files/:id/permanent", c.permanent);

// Folders
router.get("/folders", c.folders);
router.post("/folders", c.createFolder);
router.delete("/folders/:id", c.deleteFolder);

// Saved Links
router.get("/links", c.listLinks);
router.post("/links", c.createLink);
router.delete("/links/:id", c.deleteLink);

// Stats
router.get("/stats", c.stats);

module.exports = router;