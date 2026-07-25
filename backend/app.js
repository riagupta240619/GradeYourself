const express = require("express");
const cors = require("cors");
const healthRoutes = require("./routes/health-routes");
const authRoutes = require("./routes/auth-routes");
const dashboardRoutes = require("./routes/dashboard-routes");
const subjectRoutes = require("./routes/subject-routes");
const semesterRoutes = require("./routes/semester-routes");
const analyticsRoutes = require("./routes/analytics-routes");
const { notFound, errorHandler } = require("./middleware/error-middleware");

const app = express();

// Core Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use("/api", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/semesters", semesterRoutes);
app.use("/api/analytics", analyticsRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

module.exports = app;
