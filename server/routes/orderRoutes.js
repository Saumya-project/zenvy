const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  getOrderById,
} = require('../controllers/orderController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.post('/', verifyToken, createOrder);
router.post('/verify-payment', verifyToken, verifyPayment);
router.get('/my', verifyToken, getUserOrders);
router.get('/:id', verifyToken, getOrderById);

// Admin routes
router.get('/', verifyToken, isAdmin, getAllOrders);
router.put('/:id/status', verifyToken, isAdmin, updateOrderStatus);

module.exports = router;
