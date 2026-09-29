# TRYVOXEL³ — 3D E-Commerce Platform

> **Experiment. Create. Experience.**

TRYVOXEL³ is a modern full-stack e-commerce platform designed around a **3D-first shopping experience**. It combines a React-based frontend with a Node.js/Express backend, MongoDB persistence, Cloudinary media storage, secure session-based authentication, product management, shopping cart functionality, reviews, categories, and an administration-ready architecture.

The platform is designed to support both **physical products and digital 3D assets**, including STL, GLB, and glTF-based content.

---

## ✨ Highlights

* 🛍️ Full e-commerce storefront architecture
* 🎨 3D product support with **GLB / GLTF**
* ⚛️ React 18 frontend with Vite
* 🧩 React Three Fiber + Three.js integration
* 🟢 Node.js + Express REST API
* 🍃 MongoDB + Mongoose database
* 🔐 Passport.js authentication with persistent sessions
* 🛒 Authenticated shopping cart
* ⭐ Product reviews and ratings
* 🔎 Product search, filtering, sorting, and pagination
* 🗂️ Category management
* ☁️ Cloudinary image and 3D asset storage
* 🛡️ Helmet, CORS, rate limiting, input validation, and Mongo sanitization
* 📦 Inventory and stock-management foundations
* 👤 Customer accounts and saved addresses
* 🧑‍💼 Admin dashboard architecture
* 📱 Responsive, component-based frontend
* 🎞️ Framer Motion page transitions
* 🔔 Toast notifications and loading states
* 🧪 Jest + Supertest testing setup

---

## 🧠 About TRYVOXEL

TRYVOXEL³ is built as more than a basic product listing website.

The project focuses on creating an **experimental digital commerce experience** where products can contain:

* Multiple product images
* 3D models
* Product specifications
* Material information
* Dimensions
* Color options
* Brands
* Stock information
* Ratings and review counts
* Featured-product status

The backend also provides structured APIs for users, products, categories, carts, orders, reviews, and administrative operations.

Product records explicitly support `glb` and `gltf` 3D model formats.

---

# 🏗️ Tech Stack

## Frontend

| Technology             | Purpose                          |
| ---------------------- | -------------------------------- |
| React 18               | UI development                   |
| Vite                   | Frontend development/build tool  |
| React Router DOM       | Client-side routing              |
| Redux Toolkit          | Global application state         |
| React Redux            | Redux integration                |
| Three.js               | 3D rendering                     |
| React Three Fiber      | React-based Three.js integration |
| @react-three/drei      | 3D utilities/components          |
| Framer Motion          | Animations and transitions       |
| Axios                  | API communication                |
| Tailwind CSS           | Styling                          |
| Lucide React           | Icons                            |
| React Hot Toast        | Notifications                    |
| React Loading Skeleton | Loading UI                       |

The client package directly includes React Three Fiber, Drei, Three.js, Redux Toolkit, Axios, Framer Motion, Tailwind CSS, and the other UI dependencies above.

## Backend

| Technology         | Purpose                             |
| ------------------ | ----------------------------------- |
| Node.js            | Runtime                             |
| Express 5          | REST API framework                  |
| MongoDB            | Database                            |
| Mongoose           | MongoDB ODM                         |
| Passport.js        | Authentication                      |
| Passport Local     | Username/password authentication    |
| Express Session    | Session management                  |
| Connect Mongo      | Persistent session storage          |
| Joi                | Request validation                  |
| Cloudinary         | Image/3D asset storage              |
| Multer             | File uploads                        |
| Helmet             | Security headers                    |
| CORS               | Cross-origin API access             |
| Express Rate Limit | API rate limiting                   |
| bcryptjs           | Password-related security support   |
| slugify            | SEO-friendly product/category slugs |
| Jest               | Testing                             |
| Supertest          | API testing                         |

The backend requires Node.js `>=20.0.0`.

---

# 🏛️ Architecture

```text
TRYVOXEL³
│
├── Frontend
│   ├── React
│   ├── React Router
│   ├── Redux Toolkit
│   ├── Three.js
│   ├── React Three Fiber
│   └── Tailwind CSS
│
├── Backend
│   ├── Node.js
│   ├── Express
│   ├── Controllers
│   ├── Routes
│   ├── Middleware
│   ├── Validation
│   └── Utilities
│
├── Database
│   └── MongoDB Atlas
│
└── Cloud Services
    └── Cloudinary
        ├── Product Images
        ├── Category Images
        └── 3D Models
```

The backend follows a modular structure separating routes, controllers, models, middleware, seeders, tests, and utilities.

---

# 📁 Project Structure

```text
TRYVOXEL---Ecommerce/
│
├── Assets/
│
├── client/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   │   ├── account/
│   │   │   └── admin/
│   │   ├── routes/
│   │   ├── store/
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── controllers/
│   ├── admin.js
│   ├── cart.js
│   ├── category.js
│   ├── order.js
│   ├── product.js
│   ├── review.js
│   └── user.js
│
├── middleware/
│   ├── admin.js
│   ├── auth.js
│   ├── errorHandler.js
│   ├── mongoSanitize.js
│   └── validate.js
│
├── models/
│   ├── Cart.js
│   ├── Category.js
│   ├── Order.js
│   ├── Product.js
│   ├── Review.js
│   └── User.js
│
├── routes/
│   ├── admin.js
│   ├── cart.js
│   ├── categories.js
│   ├── orders.js
│   ├── products.js
│   ├── reviews.js
│   └── users.js
│
├── seeders/
│   └── seed.js
│
├── tests/
│
├── utils/
│   ├── cloudinary.js
│   ├── helpers.js
│   └── ...
│
├── .env.example
├── app.js
├── schema.js
├── server.js
├── package.json
└── package-lock.json
```

---

# 🛒 Core Features

## 1. Product Catalog

TRYVOXEL provides a product catalog with:

* Product name
* Description
* Price
* Discount price
* Category
* Brand
* SKU
* Product images
* 3D model
* Stock
* Specifications
* Color options
* Dimensions
* Material
* Rating
* Review count
* Featured status
* Active/inactive status

Products automatically receive URL-friendly slugs and generated SKUs when necessary.

---

## 2. Product Search & Filtering

The product API supports:

* Keyword search
* Category filtering
* Brand filtering
* Minimum/maximum price
* Stock availability
* Featured products
* Minimum rating
* Pagination
* Sorting

Available sorting options include:

```text
newest
price-asc
price-desc
rating-desc
name-asc
```

The API also uses pagination with a configurable limit of up to 100 products per request.

---

## 3. 3D Product Support

A major part of TRYVOXEL is its 3D-ready product architecture.

Products can store:

```json
{
  "model3D": {
    "url": "https://example.com/model.glb",
    "format": "glb"
  }
}
```

Supported formats:

* `.glb`
* `.gltf`

The backend's Cloudinary configuration also provides dedicated storage for 3D assets.

On the frontend, the project includes:

* Three.js
* React Three Fiber
* Drei

for building interactive 3D experiences.

---

# 👤 Authentication & User Accounts

TRYVOXEL uses **Passport Local Strategy** with persistent sessions stored in MongoDB.

Users can:

* Register
* Login using username/email
* Logout
* View their profile
* Update profile information
* Manage saved addresses
* Access their account area

Authentication is protected by middleware, and blocked users are prevented from accessing authenticated functionality.

The frontend includes dedicated routes for:

```text
/account
/account/addresses
/account/orders
/account/settings
```

---

# 🛍️ Shopping Cart

Authenticated users can:

* View their cart
* Add products
* Change item quantities
* Remove items
* Clear the cart

Each user has a unique cart document containing their selected products and quantities.

---

# ⭐ Reviews & Ratings

The project provides a review system associated with products.

Users can:

* Create reviews
* Update reviews
* Delete reviews
* Give ratings from **1–5**
* Add comments

Administrative review moderation is also represented in the API architecture.

---

# 🗂️ Categories

Products are organized using categories.

Categories support:

* Name
* Description
* Slug
* Image
* Active/inactive status

Administrators can create, update, delete, and upload category images.

---

# 💳 Orders & Checkout Architecture

The project contains the database schema and routing architecture for orders.

An order can contain:

* User
* Product items
* Quantity
* Purchase price
* Shipping address snapshot
* Subtotal
* Tax
* Shipping fee
* Total amount
* Payment information
* Order status
* Status history

Supported order states include:

```text
Pending
Confirmed
Processing
Shipped
Delivered
Cancelled
Refunded
```

Payment providers currently represented in the model are:

```text
COD
UPI
```

### Current implementation status

The order controller methods are currently placeholders that return `501 Not Implemented` and indicate implementation for a later phase. Therefore, the repository currently provides the **order architecture/schema/routes**, rather than a completed production order-processing implementation.

---

# 🧑‍💼 Admin Architecture

The frontend already contains routes/pages for:

```text
/admin
/admin/products
/admin/categories
/admin/orders
/admin/customers
/admin/reviews
/admin/inventory
/admin/payments
```

The backend also exposes administrative routes for:

* Dashboard
* Users
* User blocking/unblocking
* Inventory
* Payments
* Reviews
* Settings

Admin middleware restricts these endpoints to authenticated users with the `admin` role.

### Current implementation status

The admin controller is currently scaffolded for a later development phase, with the methods returning `501 Not Implemented`.

---

# ☁️ Cloudinary Integration

TRYVOXEL uses Cloudinary for media management.

Separate storage configurations are provided for:

```text
tryvoxel_DEV/products
tryvoxel_DEV/categories
tryvoxel_DEV/3d-models
```

and production equivalents:

```text
tryvoxel_PROD/products
tryvoxel_PROD/categories
tryvoxel_PROD/3d-models
```

Product/category images support formats including:

```text
PNG
JPG
JPEG
WEBP
AVIF
```

3D uploads support:

```text
GLB
GLTF
```

---

# 🔐 Security

Several security mechanisms are integrated into the backend:

### Helmet

Security-related HTTP headers and Content Security Policy are configured using Helmet.

### CORS

The API supports configurable allowed origins through:

```env
CORS_ORIGIN=http://localhost:5173
```

### Rate Limiting

General API requests are rate-limited, while login and registration have stricter authentication-specific limits.

### Mongo Sanitization

MongoDB-oriented request sanitization middleware is included.

### Session Security

Sessions use:

* HTTP-only cookies
* Secure cookies in production
* SameSite configuration
* MongoDB-backed session storage

### Input Validation

Joi schemas validate authentication, products, categories, carts, orders, reviews, and admin operations.

---

# 🎨 Frontend Architecture

The React application uses:

```text
React
   ↓
React Router
   ↓
Layouts
   ↓
Pages
   ↓
API Layer
   ↓
Express REST API
```

The application uses Redux Toolkit for global state, currently including:

```text
auth
cart
```

Page transitions are handled using Framer Motion, while React Hot Toast provides application notifications.

---

# 🌐 API Structure

The backend API is versioned under:

```text
/api/v1
```

### Health Check

```http
GET /api/v1/health
```

### Users

```text
POST   /api/v1/users/register
POST   /api/v1/users/login
POST   /api/v1/users/logout
GET    /api/v1/users/me
PUT    /api/v1/users/profile

GET    /api/v1/users/addresses
POST   /api/v1/users/addresses
PUT    /api/v1/users/addresses/:addressId
DELETE /api/v1/users/addresses/:addressId
```

### Products

```text
GET    /api/v1/products
POST   /api/v1/products

GET    /api/v1/products/:slug
PUT    /api/v1/products/:slug
DELETE /api/v1/products/:slug

POST   /api/v1/products/:slug/images
PATCH  /api/v1/products/:slug/stock
```

### Categories

```text
GET    /api/v1/categories
GET    /api/v1/categories/:slug

POST   /api/v1/categories
PUT    /api/v1/categories/:slug
DELETE /api/v1/categories/:slug

POST   /api/v1/categories/:slug/image
```

### Cart

```text
GET    /api/v1/cart
DELETE /api/v1/cart

POST   /api/v1/cart/items
PUT    /api/v1/cart/items/:itemId
DELETE /api/v1/cart/items/:itemId
```

### Reviews

```text
GET    /api/v1/products/:productId/reviews
POST   /api/v1/products/:productId/reviews
PUT    /api/v1/products/:productId/reviews/:reviewId
DELETE /api/v1/products/:productId/reviews/:reviewId
PUT    /api/v1/products/:productId/reviews/:reviewId/moderate
```

### Orders

```text
GET    /api/v1/orders
POST   /api/v1/orders
GET    /api/v1/orders/:id
POST   /api/v1/orders/:id/cancel
PUT    /api/v1/orders/:id/status
PUT    /api/v1/orders/:id/refund
```

### Admin

```text
GET    /api/v1/admin/dashboard
GET    /api/v1/admin/users
PATCH  /api/v1/admin/users/:userId/block

GET    /api/v1/admin/inventory
GET    /api/v1/admin/payments
GET    /api/v1/admin/reviews

GET    /api/v1/admin/settings
PUT    /api/v1/admin/settings
```

The route structure is implemented in the backend under the `/api/v1` namespace.

---

# ⚙️ Environment Variables

Create a `.env` file in the project root.

```env
NODE_ENV=development
PORT=5000

ATLASDB_URL=mongodb+srv://<username>:<password>@<cluster-host>/<dbname>

SECRET_KEY=<long-random-secret>

CORS_ORIGIN=http://localhost:5173

CLOUD_NAME=<cloudinary-cloud-name>
CLOUD_API_KEY=<cloudinary-api-key>
CLOUD_API_SECRET=<cloudinary-api-secret>

TAX_PERCENT=18
SHIPPING_FEE=99
FREE_SHIPPING_THRESHOLD=1999

LOW_STOCK_THRESHOLD=5

ADMIN_NAME=TRYVOXEL Admin
ADMIN_EMAIL=admin@tryvoxel.com
ADMIN_PASSWORD=<admin-password>
ADMIN_PHONE=+910000000000
```

The repository provides these variables in `.env.example`. **Never commit real credentials or secrets to GitHub.**

---

# 🚀 Installation

## 1. Clone the Repository

```bash
git clone https://github.com/prajapatideepak2370/TRYVOXEL---Ecommerce.git
```

```bash
cd TRYVOXEL---Ecommerce
```

## 2. Install Backend Dependencies

```bash
npm install
```

## 3. Install Frontend Dependencies

```bash
cd client
npm install
cd ..
```

## 4. Configure Environment Variables

Copy:

```text
.env.example
```

to:

```text
.env
```

Then configure MongoDB Atlas, Cloudinary, authentication, and application settings.

## 5. Seed Initial Data

```bash
npm run seed
```

The seed script can create/promote the initial administrator and populate the database with TRYVOXEL categories and sample products.

## 6. Start the Backend

Development mode:

```bash
npm run dev
```

Production-style start:

```bash
npm start
```

The backend defaults to:

```text
http://localhost:5000
```

and exposes its health endpoint at:

```text
http://localhost:5000/api/v1/health
```

---

# 💻 Start the Frontend

From the project root:

```bash
npm run client
```

The Vite development server runs the React client.

Alternatively:

```bash
cd client
npm run dev
```

The default frontend origin configured for CORS is:

```text
http://localhost:5173
```

---

# 🏭 Production Build

Build the React client:

```bash
npm run build:client
```

This runs:

```bash
npm run build --prefix client
```

After the client is built, the Express application can serve the generated `client/dist` directory when the build exists.

---

# 🧪 Testing

The backend is configured with Jest and Supertest.

Run tests:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

The project uses Node as the Jest test environment and looks for tests inside the `tests/` directory.

---

# 📦 Available NPM Scripts

| Command                | Description                |
| ---------------------- | -------------------------- |
| `npm start`            | Start production server    |
| `npm run dev`          | Start backend with Nodemon |
| `npm run seed`         | Seed database              |
| `npm test`             | Run test suite             |
| `npm run test:watch`   | Run tests in watch mode    |
| `npm run client`       | Start React/Vite client    |
| `npm run build:client` | Build frontend             |

These scripts are defined in the root `package.json`.

---

# 🗃️ Seeded Product Categories

The seed data includes:

* **3D-Desk**
* **Lighting**
* **Home Decor**
* **Wearables**
* **Digital Goods**

Example seeded products include:

```text
Voxel Pen Stand
Glow Lamp Mini
Utilitè Shelf Module
Helix Cuff
Founders Desk Mat
Aurora Sconce
Prism Mirror
Tessellate Ring
Voxel Cable Tidy
Pendant Lamp Halo
Terrazzo Coaster Set
Arc Necklace
Parametric Mouse Pad
LED Strip Kit
Volume Vase
Orbit Earring Pair
STL: Desk Organizer
glTF: Voxel Cube
Mono Desk Organizer
Nebula Table Lamp
Frame 01
Spectrum Band
Voxel Bloom Planter
Arc Work Light
```

The seed file contains the product catalog, pricing, stock, specifications, materials, colors, and featured-product configuration.

---

# 🔄 Application Flow

```text
                ┌──────────────────┐
                │   React Client   │
                └────────┬─────────┘
                         │
                         │ Axios / REST API
                         ▼
                ┌──────────────────┐
                │  Express Server  │
                └────────┬─────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
     Middleware     Controllers       Routes
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                   ┌───────────┐
                   │ Mongoose  │
                   └─────┬─────┘
                         ▼
                   ┌───────────┐
                   │  MongoDB  │
                   └───────────┘

                         +
                         │
                         ▼
                   ┌───────────┐
                   │ Cloudinary│
                   └───────────┘
                    Images / 3D
```

---

# 🔐 Authentication Flow

```text
User
 │
 ├── Register
 │      ↓
 │   Validation
 │      ↓
 │   Passport/User
 │      ↓
 │   Session Created
 │
 └── Login
        ↓
   Username / Email
        ↓
   Passport Local
        ↓
   Session
        ↓
   Authenticated API Access
```

Sessions are stored through MongoDB-backed `connect-mongo`, while Passport handles serialization/deserialization of authenticated users.

---

# 📊 Data Models

The main database entities include:

```text
User
 │
 ├── Addresses
 ├── Cart
 ├── Orders
 └── Reviews

Product
 │
 ├── Category
 ├── Images
 ├── 3D Model
 └── Reviews

Category
 │
 └── Products

Cart
 │
 └── Cart Items → Products

Order
 │
 ├── User
 ├── Order Items
 ├── Shipping Address
 ├── Payment
 └── Status History
```

Product documents support indexed fields for catalog querying, while orders maintain status history as their status changes.

---

# 🛡️ API Security Architecture

```text
Request
   │
   ▼
Helmet
   │
   ▼
CORS
   │
   ▼
Body Parser
   │
   ▼
Mongo Sanitization
   │
   ▼
Rate Limiter
   │
   ▼
Session / Passport
   │
   ▼
Authentication
   │
   ▼
Authorization
   │
   ▼
Joi Validation
   │
   ▼
Controller
```

This layered approach is implemented across the Express application and middleware stack.

---

# 🚧 Current Development Status

TRYVOXEL has a substantial application structure in place, including the storefront, authentication architecture, product/catalog APIs, categories, cart, review system, 3D media support, database models, validation, security middleware, and frontend admin/account routing.

Some backend capabilities are intentionally scaffolded for future phases.

### Currently scaffolded / future implementation

* Full order creation/processing
* Order retrieval
* Order cancellation
* Order status updates
* Refund processing
* Admin dashboard statistics
* Admin user management operations
* Inventory administration
* Payment administration
* Admin review management
* Admin settings

These controller methods currently return HTTP `501 Not Implemented`, with the source explicitly identifying them as future phases.

This makes the repository a useful foundation for continuing development toward a complete production e-commerce platform.

---

# 🗺️ Future Roadmap

Potential next development phases include:

### Phase 1 — Storefront

* [x] Product catalog
* [x] Product filtering
* [x] Product search
* [x] Product details
* [x] Categories
* [x] User authentication
* [x] Cart

### Phase 2 — 3D Commerce

* [x] GLB/GLTF product model support
* [x] Cloudinary 3D storage
* [ ] Advanced 3D product viewer
* [ ] Interactive model customization
* [ ] AR preview

### Phase 3 — Commerce

* [ ] Complete checkout workflow
* [ ] Order creation
* [ ] Order history
* [ ] Order tracking
* [ ] Payment gateway integration
* [ ] Refund workflow

### Phase 4 — Administration

* [ ] Admin dashboard analytics
* [ ] Inventory management
* [ ] Customer management
* [ ] Payment management
* [ ] Review moderation
* [ ] Store settings

### Phase 5 — Advanced Experience

* [ ] Wishlist
* [ ] Product recommendations
* [ ] Advanced search
* [ ] Personalized shopping
* [ ] Coupons and promotions
* [ ] Notifications
* [ ] Analytics dashboard

---

# 🤝 Contributing

Contributions, suggestions, and improvements are welcome.

### Development workflow

```bash
# Fork the repository

# Clone your fork
git clone <your-fork-url>

# Create a feature branch
git checkout -b feature/your-feature

# Install dependencies
npm install

cd client
npm install
cd ..

# Make your changes

# Run tests
npm test

# Commit
git commit -m "Add: your feature"

# Push
git push origin feature/your-feature
```

Then open a Pull Request.

---

# ⚠️ Security Notes

Before deploying this project:

* Use a strong `SECRET_KEY`.
* Never commit `.env`.
* Never expose MongoDB credentials.
* Never expose Cloudinary API secrets.
* Change the initial admin password.
* Configure production CORS origins.
* Use HTTPS in production.
* Review authentication and authorization rules.
* Configure production environment variables separately from development.

The repository's environment template explicitly warns against committing `.env` and expects secrets to be supplied through environment variables.

---

# 📜 License

This project is currently released under the **ISC License** as specified in the root `package.json`.

---

## ⭐ Project Summary

TRYVOXEL³ is a **3D-ready full-stack e-commerce platform** built with React, Node.js, Express, MongoDB, Three.js, React Three Fiber, Redux Toolkit, Passport.js, and Cloudinary.

It combines conventional e-commerce functionality with a foundation for **interactive 3D commerce**, allowing products to carry images, specifications, inventory information, ratings, and GLB/GLTF models.

The architecture is modular and designed to be extended with complete checkout, payments, order processing, administration, analytics, personalization, and advanced 3D/AR shopping experiences.
