"use strict";

/**
 * Global Express Error Handling Middleware
 *
 * In production:
 *  - Stack traces are omitted (`stack: null`).
 *  - Internal driver/database/Mongoose errors are sanitized into user-safe messages.
 *  - Explicit application errors (400, 401, 403, 404) pass through safely.
 *
 * In development:
 *  - Detailed error messages and stack traces are provided for debugging.
 */
function errorHandler(err, req, res, _next) {
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || "Internal Server Error";

  // Handle Mongoose CastError (e.g. malformed ObjectId parameters)
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource identifier";
  }

  // Handle Mongoose ValidationError
  if (err.name === "ValidationError") {
    statusCode = 400;
    const details = Object.values(err.errors || {})
      .map((e) => e.message)
      .join(", ");
    message = details ? `Validation failed: ${details}` : "Validation failed";
  }

  // In production, mask unexpected 500 internal server error details
  if (process.env.NODE_ENV === "production" && statusCode === 500) {
    message = "An unexpected internal server error occurred";
  }

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
}

/**
 * 404 Not Found Middleware
 */
function notFound(req, res, next) {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
}

module.exports = { errorHandler, notFound };
