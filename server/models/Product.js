const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide product name'],
    trim: true,
    maxlength: [120, 'Product name cannot exceed 120 characters'],
  },
  description: {
    type: String,
    required: [true, 'Please provide product description'],
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  price: {
    type: Number,
    required: [true, 'Please provide product price'],
    min: [0, 'Price cannot be negative'],
  },
  discountPrice: {
    type: Number,
    default: null,
    min: [0, 'Discount price cannot be negative'],
  },
  category: {
    type: String,
    required: [true, 'Please provide product category'],
    enum: ['tshirt', 'hoodie', 'jogger', 'co-ord', 'accessories'],
  },
  sizes: [
    {
      size: {
        type: String,
        enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'],
      },
      stock: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
  ],
  images: [
    {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
    },
  ],
  tags: [{ type: String, trim: true }],
  ratings: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 },
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for search and filtering
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });

module.exports = mongoose.model('Product', productSchema);
