const User = require("../models/user-model");
const generateToken = require("../utils/generate-token");

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, college, course, semesterSystem } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error("Please provide name, email, and password");
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      res.status(400);
      throw new Error("User already exists with this email");
    }

    // Create user (password is automatically hashed via pre-save hook)
    const user = await User.create({
      name,
      email,
      password,
      college: college || "",
      course: course || "",
      semesterSystem: semesterSystem || "",
    });

    if (user) {
      const token = generateToken(user._id);
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        college: user.college,
        course: user.course,
        semesterSystem: user.semesterSystem,
        branch: user.branch,
        academicSession: user.academicSession,
        profileCompleted: user.profileCompleted,
        token,
      });
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
 * @desc    Authenticate user & get token
 * @access  Public
 */
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error("Please provide email and password");
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    // Verify password using bcrypt.compare()
    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id);
      res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        college: user.college,
        course: user.course,
        semesterSystem: user.semesterSystem,
        branch: user.branch,
        academicSession: user.academicSession,
        profileCompleted: user.profileCompleted,
        token,
      });
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
 * @desc    Logout user / clear token session
 * @access  Public
 */
const logoutUser = async (req, res) => {
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
  res.status(200).json(req.user);
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

    const { college, course, semesterSystem, branch, academicSession } = req.body;

    if (college !== undefined) user.college = college;
    if (course !== undefined) user.course = course;
    if (semesterSystem !== undefined) user.semesterSystem = semesterSystem;
    if (branch !== undefined) user.branch = branch;
    if (academicSession !== undefined) user.academicSession = academicSession;

    user.profileCompleted = true;

    const updatedUser = await user.save();

    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      college: updatedUser.college,
      course: updatedUser.course,
      semesterSystem: updatedUser.semesterSystem,
      branch: updatedUser.branch,
      academicSession: updatedUser.academicSession,
      profileCompleted: updatedUser.profileCompleted,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile details (Name, College, Branch, etc.)
 * @access  Private (Protected by verifyToken)
 */
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    const { name, college, branch, course, semesterSystem } = req.body;

    if (name !== undefined) user.name = name.trim();
    if (college !== undefined) user.college = college.trim();
    if (branch !== undefined) user.branch = branch.trim();
    if (course !== undefined) user.course = course.trim();
    if (semesterSystem !== undefined) user.semesterSystem = semesterSystem.trim();

    const updatedUser = await user.save();

    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      college: updatedUser.college,
      course: updatedUser.course,
      semesterSystem: updatedUser.semesterSystem,
      branch: updatedUser.branch,
      academicSession: updatedUser.academicSession,
      profileCompleted: updatedUser.profileCompleted,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password requiring current password & hashing with bcrypt
 * @access  Private (Protected by verifyToken)
 */
const changeUserPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400);
      throw new Error("Please provide current password and new password");
    }

    if (newPassword.length < 6) {
      res.status(400);
      throw new Error("New password must be at least 6 characters long");
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

    res.status(200).json({
      message: "Password changed successfully",
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
};
