# 🔥 DRIP STORE - Wear the Vibe

> Gen-Z Streetwear Ecommerce Platform | MERN Stack

A full-stack ecommerce web application targeting Gen-Z audiences (16-26) with a focus on streetwear, oversized fits, Y2K fashion, and trendy accessories.

## 🚀 Tech Stack

- **Backend**: Node.js, Express.js, MongoDB (Mongoose)
- **Frontend**: HTML5, CSS3, Bootstrap 5, Vanilla JavaScript
- **Authentication**: JWT (JSON Web Tokens) + bcryptjs
- **Payments**: Razorpay
- **Image Storage**: Cloudinary
- **Architecture**: MVC (Model-View-Controller)

## 📁 Project Structure

```
genz-store/
├── server/
│   ├── config/          → DB, Cloudinary, Seed configs
│   ├── models/          → Mongoose models
│   ├── controllers/     → Business logic
│   ├── routes/          → API route definitions
│   ├── middlewares/      → Auth & Error handlers
│   └── server.js        → Express entry point
├── client/
│   ├── pages/           → HTML pages
│   ├── css/             → Custom stylesheets
│   └── js/              → Client-side JavaScript
├── .env                 → Environment variables
├── package.json
└── README.md
```

## ⚡ Quick Setup

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)
- Cloudinary account (optional, for image uploads)
- Razorpay account (optional, demo mode available)

### Installation

```bash
# 1. Navigate to project directory
cd genz-store

# 2. Install dependencies
npm install

# 3. Configure environment variables
# Edit .env file with your MongoDB URI and other keys

# 4. Seed the database with sample data
npm run seed

# 5. Start the development server
npm run dev

# 6. Open in browser
# http://localhost:5000
```

### Demo Credentials
| Role  | Email                | Password  |
|-------|---------------------|-----------|
| Admin | admin@dripstore.com | admin123  |
| User  | user@dripstore.com  | user1234  |

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|------------|----------|
| `PORT` | Server port (default: 5000) | No |
| `MONGO_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `JWT_EXPIRE` | JWT expiration (default: 7d) | No |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | No* |
| `CLOUDINARY_API_KEY` | Cloudinary API key | No* |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | No* |
| `RAZORPAY_KEY_ID` | Razorpay key ID | No** |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret | No** |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook secret | No** |

\* Required for image uploads  
\** App runs in demo mode without Razorpay keys

## 📡 API Endpoints

All endpoints are prefixed with `/api/v1`

### Auth Routes

| Method | Endpoint | Description | Auth |
|--------|---------|-------------|------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login user | No |
| GET | `/auth/me` | Get current user | Yes |
| PUT | `/auth/profile` | Update profile | Yes |
| POST | `/auth/address` | Add address | Yes |
| DELETE | `/auth/address/:id` | Remove address | Yes |
| GET | `/auth/users` | Get all users | Admin |

### Product Routes

| Method | Endpoint | Description | Auth |
|--------|---------|-------------|------|
| GET | `/products` | Get all products (filter/sort/page) | No |
| GET | `/products/featured` | Get featured products | No |
| GET | `/products/:id` | Get single product | No |
| POST | `/products` | Create product | Admin |
| PUT | `/products/:id` | Update product | Admin |
| DELETE | `/products/:id` | Soft delete product | Admin |
| POST | `/products/:id/reviews` | Add/update review | Yes |
| GET | `/products/admin/all` | Get all (inc. inactive) | Admin |

### Cart Routes

| Method | Endpoint | Description | Auth |
|--------|---------|-------------|------|
| GET | `/cart` | Get user cart | Yes |
| POST | `/cart` | Add item to cart | Yes |
| POST | `/cart/merge` | Merge local cart | Yes |
| PUT | `/cart/:itemId` | Update cart item qty | Yes |
| DELETE | `/cart/:itemId` | Remove cart item | Yes |
| DELETE | `/cart` | Clear cart | Yes |

### Order Routes

| Method | Endpoint | Description | Auth |
|--------|---------|-------------|------|
| POST | `/orders` | Create order | Yes |
| POST | `/orders/verify-payment` | Verify Razorpay payment | Yes |
| GET | `/orders/my` | Get user's orders | Yes |
| GET | `/orders/:id` | Get single order | Yes |
| GET | `/orders` | Get all orders | Admin |
| PUT | `/orders/:id/status` | Update order status | Admin |

### Payment Routes

| Method | Endpoint | Description | Auth |
|--------|---------|-------------|------|
| POST | `/payment/create-order` | Create Razorpay order | Yes |
| POST | `/payment/webhook` | Razorpay webhook | No |

## 🎨 Features

### Customer Features
- 🛍️ Browse products with category, size, price filters
- 🔍 Full-text search with sorting and pagination
- 🛒 Cart management (works without login via localStorage)
- 💳 Checkout with Razorpay payment integration
- ⭐ Product reviews and ratings
- 📦 Order history and tracking
- 📍 Saved addresses management
- 🔐 JWT-based authentication

### Admin Features
- 📊 Dashboard with revenue, orders, products, users stats
- 📦 Full product CRUD with image upload
- 📋 Order management with status updates
- 👥 User management

### Design
- 🌙 Dark mode with neon accent colors
- ✨ Glassmorphism navbar
- 🎭 Smooth hover animations
- 📱 Fully responsive design
- 🔤 Space Grotesk typography

## 📝 API Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": {},
  "message": "Description of the result"
}
```

## 📄 License

ISC License
