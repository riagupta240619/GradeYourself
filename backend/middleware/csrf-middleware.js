"use strict";

const crypto = require("crypto");
const {
  CSRF_COOKIE_NAME,
  getCsrfCookieOptions,
} = require("../utils/cookie-config");

const SECRET = process.env.JWT_SECRET || "gradewise_csrf_secret_key_2026";

/**
 * Generate a cryptographically signed HMAC CSRF token.
 */
function signToken(raw) {
  return crypto.createHmac("sha256", SECRET).update(raw).digest("hex");
}

function generateCsrfToken() {
  const raw = crypto.randomBytes(32).toString("hex");
  const sig = signToken(raw);
  return `${raw}.${sig}`;
}

function isValidSignedToken(token) {
  if (typeof token !== "string" || !token.includes(".")) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [raw, sig] = parts;
  if (!raw || !sig || raw.length !== 64 || sig.length !== 64) return false;
  const expectedSig = signToken(raw);
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig));
}

/**
 * Express Controller to Bootstrap/Initialize CSRF Token
 * @route GET /api/auth/csrf
 */
const getCsrfToken = (req, res) => {
  let token = req.cookies ? req.cookies[CSRF_COOKIE_NAME] : null;
  if (!token || !isValidSignedToken(token)) {
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
 * Verifies submitted header against cookie using constant-time comparison or HMAC signature validation.
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

  // Skip CSRF for public calculator routes (no auth, no session)
  if (req.originalUrl && req.originalUrl.startsWith("/api/calculator/")) {
    return next();
  }

  // Skip CSRF for resume parsing & ATS diagnostics utility endpoints
  if (req.originalUrl && (req.originalUrl.includes("/api/resumes/parse-pdf") || req.originalUrl.includes("/api/resumes/ats"))) {
    return next();
  }

  const cookieToken = req.cookies ? req.cookies[CSRF_COOKIE_NAME] : null;
  const headerToken =
    req.headers["x-csrf-token"] ||
    req.headers["x-xsrf-token"] ||
    (req.body && req.body._csrf);

  if (!headerToken) {
    res.status(403);
    return next(new Error("Invalid CSRF token: Missing token in header"));
  }

  // 1. If cookieToken is present (Same-Origin / Supported Browsers), verify cookie === header
  if (cookieToken && typeof cookieToken === "string") {
    if (cookieToken !== headerToken) {
      res.status(403);
      return next(new Error("Invalid CSRF token: Cookie and header token mismatch"));
    }
  }

  // 2. Verify cryptographically signed CSRF header token
  if (!isValidSignedToken(headerToken)) {
    res.status(403);
    return next(new Error("Invalid CSRF token: Invalid token signature"));
  }

  return next();
};

module.exports = {
  getCsrfToken,
  verifyCsrf,
};
