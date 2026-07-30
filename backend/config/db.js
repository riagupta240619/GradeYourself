"use strict";

const mongoose = require("mongoose");

/**
 * Mongoose Connection Event Listeners
 */
mongoose.connection.on("connected", () => {
  if (process.env.NODE_ENV !== "production") {
    console.log("[Database] Mongoose default connection open");
  }
});

mongoose.connection.on("error", (err) => {
  console.error(`[Database] Mongoose connection error: ${err.message}`);
});

mongoose.connection.on("disconnected", () => {
  console.warn("[Database] Mongoose default connection disconnected");
});

/**
 * Connect to MongoDB Atlas or Local MongoDB via Mongoose.
 *
 * MONGO_URI is guaranteed to be present by the startup env validation in
 * config/env-validate.js.
 *
 * Security & Reliability:
 *  - Uses process.env.MONGO_URI dynamically (Atlas mongodb+srv:// or Local mongodb://)
 *  - Logs host & db name safely without printing credentials
 *  - Terminates process cleanly on connection failure to prevent unhandled requests
 */
const connectDB = async (retries = 3, delay = 2000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
      });

      // Safely log host and database name — credentials are NEVER logged
      console.log(
        `MongoDB Connected: ${conn.connection.host} [database: ${conn.connection.name}]`
      );
      return conn;
    } catch (error) {
      console.error(
        `MongoDB Connection Attempt ${attempt}/${retries} failed: ${error.message}`
      );
      if (attempt < retries) {
        console.log(`Retrying MongoDB connection in ${delay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error("All MongoDB Connection Attempts Exhausted.");
        process.exit(1);
      }
    }
  }
};

module.exports = connectDB;
