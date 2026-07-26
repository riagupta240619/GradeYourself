"use strict";

const crypto = require("crypto");
const {
  CSRF_COOKIE_NAME,
  getCsrfCookieOptions,
} = require("../utils/cookie-config");

/**
 * Generate a high-entropy random CSRF token.
 */
function generateCsrfToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Express Controller to Bootstrap/Initialize CSRF Token
 * @route GET /api/auth/csrf
 */
const getCsrfToken = (req, res) => {
  let token = req.cookies ? req.cookies[CSRF_COOKIE_NAME] : null;
  if (!token || typeof token !== "string" || token.length !== 64) {
    token = generateCsrfToken();
  }

  // Set non-HttpOnly readable cookie so SPA JS can read & submit it in header
  res.cookie(CSRF_COOKIE_NAME, token, getCsrfCookieOptions());

  res.status(200).json({
    csrfToken: token,
  });
};

/**
 * CSRF Protection Middleware
 * Verifies submitted header against cookie using constant-time comparison.
 * Protects state-changing HTTP methods: POST, PUT, PATCH, DELETE.
 */
const verifyCsrf = (req, res, next) => {
  // Safe HTTP methods do not require CSRF validation
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // Skip CSRF check for the CSRF bootstrap endpoint itself
  if (req.originalUrl && req.originalUrl.includes("/api/auth/csrf")) {
    return next();
  }

  const cookieToken = req.cookies ? req.cookies[CSRF_COOKIE_NAME] : null;
  const headerToken =
    req.headers["x-csrf-token"] ||
    req.headers["x-xsrf-token"] ||
    (req.body && req.body._csrf);

  console.log("Origin:", req.headers.origin);
  console.log("Cookie Header:", req.headers.cookie);
  console.log("Cookies:", req.cookies);
  console.log("X-CSRF-Token:", !!req.headers["x-csrf-token"]);
  console.log("X-XSRF-Token:", !!req.headers["x-xsrf-token"]);
  console.log("Body _csrf:", !!req.body?._csrf);

  if (!cookieToken || !headerToken) {
    res.status(403);
    return next(new Error("Invalid CSRF token: Missing token in header or cookie"));
  }

  if (typeof cookieToken !== "string" || typeof headerToken !== "string") {
    res.status(403);
    return next(new Error("Invalid CSRF token format"));
  }

  const cookieBuf = Buffer.from(cookieToken);
  const headerBuf = Buffer.from(headerToken);

  if (cookieBuf.length !== headerBuf.length || !crypto.timingSafeEqual(cookieBuf, headerBuf)) {
    res.status(403);
    return next(new Error("Invalid CSRF token"));
  }

  return next();
};

module.exports = {
  getCsrfToken,
  verifyCsrf,
};
