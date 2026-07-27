"use strict";

const User = require("../models/user-model");
const generateToken = require("../utils/generate-token");
const { validatePassword } = require("../utils/password-validator");
const {
  AUTH_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  getAuthCookieOptions,
  getClearAuthCookieOptions,
  getCsrfCookieOptions,
  getClearCsrfCookieOptions,
} = require("../utils/cookie-config");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Helper to validate basic string input and enforce length limit.
 */
function sanitizeString(input, maxLength = 150) {
  if (typeof input !== "string") return "";
  return input.trim().slice(0, maxLength);
}

/**
 * Format user object for client responses.
 */
function formatUserResponse(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    college: user.college || "",
    course: user.course || "",
    branch: user.branch || "",
    semesterSystem: user.semesterSystem || "",
    currentSemester: user.currentSemester || user.semesterSystem || "",
    academicSession: user.academicSession || "",
    currentCgpa: typeof user.currentCgpa === "number" ? user.currentCgpa : null,
    academicStatus: user.academicStatus || "",
    targetCgpa: typeof user.targetCgpa === "number" ? user.targetCgpa : 9.0,
    totalDegreeCredits: typeof user.totalDegreeCredits === "number" && !isNaN(user.totalDegreeCredits) && user.totalDegreeCredits > 0 ? user.totalDegreeCredits : 160,
    profileCompleted: Boolean(user.profileCompleted),
  };
}

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user, set HttpOnly auth_token cookie, and return safe user data
 * @access  Public
 */
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, college, course, semesterSystem } = req.body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      res.status(400);
      throw new Error("Name is required");
    }

    if (name.trim().length > 100) {
      res.status(400);
      throw new Error("Name cannot exceed 100 characters");
    }

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      res.status(400);
      throw new Error("Please provide a valid email address");
    }

    // Password validation using central policy (8-128 chars, uppercase, lowercase, number)
    const passwordError = validatePassword(password);
    if (passwordError) {
      res.status(400);
      throw new Error(passwordError);
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      res.status(400);
      throw new Error("User already exists with this email");
    }

    // Create user (password is automatically hashed via pre-save hook)
    const user = await User.create({
      name: sanitizeString(name, 100),
      email: cleanEmail,
      password,
      college: sanitizeString(college),
      course: sanitizeString(course),
      semesterSystem: sanitizeString(semesterSystem),
      currentSemester: sanitizeString(semesterSystem),
    });

    if (user) {
      const token = generateToken(user._id);

      // Set HttpOnly Authentication Cookie
      res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

      res.status(201).json(formatUserResponse(user));
    } else {
      res.status(400);
      throw new Error("Invalid user data");
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user, set HttpOnly auth_token cookie, and return safe user data
 * @access  Public
 */
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      res.status(400);
      throw new Error("Please provide email and password");
    }

    const cleanEmail = email.trim().toLowerCase();

    // Find user by email
    const user = await User.findOne({ email: cleanEmail });

    // Verify password using bcrypt.compare()
    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id);

      // Set HttpOnly Authentication Cookie
      res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

      res.status(200).json(formatUserResponse(user));
    } else {
      res.status(401);
      throw new Error("Invalid email or password");
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and clear HttpOnly auth_token & CSRF cookies
 * @access  Public
 */
const logoutUser = async (req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, getClearAuthCookieOptions());
  res.clearCookie(CSRF_COOKIE_NAME, getClearCsrfCookieOptions());

  res.status(200).json({
    message: "Logged out successfully",
  });
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user profile
 * @access  Private (Protected by verifyToken)
 */
const getUserProfile = async (req, res) => {
  res.status(200).json(formatUserResponse(req.user));
};

/**
 * @route   PUT /api/auth/setup
 * @desc    Update user academic setup profile & set profileCompleted = true
 * @access  Private (Protected by verifyToken)
 */
const updateSetupProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    const { college, course, semesterSystem, currentSemester, branch, academicSession, currentCgpa, academicStatus, targetCgpa, totalDegreeCredits } = req.body;

    if (college !== undefined) user.college = sanitizeString(college);
    if (course !== undefined) user.course = sanitizeString(course);
    if (branch !== undefined) user.branch = sanitizeString(branch);
    if (semesterSystem !== undefined) user.semesterSystem = sanitizeString(semesterSystem);
    if (currentSemester !== undefined) user.currentSemester = sanitizeString(currentSemester);
    if (academicSession !== undefined) user.academicSession = sanitizeString(academicSession);
    if (currentCgpa !== undefined) user.currentCgpa = currentCgpa === null || currentCgpa === "" || isNaN(Number(currentCgpa)) ? null : Number(currentCgpa);
    if (academicStatus !== undefined) user.academicStatus = sanitizeString(academicStatus);
    if (targetCgpa !== undefined && !isNaN(Number(targetCgpa))) user.targetCgpa = Number(targetCgpa);
    if (totalDegreeCredits !== undefined && !isNaN(Number(totalDegreeCredits)) && Number(totalDegreeCredits) > 0) user.totalDegreeCredits = Number(totalDegreeCredits);

    if (!user.currentSemester && user.semesterSystem) {
      user.currentSemester = user.semesterSystem;
    } else if (!user.semesterSystem && user.currentSemester) {
      user.semesterSystem = user.currentSemester;
    }

    user.profileCompleted = true;

    const updatedUser = await user.save();

    res.status(200).json(formatUserResponse(updatedUser));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile details (Name, College, Branch, Course, Current Semester, Batch, CGPA, Status, Target)
 * @access  Private (Protected by verifyToken)
 */
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    const { name, college, branch, course, semesterSystem, currentSemester, academicSession, currentCgpa, academicStatus, targetCgpa, totalDegreeCredits } = req.body;

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim() === "") {
        res.status(400);
        throw new Error("Name cannot be empty");
      }
      user.name = sanitizeString(name, 100);
    }

    if (college !== undefined) user.college = sanitizeString(college);
    if (branch !== undefined) user.branch = sanitizeString(branch);
    if (course !== undefined) user.course = sanitizeString(course);
    if (semesterSystem !== undefined) user.semesterSystem = sanitizeString(semesterSystem);
    if (currentSemester !== undefined) user.currentSemester = sanitizeString(currentSemester);
    if (academicSession !== undefined) user.academicSession = sanitizeString(academicSession);
    if (currentCgpa !== undefined) user.currentCgpa = currentCgpa === null || currentCgpa === "" || isNaN(Number(currentCgpa)) ? null : Number(currentCgpa);
    if (academicStatus !== undefined) user.academicStatus = sanitizeString(academicStatus);
    if (targetCgpa !== undefined && !isNaN(Number(targetCgpa))) user.targetCgpa = Number(targetCgpa);
    if (totalDegreeCredits !== undefined && !isNaN(Number(totalDegreeCredits)) && Number(totalDegreeCredits) > 0) user.totalDegreeCredits = Number(totalDegreeCredits);

    if (!user.currentSemester && user.semesterSystem) {
      user.currentSemester = user.semesterSystem;
    } else if (!user.semesterSystem && user.currentSemester) {
      user.semesterSystem = user.currentSemester;
    }

    const updatedUser = await user.save();

    res.status(200).json(formatUserResponse(updatedUser));
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password, clear current auth_token cookie to force re-login
 * @access  Private (Protected by verifyToken)
 */
const changeUserPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || typeof currentPassword !== "string") {
      res.status(400);
      throw new Error("Current password is required");
    }

    // Central password policy check
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      res.status(400);
      throw new Error(passwordError);
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    // Verify current password using bcrypt.compare()
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      res.status(401);
      throw new Error("Current password is incorrect");
    }

    // Set new password (pre-save hook will hash it with bcrypt)
    user.password = newPassword;
    await user.save();

    // Clear auth cookie so user must log back in with new password
    res.clearCookie(AUTH_COOKIE_NAME, getClearAuthCookieOptions());

    res.status(200).json({
      message: "Password changed successfully. Please log in again with your new password.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/auth/delete-account
 * @desc    Permanently delete authenticated user's account and all associated academic data
 * @access  Private (Protected by verifyToken)
 */
const deleteUserAccount = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password || typeof password !== "string") {
      res.status(400);
      throw new Error("Password is required to confirm account deletion");
    }

    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      res.status(404);
      throw new Error("User account not found");
    }

    // Verify password using bcrypt
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(401);
      throw new Error("Incorrect password. Account deletion aborted.");
    }

    // Import models lazily or at module top
    const Semester = require("../models/semester-model");
    const Subject = require("../models/subject-model");

    // Permanently remove all user records from database
    await Subject.deleteMany({ user: userId });
    await Semester.deleteMany({ user: userId });
    await User.findByIdAndDelete(userId);

    // Invalidate session cookies
    res.clearCookie(AUTH_COOKIE_NAME, getClearAuthCookieOptions());
    res.clearCookie(CSRF_COOKIE_NAME, getClearCsrfCookieOptions());

    res.status(200).json({
      message: "Account and all associated academic records permanently deleted.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  updateSetupProfile,
  updateUserProfile,
  changeUserPassword,
  deleteUserAccount,
};
