const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Review = require('../models/Review');
const { cloudinary } = require('../config/cloudinary');

// @desc    Get all products with filtering, sorting, pagination
// @route   GET /api/v1/products
const getAllProducts = asyncHandler(async (req, res) => {
  const {
    category,
    size,
    minPrice,
    maxPrice,
    search,
    sort,
    page = 1,
    limit = 12,
  } = req.query;

  const query = { isActive: true };

  // Category filter
  if (category) {
    const categories = category.split(',');
    query.category = { $in: categories };
  }

  // Size filter
  if (size) {
    query['sizes.size'] = size;
    query['sizes.stock'] = { $gt: 0 };
  }

  // Price filter
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  // Search filter
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
    ];
  }

  // Sort options
  let sortOption = { createdAt: -1 };
  if (sort === 'priceLow') sortOption = { price: 1 };
  else if (sort === 'priceHigh') sortOption = { price: -1 };
  else if (sort === 'newest') sortOption = { createdAt: -1 };
  else if (sort === 'rating') sortOption = { 'ratings.average': -1 };

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .sort(sortOption)
    .skip(skip)
    .limit(Number(limit));

  res.status(200).json({
    success: true,
    data: products,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
    message: 'Products fetched successfully',
  });
});

// @desc    Get single product
// @route   GET /api/v1/products/:id
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product || !product.isActive) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Get reviews for this product
  const reviews = await Review.find({ product: req.params.id })
    .populate('user', 'name')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: { ...product.toObject(), reviews },
    message: 'Product fetched successfully',
  });
});

// @desc    Create product (admin)
// @route   POST /api/v1/products
const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, discountPrice, category, sizes, tags, isFeatured } = req.body;

  const images = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      images.push({
        url: file.path,
        public_id: file.filename,
      });
    }
  }

  // Parse sizes if it's a string (from form data)
  let parsedSizes = sizes;
  if (typeof sizes === 'string') {
    parsedSizes = JSON.parse(sizes);
  }

  let parsedTags = tags;
  if (typeof tags === 'string') {
    parsedTags = tags.split(',').map((t) => t.trim());
  }

  const product = await Product.create({
    name,
    description,
    price: Number(price),
    discountPrice: discountPrice ? Number(discountPrice) : null,
    category,
    sizes: parsedSizes,
    images,
    tags: parsedTags || [],
    isFeatured: isFeatured === 'true' || isFeatured === true,
  });

  res.status(201).json({
    success: true,
    data: product,
    message: 'Product created successfully',
  });
});

// @desc    Update product (admin)
// @route   PUT /api/v1/products/:id
const updateProduct = asyncHandler(async (req, res) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const updateData = { ...req.body };

  // Handle new images
  if (req.files && req.files.length > 0) {
    const newImages = req.files.map((file) => ({
      url: file.path,
      public_id: file.filename,
    }));
    updateData.images = [...(product.images || []), ...newImages];
  }

  // Parse sizes if string
  if (typeof updateData.sizes === 'string') {
    updateData.sizes = JSON.parse(updateData.sizes);
  }

  // Parse tags if string
  if (typeof updateData.tags === 'string') {
    updateData.tags = updateData.tags.split(',').map((t) => t.trim());
  }

  if (updateData.isFeatured !== undefined) {
    updateData.isFeatured = updateData.isFeatured === 'true' || updateData.isFeatured === true;
  }

  product = await Product.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: product,
    message: 'Product updated successfully',
  });
});

// @desc    Delete product (soft delete, admin)
// @route   DELETE /api/v1/products/:id
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  product.isActive = false;
  await product.save();

  res.status(200).json({
    success: true,
    data: {},
    message: 'Product deleted successfully',
  });
});

// @desc    Get featured products
// @route   GET /api/v1/products/featured
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isFeatured: true, isActive: true })
    .limit(8)
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: products,
    message: 'Featured products fetched',
  });
});

// @desc    Add review to product
// @route   POST /api/v1/products/:id/reviews
const addReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const productId = req.params.id;

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Check if user already reviewed
  const existingReview = await Review.findOne({
    user: req.user._id,
    product: productId,
  });

  if (existingReview) {
    // Update existing review
    existingReview.rating = rating;
    existingReview.comment = comment;
    await existingReview.save();
  } else {
    // Create new review
    await Review.create({
      user: req.user._id,
      product: productId,
      rating,
      comment,
    });
  }

  // Recalculate average rating
  const allReviews = await Review.find({ product: productId });
  const avgRating =
    allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

  product.ratings = {
    average: Math.round(avgRating * 10) / 10,
    count: allReviews.length,
  };
  await product.save();

  res.status(200).json({
    success: true,
    data: product,
    message: existingReview ? 'Review updated' : 'Review added',
  });
});

// @desc    Get all products (admin, including inactive)
// @route   GET /api/v1/products/admin/all
const getAdminProducts = asyncHandler(async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: products,
    count: products.length,
    message: 'All products fetched',
  });
});

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  addReview,
  getAdminProducts,
};
