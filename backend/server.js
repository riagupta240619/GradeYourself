// Load environment variables first — before any other module is imported
const dotenv = require("dotenv");
dotenv.config();

// Validate required environment variables immediately after .env is loaded.
// This will terminate the process with a clear message if anything is missing.
const { validateEnv } = require("./config/env-validate");
validateEnv();

const connectDB = require("./config/db");
const app = require("./app");

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`
  );
});
