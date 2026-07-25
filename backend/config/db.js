"use strict";

const mongoose = require("mongoose");

/**
 * Connect to MongoDB via Mongoose.
 *
 * MONGO_URI is guaranteed to be present by the startup env validation in
 * config/env-validate.js. There is deliberately no fallback value here;
 * if the variable is absent the server will have already exited.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
