"use strict";

const jwt = require("jsonwebtoken");
const User = require("../models/user-model");
const { AUTH_COOKIE_NAME } = require("../utils/cookie-config");

/**
 * JWT Authentication Middleware
 *
 * Primary: Reads JWT from HttpOnly cookie (auth_token).
 * Secondary: Reads JWT from Authorization: Bearer header (for non-browser API clients).
 *
 * Security properties:
 *  - Rejects missing, malformed, expired, and invalid tokens with HTTP 401
 *  - Never exposes JWT internals, stack traces, or secret values to the client
 *  - Password field is excluded from req.user via Mongoose select("-password")
 */
const verifyToken = async (req, res, next) => {
  let token = null;

  // ── 1. Read token from HttpOnly Cookie (Primary Browser Transport) ────────
  if (req.cookies && req.cookies[AUTH_COOKIE_NAME]) {
    token = req.cookies[AUTH_COOKIE_NAME];
  }

  // ── 2. Fallback: Read token from Authorization Bearer header ──────────────
  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token || typeof token !== "string" || token.trim() === "") {
    res.status(401);
    return next(new Error("Unauthorized: No authentication token provided"));
  }

  // ── 3. Verify signature and expiration ────────────────────────────────────
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (jwtError) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[Auth] JWT verification failed:", jwtError.message);
    }
    res.status(401);
    return next(new Error("Unauthorized: Invalid or expired authentication token"));
  }

  // ── 4. Load corresponding user from DB ────────────────────────────────────
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
  protect: verifyToken,
};
