"use strict";

const rateLimit = require("express-rate-limit");

/**
 * Rate Limiter for Authentication Endpoints (Login, Register, Change Password)
 * Prevents automated brute-force attacks and credential stuffing.
 * Limits to 15 requests per 15-minute window per IP.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many authentication attempts. Please try again later.",
  },
  statusCode: 429,
});

/**
 * General API Rate Limiter
 * Protects all /api endpoints against Denial of Service and API scraping abuse.
 * Limits to 300 requests per 15-minute window per IP.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many requests. Please try again later.",
  },
  statusCode: 429,
});

module.exports = {
  authLimiter,
  apiLimiter,
};
