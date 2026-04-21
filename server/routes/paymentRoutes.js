const express = require('express');
const router = express.Router();
const { createDemoOrder } = require('../controllers/paymentController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.post('/create-order', verifyToken, createDemoOrder);

module.exports = router;
