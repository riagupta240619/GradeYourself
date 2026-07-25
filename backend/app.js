"use strict";

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const healthRoutes = require("./routes/health-routes");
const authRoutes = require("./routes/auth-routes");
const dashboardRoutes = require("./routes/dashboard-routes");
const subjectRoutes = require("./routes/subject-routes");
const semesterRoutes = require("./routes/semester-routes");
const analyticsRoutes = require("./routes/analytics-routes");
const { notFound, errorHandler } = require("./middleware/error-middleware");
const { authLimiter, apiLimiter } = require("./middleware/rate-limiter");
const { verifyCsrf } = require("./middleware/csrf-middleware");

const app = express();

// Trust first proxy when running behind reverse proxies (Render, Vercel, Nginx, etc.)
app.set("trust proxy", 1);

// ── 1. Security Headers (Helmet) ──────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false, // Vite React SPA is served separately
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: process.env.NODE_ENV === "production" ? { maxAge: 31536000, includeSubDomains: true } : false,
  })
);

// ── 2. CORS — Explicit Origin Validation with Credentials (No Wildcard) ────────
const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

// Always support standard local development origins in non-production environments
if (process.env.NODE_ENV !== "production") {
  const devDefaults = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"];
  for (const origin of devDefaults) {
    if (!allowedOrigins.includes(origin)) {
      allowedOrigins.push(origin);
    }
  }
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server / curl / non-browser requests where origin header is absent
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy violation: Origin '${origin}' is not allowed`));
    }
  },
  credentials: true, // Allows HttpOnly & CSRF cookies to be sent cross-origin
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token", "X-XSRF-Token"],
};

app.use(cors(corsOptions));

// ── 3. Cookie Parsing & Request Body Limits ───────────────────────────────────
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ── 4. Rate Limiting ──────────────────────────────────────────────────────────
// General rate limiter across all /api routes
app.use("/api", apiLimiter);

// Specific stricter rate limiter on authentication endpoints
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/change-password", authLimiter);

// ── 5. CSRF Protection Middleware ──────────────────────────────────────────────
// Validates double-submit CSRF token header for all state-changing HTTP requests
app.use("/api", verifyCsrf);

// ── 6. API Routes ─────────────────────────────────────────────────────────────
app.use("/api", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/semesters", semesterRoutes);
app.use("/api/analytics", analyticsRoutes);

// ── 7. Error Handling Middlewares ─────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
