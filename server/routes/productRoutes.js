const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  addReview,
  getAdminProducts,
} = require('../controllers/productController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');
const { upload } = require('../config/cloudinary');

// Public routes
router.get('/featured', getFeaturedProducts);
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Protected routes
router.post('/:id/reviews', verifyToken, addReview);

// Admin routes
router.get('/admin/all', verifyToken, isAdmin, getAdminProducts);
router.post('/', verifyToken, isAdmin, upload.array('images', 5), createProduct);
router.put('/:id', verifyToken, isAdmin, upload.array('images', 5), updateProduct);
router.delete('/:id', verifyToken, isAdmin, deleteProduct);

module.exports = router;
