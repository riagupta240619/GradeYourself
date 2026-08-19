const express = require("express");
const router = express.Router();
const {
  getAuthUrl,
  exchangeCodeForToken,
  fetchUserRepos,
  linkRepoToSubject,
  getLinkedRepos,
  unlinkRepo,
  isRepoLinked,
  getRepoDetails,
  updateLinkVisibility,
} = require("../controllers/github-controller");
const { verifyToken } = require("../middleware/auth-middleware");

router.get("/authorize", getAuthUrl);
router.post("/token", exchangeCodeForToken);
router.get("/repos", verifyToken, fetchUserRepos);
router.post("/link", verifyToken, linkRepoToSubject);
router.get("/linked", verifyToken, getLinkedRepos);
router.delete("/link/:linkId", verifyToken, unlinkRepo);
router.get("/linked/check", verifyToken, isRepoLinked);
router.get("/repos/:fullName", verifyToken, getRepoDetails);
router.patch("/link/:linkId/visibility", verifyToken, updateLinkVisibility);

module.exports = router;