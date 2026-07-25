"use strict";

const jwt = require("jsonwebtoken");

/**
 * Generate a signed JWT token for the given user ID.
 *
 * Payload: { id } — only the MongoDB ObjectId is included.
 * Sensitive fields (password, marks, profile data) are never embedded in tokens.
 *
 * JWT_SECRET is guaranteed to be present by the startup env validation in
 * config/env-validate.js. There is deliberately no fallback value here;
 * if the variable is absent the server will have already exited.
 *
 * @param {string} userId - The user's MongoDB ObjectId string.
 * @returns {string} Signed JWT token.
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
  );
};

module.exports = generateToken;
