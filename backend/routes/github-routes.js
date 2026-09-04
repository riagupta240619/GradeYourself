"use strict";

const express = require("express");
const router = express.Router();
const c = require("../controllers/github-controller");
const { verifyToken } = require("../middleware/auth-middleware");

router.get("/authorize", c.getAuthUrl);
router.post("/token", c.exchangeCodeForToken);

router.use(verifyToken);

router.get("/status", c.getStatus);
router.post("/connect", c.connectAccount);
router.post("/disconnect", c.disconnectAccount);
router.get("/repos", c.fetchUserRepos);
router.post("/featured", c.toggleFeatured);
router.get("/featured", c.getFeaturedProjects);

router.post("/link", c.linkRepoToSubject);
router.get("/linked", c.getLinkedRepos);
router.delete("/link/:linkId", c.unlinkRepo);
router.get("/linked/check", c.isRepoLinked);
router.get("/repos/:fullName", c.getRepoDetails);
router.patch("/link/:linkId/visibility", c.updateLinkVisibility);

module.exports = router;