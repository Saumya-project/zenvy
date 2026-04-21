const asyncHandler = require('express-async-handler');

// @desc    Create demo payment order
// @route   POST /api/v1/payment/create-order
const createDemoOrder = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    res.status(400);
    throw new Error('Please provide a valid amount');
  }

  const orderId = `DRIP_PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  res.status(200).json({
    success: true,
    data: {
      orderId,
      amount: Number(amount),
      currency: 'INR',
      method: 'demo',
    },
    message: 'Demo payment order created',
  });
});

module.exports = {
  createDemoOrder,
};
