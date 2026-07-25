const jwt = require("jsonwebtoken");

/**
 * Generate a JWT token valid for 24 hours
 * @param {string} id - User MongoDB ObjectId
 * @returns {string} Signed JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "default_fallback_secret", {
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  });
};

module.exports = generateToken;
