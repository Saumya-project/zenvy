const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const Product = require('../models/Product');
const User = require('../models/User');

const sampleProducts = [
  {
    name: 'Oversized Cosmic Tee',
    description: 'Drop-shoulder oversized tee with a cosmic galaxy print. Made from premium 240 GSM cotton for that heavy drip. Perfect for layering or solo flex.',
    price: 1299,
    discountPrice: 999,
    category: 'tshirt',
    sizes: [
      { size: 'S', stock: 15 },
      { size: 'M', stock: 25 },
      { size: 'L', stock: 30 },
      { size: 'XL', stock: 20 },
      { size: 'XXL', stock: 10 },
    ],
    images: [
      { url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600', public_id: 'seed_tshirt_1' },
    ],
    tags: ['oversized', 'streetwear', 'graphic-tee', 'trending'],
    ratings: { average: 4.5, count: 23 },
    isFeatured: true,
    isActive: true,
  },
  {
    name: 'Neon Graffiti Hoodie',
    description: 'Heavyweight fleece hoodie with neon graffiti art on the back. Kangaroo pocket, ribbed cuffs, and an adjustable drawstring hood. Unisex vibes only.',
    price: 2499,
    discountPrice: 1999,
    category: 'hoodie',
    sizes: [
      { size: 'M', stock: 20 },
      { size: 'L', stock: 25 },
      { size: 'XL', stock: 15 },
      { size: 'XXL', stock: 10 },
    ],
    images: [
      { url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600', public_id: 'seed_hoodie_1' },
    ],
    tags: ['hoodie', 'neon', 'graffiti', 'winter'],
    ratings: { average: 4.8, count: 45 },
    isFeatured: true,
    isActive: true,
  },
  {
    name: 'Y2K Butterfly Crop Top',
    description: 'Y2K-inspired butterfly mesh crop top. Sheer sleeves with a fitted body. Bring the 2000s back in style.',
    price: 899,
    discountPrice: 699,
    category: 'tshirt',
    sizes: [
      { size: 'XS', stock: 12 },
      { size: 'S', stock: 20 },
      { size: 'M', stock: 18 },
      { size: 'L', stock: 10 },
    ],
    images: [
      { url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600', public_id: 'seed_crop_1' },
    ],
    tags: ['y2k', 'crop-top', 'butterfly', 'aesthetic'],
    ratings: { average: 4.2, count: 18 },
    isFeatured: true,
    isActive: true,
  },
  {
    name: 'Baggy Cargo Joggers',
    description: 'Utility cargo joggers with multiple pockets and elastic waistband. Relaxed fit with tapered ankles. Built for the streets.',
    price: 1799,
    discountPrice: 1499,
    category: 'jogger',
    sizes: [
      { size: 'S', stock: 10 },
      { size: 'M', stock: 20 },
      { size: 'L', stock: 25 },
      { size: 'XL', stock: 15 },
    ],
    images: [
      { url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600', public_id: 'seed_jogger_1' },
    ],
    tags: ['cargo', 'jogger', 'streetwear', 'utility'],
    ratings: { average: 4.6, count: 34 },
    isFeatured: true,
    isActive: true,
  },
  {
    name: 'Acid Wash Denim Jacket',
    description: 'Vintage acid wash denim jacket with distressed edges. Oversized fit with brass button closure. Layer this over anything for instant cool.',
    price: 2999,
    discountPrice: 2499,
    category: 'accessories',
    sizes: [
      { size: 'M', stock: 8 },
      { size: 'L', stock: 12 },
      { size: 'XL', stock: 10 },
    ],
    images: [
      { url: 'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=600', public_id: 'seed_jacket_1' },
    ],
    tags: ['denim', 'acid-wash', 'vintage', 'jacket'],
    ratings: { average: 4.7, count: 29 },
    isFeatured: true,
    isActive: true,
  },
  {
    name: 'Retro Colorblock Co-ord Set',
    description: 'Matching shirt and shorts co-ord set with bold retro colorblocking. Breathable cotton blend. Summer essential for the drip-conscious.',
    price: 2199,
    discountPrice: 1799,
    category: 'co-ord',
    sizes: [
      { size: 'S', stock: 10 },
      { size: 'M', stock: 15 },
      { size: 'L', stock: 20 },
      { size: 'XL', stock: 12 },
    ],
    images: [
      { url: 'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=600', public_id: 'seed_coord_1' },
    ],
    tags: ['co-ord', 'colorblock', 'retro', 'summer'],
    ratings: { average: 4.4, count: 22 },
    isFeatured: true,
    isActive: true,
  },
  {
    name: 'Chain Link Bucket Hat',
    description: 'Streetwear bucket hat with chain link detail. Reversible design with solid black on the other side. One size fits all.',
    price: 799,
    discountPrice: 599,
    category: 'accessories',
    sizes: [
      { size: 'Free Size', stock: 50 },
    ],
    images: [
      { url: 'https://images.unsplash.com/photo-1588850561407-ed78c334e67a?w=600', public_id: 'seed_hat_1' },
    ],
    tags: ['bucket-hat', 'chain', 'streetwear', 'accessories'],
    ratings: { average: 4.3, count: 15 },
    isFeatured: false,
    isActive: true,
  },
  {
    name: 'Tie-Dye Swirl Hoodie',
    description: 'Handcrafted tie-dye hoodie in purple and blue swirl pattern. Each piece is unique. Heavy fleece with kangaroo pocket.',
    price: 2299,
    discountPrice: null,
    category: 'hoodie',
    sizes: [
      { size: 'S', stock: 5 },
      { size: 'M', stock: 10 },
      { size: 'L', stock: 15 },
      { size: 'XL', stock: 8 },
    ],
    images: [
      { url: 'https://images.unsplash.com/photo-1578768079470-fa153bb7a12e?w=600', public_id: 'seed_hoodie_2' },
    ],
    tags: ['tie-dye', 'hoodie', 'handmade', 'unique'],
    ratings: { average: 4.9, count: 52 },
    isFeatured: true,
    isActive: true,
  },
  {
    name: 'Tech Fleece Track Pants',
    description: 'Sleek tech fleece joggers with zippered pockets and reflective logo. Slim-tapered fit for the modern look. Moisture-wicking fabric.',
    price: 1999,
    discountPrice: 1699,
    category: 'jogger',
    sizes: [
      { size: 'S', stock: 12 },
      { size: 'M', stock: 20 },
      { size: 'L', stock: 18 },
      { size: 'XL', stock: 10 },
      { size: 'XXL', stock: 5 },
    ],
    images: [
      { url: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=600', public_id: 'seed_jogger_2' },
    ],
    tags: ['tech-fleece', 'jogger', 'slim-fit', 'sporty'],
    ratings: { average: 4.5, count: 38 },
    isFeatured: true,
    isActive: true,
  },
  {
    name: 'Oversized Anime Print Tee',
    description: 'Drop-shoulder tee with exclusive anime-style artwork. Premium 220 GSM ringspun cotton. Anime meets street culture.',
    price: 1499,
    discountPrice: 1199,
    category: 'tshirt',
    sizes: [
      { size: 'M', stock: 20 },
      { size: 'L', stock: 30 },
      { size: 'XL', stock: 25 },
      { size: 'XXL', stock: 15 },
    ],
    images: [
      { url: 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=600', public_id: 'seed_tshirt_2' },
    ],
    tags: ['anime', 'oversized', 'graphic-tee', 'otaku'],
    ratings: { average: 4.7, count: 67 },
    isFeatured: false,
    isActive: true,
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing products');

    // Insert sample products
    const products = await Product.insertMany(sampleProducts);
    console.log(`🌱 Seeded ${products.length} products`);

    // Create admin user if doesn't exist
    const adminExists = await User.findOne({ email: 'admin@dripstore.com' });
    if (!adminExists) {
      await User.create({
        name: 'Drip Admin',
        email: 'admin@dripstore.com',
        password: 'admin123',
        role: 'admin',
      });
      console.log('👑 Admin user created (admin@dripstore.com / admin123)');
    } else {
      console.log('👑 Admin user already exists');
    }

    // Create a test user
    const testUserExists = await User.findOne({ email: 'user@dripstore.com' });
    if (!testUserExists) {
      await User.create({
        name: 'Test User',
        email: 'user@dripstore.com',
        password: 'user1234',
        role: 'user',
      });
      console.log('👤 Test user created (user@dripstore.com / user1234)');
    }

    console.log('\n✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
};

seedDB();
