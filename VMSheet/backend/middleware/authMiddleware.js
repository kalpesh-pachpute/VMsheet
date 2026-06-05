const jwt = require("jsonwebtoken");
const Users = require("../models/users");

/**
 * Authentication middleware to verify JWT tokens
 * Sets req.user if token is valid
 *
 * @author sandhya sapate
 * @version 1.0
 * @since 13-5-2026
 */

const authenticateToken = async (req, res, next) => {
  try {
    // Get Authorization header
    const authHeader =
      req.headers["authorization"] || req.headers["Authorization"];

    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    // Debug logs (remove in production)
    console.log(" Auth Middleware - Path:", req.path);
    console.log(" Auth Header:", authHeader ? "Present" : "Missing");
    console.log(" Token:", token ? "Present" : "Missing");

    // No token check
    if (!token) {
      return res.status(401).json({
        success: false,
        message:
          "Access token is required. Use Authorization: Bearer <token>",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // IMPORTANT FIX:
    // Make sure your JWT contains "id"
    const userId = decoded.id || decoded.user_id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    // Fetch user from DB
    const user = await Users.findByPk(userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      phone: user.phone,
     
    };

    next();
  } catch (error) {
    console.log("Auth Error:", error.message);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

module.exports = authenticateToken;