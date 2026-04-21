const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  addAddress,
  removeAddress,
  getAllUsers,
} = require('../controllers/authController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyToken, getMe);
router.put('/profile', verifyToken, updateProfile);
router.post('/address', verifyToken, addAddress);
router.delete('/address/:addressId', verifyToken, removeAddress);
router.get('/users', verifyToken, isAdmin, getAllUsers);

module.exports = router;
