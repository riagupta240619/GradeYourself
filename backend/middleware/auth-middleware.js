const jwt = require("jsonwebtoken");
const User = require("../models/user-model");

/**
 * Middleware to verify JWT token and attach user to request object.
 * Returns 401 Unauthorized when token is missing, invalid, or expired.
 */
const verifyToken = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "default_fallback_secret"
      );

      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        res.status(401);
        throw new Error("Unauthorized: User account not found");
      }

      return next();
    } catch (error) {
      res.status(401);
      return next(new Error("Unauthorized: Invalid or expired token"));
    }
  }

  if (!token) {
    res.status(401);
    return next(new Error("Unauthorized: No authorization token provided"));
  }
};

module.exports = {
  verifyToken,
  protect: verifyToken, // Alias for backward compatibility
};
