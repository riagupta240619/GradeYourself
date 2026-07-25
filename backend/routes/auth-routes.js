const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  updateSetupProfile,
  updateUserProfile,
  changeUserPassword,
} = require("../controllers/auth-controller");
const { verifyToken } = require("../middleware/auth-middleware");

// Public Auth Routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);

// Protected Auth Routes
router.get("/me", verifyToken, getUserProfile);
router.put("/setup", verifyToken, updateSetupProfile);
router.put("/profile", verifyToken, updateUserProfile);
router.put("/change-password", verifyToken, changeUserPassword);

module.exports = router;
