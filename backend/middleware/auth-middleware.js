"use strict";

const jwt = require("jsonwebtoken");
const User = require("../models/user-model");

/**
 * JWT Authentication Middleware
 *
 * Verifies the Bearer token from the Authorization header and attaches the
 * authenticated user (without password) to req.user.
 *
 * JWT_SECRET is guaranteed to be present by the startup env validation in
 * config/env-validate.js. There is deliberately no fallback value here.
 *
 * Security properties:
 *  - Requires Authorization: Bearer <token> header
 *  - Rejects missing, malformed, expired, and invalid tokens with 401
 *  - Never exposes JWT internals, stack traces, or secret values to the client
 *  - Password field is excluded from req.user via Mongoose select("-password")
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // ── 1. Require Authorization header with Bearer scheme ────────────────────
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401);
    return next(new Error("Unauthorized: No authentication token provided"));
  }

  const token = authHeader.split(" ")[1];

  // Guard against an empty token string after "Bearer "
  if (!token) {
    res.status(401);
    return next(new Error("Unauthorized: No authentication token provided"));
  }

  // ── 2. Verify signature and expiration ────────────────────────────────────
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (jwtError) {
    // Log the technical reason in development only — never the secret
    if (process.env.NODE_ENV !== "production") {
      console.warn("[Auth] JWT verification failed:", jwtError.message);
    }
    res.status(401);
    return next(new Error("Unauthorized: Invalid or expired authentication token"));
  }

  // ── 3. Load the corresponding user from DB ────────────────────────────────
  if (!decoded.id) {
    res.status(401);
    return next(new Error("Unauthorized: Invalid authentication token"));
  }

  try {
    req.user = await User.findById(decoded.id).select("-password");
  } catch {
    res.status(401);
    return next(new Error("Unauthorized: Invalid authentication token"));
  }

  if (!req.user) {
    res.status(401);
    return next(new Error("Unauthorized: User account not found"));
  }

  return next();
};

module.exports = {
  verifyToken,
  protect: verifyToken, // Alias retained for backward compatibility
};
