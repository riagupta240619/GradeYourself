"use strict";

/**
 * Centralized Password Validation Utility
 *
 * Requirements:
 * - Must be a string
 * - 8 to 128 characters long
 * - Must contain at least one uppercase letter (A-Z)
 * - Must contain at least one lowercase letter (a-z)
 * - Must contain at least one number (0-9)
 *
 * @param {string} password
 * @returns {string|null} Error message string if invalid, or null if valid.
 */
function validatePassword(password) {
  if (typeof password !== "string") {
    return "Password must be a text string";
  }
  if (password.length < 8) {
    return "Password must be at least 8 characters long";
  }
  if (password.length > 128) {
    return "Password cannot exceed 128 characters";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number";
  }
  return null;
}

module.exports = { validatePassword };
