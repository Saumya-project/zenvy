const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Register a new user
// @route   POST /api/v1/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists with this email');
  }

  const user = await User.create({ name, email, password });
  const token = user.getSignedJwtToken();

  res.status(201).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    },
    message: 'Registration successful',
  });
});

// @desc    Login user
// @route   POST /api/v1/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  const token = user.getSignedJwtToken();

  res.status(200).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    },
    message: 'Login successful',
  });
});

// @desc    Get current logged-in user
// @route   GET /api/v1/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    data: user,
    message: 'User profile fetched',
  });
});

// @desc    Update user profile
// @route   PUT /api/v1/auth/profile
const updateProfile = asyncHandler(async (req, res) => {
  const { name, addresses } = req.body;
  const updateData = {};

  if (name) updateData.name = name;
  if (addresses) updateData.addresses = addresses;

  const user = await User.findByIdAndUpdate(req.user._id, updateData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: user,
    message: 'Profile updated successfully',
  });
});

// @desc    Add address to user profile
// @route   POST /api/v1/auth/address
const addAddress = asyncHandler(async (req, res) => {
  const { label, street, city, state, pincode } = req.body;

  const user = await User.findById(req.user._id);
  user.addresses.push({ label, street, city, state, pincode });
  await user.save();

  res.status(200).json({
    success: true,
    data: user,
    message: 'Address added successfully',
  });
});

// @desc    Remove address from user profile
// @route   DELETE /api/v1/auth/address/:addressId
const removeAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.addresses = user.addresses.filter(
    (addr) => addr._id.toString() !== req.params.addressId
  );
  await user.save();

  res.status(200).json({
    success: true,
    data: user,
    message: 'Address removed successfully',
  });
});

// @desc    Get all users (admin)
// @route   GET /api/v1/auth/users
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: users,
    count: users.length,
    message: 'Users fetched successfully',
  });
});

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  addAddress,
  removeAddress,
  getAllUsers,
};
