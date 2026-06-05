const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/users");

// Register Service
const registerUser = async (data) => {
  const { name, email, phone, password } = data;

  // Check email exists
  const existingUser = await User.findOne({
    where: { email },
  });

  if (existingUser) {
    throw new Error("Email already exists");
  }

  // Hash Password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create User
  const user = await User.create({
    name,
    email,
    phone,
    password: hashedPassword,
  });

  return user;
};

// Login Service
const loginUser = async (data) => {
  const { email, password } = data;

  // Find user
  const user = await User.findOne({
    where: { email },
  });

  if (!user) {
    throw new Error("Invalid email");
  }

  // Compare password
  const isMatch = await bcrypt.compare(
    password,
    user.password
  );

  if (!isMatch) {
    throw new Error("Invalid password");
  }

  // Generate JWT
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  return {
    token,
    user,
  };
};

// Update Profile Service
const updateUserProfile = async (userId, data) => {
  const { name, email, phone, password } = data;

  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (email && email !== user.email) {
    const existingUser = await User.findOne({
      where: { email },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new Error("Email already exists");
    }
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (phone !== undefined) updateData.phone = phone;
  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  await user.update(updateData);
  return user;
};

module.exports = {
  registerUser,
  loginUser,
  updateUserProfile,
};