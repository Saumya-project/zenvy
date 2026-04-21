const asyncHandler = require('express-async-handler');
const Cart = require('../models/Cart');

// @desc    Get user cart
// @route   GET /api/v1/cart
const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate(
    'items.product',
    'name price discountPrice images sizes category'
  );

  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  res.status(200).json({
    success: true,
    data: cart,
    message: 'Cart fetched successfully',
  });
});

// @desc    Add item to cart
// @route   POST /api/v1/cart
const addToCart = asyncHandler(async (req, res) => {
  const { productId, size, qty = 1 } = req.body;

  if (!productId || !size) {
    res.status(400);
    throw new Error('Please provide product and size');
  }

  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [] });
  }

  // Check if item with same product + size already exists
  const existingIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId && item.size === size
  );

  if (existingIndex > -1) {
    cart.items[existingIndex].qty += Number(qty);
  } else {
    cart.items.push({ product: productId, size, qty: Number(qty) });
  }

  await cart.save();

  // Populate before sending
  cart = await Cart.findById(cart._id).populate(
    'items.product',
    'name price discountPrice images sizes category'
  );

  res.status(200).json({
    success: true,
    data: cart,
    message: 'Item added to cart',
  });
});

// @desc    Update cart item quantity
// @route   PUT /api/v1/cart/:itemId
const updateCartItem = asyncHandler(async (req, res) => {
  const { qty } = req.body;

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }

  const item = cart.items.id(req.params.itemId);
  if (!item) {
    res.status(404);
    throw new Error('Item not found in cart');
  }

  item.qty = Number(qty);
  if (item.qty <= 0) {
    cart.items = cart.items.filter(
      (i) => i._id.toString() !== req.params.itemId
    );
  }

  await cart.save();

  cart = await Cart.findById(cart._id).populate(
    'items.product',
    'name price discountPrice images sizes category'
  );

  res.status(200).json({
    success: true,
    data: cart,
    message: 'Cart updated',
  });
});

// @desc    Remove item from cart
// @route   DELETE /api/v1/cart/:itemId
const removeCartItem = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }

  cart.items = cart.items.filter(
    (item) => item._id.toString() !== req.params.itemId
  );
  await cart.save();

  cart = await Cart.findById(cart._id).populate(
    'items.product',
    'name price discountPrice images sizes category'
  );

  res.status(200).json({
    success: true,
    data: cart,
    message: 'Item removed from cart',
  });
});

// @desc    Clear cart
// @route   DELETE /api/v1/cart
const clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndDelete({ user: req.user._id });

  res.status(200).json({
    success: true,
    data: { items: [] },
    message: 'Cart cleared',
  });
});

// @desc    Merge local cart on login
// @route   POST /api/v1/cart/merge
const mergeCart = asyncHandler(async (req, res) => {
  const { items } = req.body; // array of { productId, size, qty }

  if (!items || items.length === 0) {
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      'items.product',
      'name price discountPrice images sizes category'
    );
    return res.status(200).json({
      success: true,
      data: cart || { items: [] },
      message: 'No items to merge',
    });
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [] });
  }

  for (const incoming of items) {
    const existingIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === incoming.productId &&
        item.size === incoming.size
    );

    if (existingIndex > -1) {
      cart.items[existingIndex].qty += Number(incoming.qty);
    } else {
      cart.items.push({
        product: incoming.productId,
        size: incoming.size,
        qty: Number(incoming.qty),
      });
    }
  }

  await cart.save();

  cart = await Cart.findById(cart._id).populate(
    'items.product',
    'name price discountPrice images sizes category'
  );

  res.status(200).json({
    success: true,
    data: cart,
    message: 'Cart merged successfully',
  });
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  mergeCart,
};
