const express = require("express");

const router = express.Router();

const {
  register,
  login,
  updateProfile,
} = require("../controllers/authController");
const authenticateToken = require("../middleware/authMiddleware");

// Register
router.post("/register", register);

// Login
router.post("/login", login);

// Update profile
router.put("/profile", authenticateToken, updateProfile);

module.exports = router;