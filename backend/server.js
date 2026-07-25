"use strict";

// ── 1. Load environment variables first ──────────────────────────────────────
const dotenv = require("dotenv");
dotenv.config();

// ── 2. Validate required environment variables immediately ───────────────────
const { validateEnv } = require("./config/env-validate");
validateEnv();

const connectDB = require("./config/db");
const app = require("./app");

const PORT = process.env.PORT || 5000;

/**
 * Server Startup Sequence:
 * 1. Validate environment configuration
 * 2. Connect to MongoDB (wait for connection confirmation)
 * 3. Bind and start Express listener
 */
async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(
      `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`
    );
  });
}

startServer();
