const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @desc    Create order with demo payment
// @route   POST /api/v1/orders
const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, totalAmount } = req.body;

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error('No order items provided');
  }

  // Validate stock availability
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product || !product.isActive) {
      res.status(400);
      throw new Error(`Product ${item.name || item.product} is unavailable`);
    }
    const sizeObj = product.sizes.find((s) => s.size === item.size);
    if (!sizeObj || sizeObj.stock < item.qty) {
      res.status(400);
      throw new Error(`${product.name} (${item.size}) is out of stock`);
    }
  }

  // Generate a demo payment ID
  const demoPaymentId = `DRIP_PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // Save order to DB
  const order = await Order.create({
    user: req.user._id,
    items,
    shippingAddress,
    paymentInfo: {
      razorpayOrderId: demoPaymentId,
      status: 'pending',
    },
    totalAmount,
    orderStatus: 'pending',
  });

  res.status(201).json({
    success: true,
    data: {
      order,
      paymentId: demoPaymentId,
      amount: totalAmount,
      currency: 'INR',
    },
    message: 'Order created successfully',
  });
});

// @desc    Confirm demo payment
// @route   POST /api/v1/orders/verify-payment
const verifyPayment = asyncHandler(async (req, res) => {
  const { paymentId } = req.body;

  const order = await Order.findOne({
    'paymentInfo.razorpayOrderId': paymentId,
  });

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Mark payment as paid
  order.paymentInfo.razorpayPaymentId = `DEMO_TXID_${Date.now()}`;
  order.paymentInfo.status = 'paid';
  order.orderStatus = 'confirmed';
  await order.save();

  // Update stock
  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (product) {
      const sizeEntry = product.sizes.find((s) => s.size === item.size);
      if (sizeEntry) {
        sizeEntry.stock = Math.max(0, sizeEntry.stock - item.qty);
      }
      await product.save();
    }
  }

  // Clear cart
  await Cart.findOneAndDelete({ user: order.user });

  res.status(200).json({
    success: true,
    data: order,
    message: 'Payment confirmed successfully',
  });
});

// @desc    Get logged-in user orders
// @route   GET /api/v1/orders/my
const getUserOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate('items.product', 'name images')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: orders,
    message: 'Orders fetched successfully',
  });
});

// @desc    Get all orders (admin)
// @route   GET /api/v1/orders
const getAllOrders = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = {};
  if (status) query.orderStatus = status;

  const orders = await Order.find(query)
    .populate('user', 'name email')
    .populate('items.product', 'name images')
    .sort({ createdAt: -1 });

  const totalRevenue = orders
    .filter((o) => o.paymentInfo.status === 'paid')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  res.status(200).json({
    success: true,
    data: orders,
    totalRevenue,
    count: orders.length,
    message: 'All orders fetched',
  });
});

// @desc    Update order status (admin)
// @route   PUT /api/v1/orders/:id/status
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  order.orderStatus = orderStatus;
  await order.save();

  res.status(200).json({
    success: true,
    data: order,
    message: `Order status updated to ${orderStatus}`,
  });
});

// @desc    Get single order
// @route   GET /api/v1/orders/:id
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .populate('items.product', 'name images');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  res.status(200).json({
    success: true,
    data: order,
    message: 'Order fetched',
  });
});

module.exports = {
  createOrder,
  verifyPayment,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  getOrderById,
};
