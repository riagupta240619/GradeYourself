"use strict";

/**
 * Centralized environment variable validation for GradeYourself backend.
 *
 * Called once at server startup (before any routes or DB connections are
 * established). If a required variable is missing or empty the process exits
 * with a non-zero code so the error is visible in process monitors / container
 * orchestrators without leaking any secret values to logs.
 */

const REQUIRED_ALWAYS = [
  {
    key: "JWT_SECRET",
    hint: "Generate with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\"",
  },
  {
    key: "MONGO_URI",
    hint: "Example (local): mongodb://127.0.0.1:27017/gradeyourself",
  },
];

const REQUIRED_PRODUCTION = [
  {
    key: "FRONTEND_URL",
    hint: "Example: https://app.example.com (required in production for CORS origin validation)",
  },
];

/**
 * Validate that all required environment variables are present and non-empty.
 * Terminates the process with exit code 1 if any are missing.
 * Never logs secret values.
 */
function validateEnv() {
  const missing = [];

  for (const { key, hint } of REQUIRED_ALWAYS) {
    const value = process.env[key];
    if (!value || value.trim() === "") {
      missing.push({ key, hint });
    }
  }

  if (process.env.NODE_ENV === "production") {
    for (const { key, hint } of REQUIRED_PRODUCTION) {
      const value = process.env[key];
      if (!value || value.trim() === "") {
        missing.push({ key, hint });
      }
    }
  }

  if (missing.length > 0) {
    console.error("\n[CONFIG ERROR] Required environment variables are missing or empty:");
    for (const { key, hint } of missing) {
      console.error(`  - ${key}`);
      console.error(`    Hint: ${hint}`);
    }
    console.error(
      "\nCreate a backend/.env file based on backend/.env.example and set all required values.\n"
    );
    process.exit(1);
  }
}

module.exports = { validateEnv };
