const {
  registerUser,
  loginUser,
  updateUserProfile,
} = require("../services/authServices");

// Register Controller
exports.register = async (req, res) => {
  try {
    const user = await registerUser(req.body);

    const safeUser = user && typeof user.toJSON === 'function' ? user.toJSON() : { ...user };
    if (safeUser && Object.prototype.hasOwnProperty.call(safeUser, 'password')) {
      delete safeUser.password;
    }

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: safeUser,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Profile Controller
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const user = await updateUserProfile(userId, req.body);

    const safeUser = user && typeof user.toJSON === 'function' ? user.toJSON() : { ...user };
    if (safeUser && Object.prototype.hasOwnProperty.call(safeUser, 'password')) {
      delete safeUser.password;
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: safeUser,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Login Controller
exports.login = async (req, res) => {
  try {
    const data = await loginUser(req.body);

    const safeUser = data.user && typeof data.user.toJSON === 'function' ? data.user.toJSON() : { ...data.user };
    if (safeUser && Object.prototype.hasOwnProperty.call(safeUser, 'password')) {
      delete safeUser.password;
    }

    res.status(200).json({
      success: true,
      message: "Login successful",
      token: data.token,
      user: safeUser,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};