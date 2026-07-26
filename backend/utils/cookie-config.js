"use strict";

/**
 * Centralized Cookie Configuration Helper
 *
 * Configures auth_token (HttpOnly) and XSRF-TOKEN (readable by SPA) cookie options.
 */

const AUTH_COOKIE_NAME = "auth_token";
const CSRF_COOKIE_NAME = "XSRF-TOKEN";

/**
 * Resolves SameSite setting from environment or defaults safely.
 * Production defaults to "strict", development defaults to "lax".
 */
function getSameSiteOption() {
  const custom = process.env.COOKIE_SAME_SITE ? process.env.COOKIE_SAME_SITE.toLowerCase() : null;
  if (custom && ["lax", "strict", "none"].includes(custom)) {
    return custom;
  }
  // Cross-origin production deployments (e.g. Vercel SPA -> Render Express API) require SameSite=none and Secure=true
  // so browsers transmit cookies across cross-site XHR/fetch requests.
  return process.env.NODE_ENV === "production" ? "none" : "lax";
}

/**
 * Options for the HttpOnly Authentication JWT Cookie
 */
function getAuthCookieOptions() {
  const sameSite = getSameSiteOption();
  const isProd = process.env.NODE_ENV === "production";
  const secure = isProd || sameSite === "none";

  return {
    httpOnly: true, // Inaccessible to JavaScript (XSS mitigation)
    secure,
    sameSite,
    path: "/",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours (aligns with JWT 24h expiration)
  };
}

/**
 * Options for Clearing the HttpOnly Auth Cookie (omits maxAge to satisfy Express 4/5 clearCookie behavior)
 */
function getClearAuthCookieOptions() {
  const { maxAge, ...clearOptions } = getAuthCookieOptions();
  return clearOptions;
}

/**
 * Options for the Readable CSRF Cookie
 */
function getCsrfCookieOptions() {
  const sameSite = getSameSiteOption();
  const isProd = process.env.NODE_ENV === "production";
  const secure = isProd || sameSite === "none";

  return {
    httpOnly: false, // Must be readable by client JS to attach in X-CSRF-Token header
    secure,
    sameSite,
    path: "/",
    maxAge: 24 * 60 * 60 * 1000,
  };
}

/**
 * Options for Clearing the CSRF Cookie
 */
function getClearCsrfCookieOptions() {
  const { maxAge, ...clearOptions } = getCsrfCookieOptions();
  return clearOptions;
}

module.exports = {
  AUTH_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  getAuthCookieOptions,
  getClearAuthCookieOptions,
  getCsrfCookieOptions,
  getClearCsrfCookieOptions,
};
