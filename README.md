# TRYVOXEL³ — 3D E-Commerce Platform

> **Experiment. Create. Experience.**

TRYVOXEL³ is a modern full-stack e-commerce platform designed around a **3D-first shopping experience**. It combines a React-based frontend with a Node.js/Express backend, MongoDB persistence, Cloudinary media storage, secure session-based authentication, product management, shopping cart functionality, reviews, categories, and an administration-ready architecture.

The platform is designed to support both **physical products and digital 3D assets**, including STL, GLB, and glTF-based content.

---

## ✨ Highlights

- 🛍️ Full e-commerce storefront architecture
- 🎨 3D product support with **GLB / GLTF**
- ⚛️ React 18 frontend with Vite
- 🧩 React Three Fiber + Three.js integration
- 🟢 Node.js + Express REST API
- 🍃 MongoDB + Mongoose database
- 🔐 Passport.js authentication with persistent sessions
- 🛒 Authenticated shopping cart
- ⭐ Product reviews and ratings
- 🔎 Product search, filtering, sorting, and pagination
- 🗂️ Category management
- ☁️ Cloudinary image and 3D asset storage
- 🛡️ Helmet, CORS, rate limiting, input validation, and Mongo sanitization
- 📦 Inventory and stock-management foundations
- 👤 Customer accounts and saved addresses
- 🧑‍💼 Admin dashboard architecture
- 📱 Responsive, component-based frontend
- 🎞️ Framer Motion page transitions
- 🔔 Toast notifications and loading states
- 🧪 Jest + Supertest testing setup

---

## 🧠 About TRYVOXEL

TRYVOXEL³ is built as more than a basic product listing website.

The project focuses on creating an **experimental digital commerce experience** where products can contain:

- Multiple product images
- 3D models
- Product specifications
- Material information
- Dimensions
- Color options
- Brands
- Stock information
- Ratings and review counts
- Featured-product status

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

The Express API and Vite client are independent applications. Express serves
JSON APIs only; Vite serves/builds the React storefront and admin UI. The
backend lives in `backend/` and the frontend in `frontend/`; each has its own
package manifest and can be started, tested, or deployed separately. The
frontend uses `VITE_API_BASE` and `VITE_ADMIN_API_BASE` to reach the backend.

---

# 📁 Project Structure

```text
TRYVOXEL/
│
├── backend/                      # Express REST API (independent app)
│   ├── controllers/              # request handlers (customer + admin)
│   ├── models/                   # Mongoose schemas
│   ├── routes/                   # /api/v1 + /api/admin route definitions
│   ├── middleware/               # auth, validation, error handling, sanitize
│   ├── utils/                    # cloudinary, razorpay, email, helpers
│   ├── seeders/                  # database seed scripts
│   ├── scripts/                  # create-admin / seed-admin
│   ├── tests/                    # Jest + Supertest suites
│   ├── schema.js                 # Joi validation schemas (validators)
│   ├── app.js                    # Express app factory (middleware + routes)
│   ├── server.js                 # DB connection + HTTP listener
│   ├── .env.example
│   ├── package.json
│   └── README.md
│
├── frontend/                     # React + Vite SPA (independent app)
│   ├── src/
│   │   ├── api/                  # centralized Axios API client
│   │   ├── components/           # reusable UI components
│   │   ├── layouts/              # page layouts
│   │   ├── pages/                # storefront + account pages
│   │   ├── admin/                # separate admin console SPA
│   │   ├── routes/               # client-side routing + guards
│   │   ├── store/                # Redux Toolkit slices
│   │   └── ...
│   ├── public/
│   ├── index.html                # storefront entry
│   ├── admin.html                # admin console entry
│   ├── .env.example
│   ├── package.json
│   └── README.md
│
├── Assets/                       # design source assets
├── .gitignore
└── README.md
```

---

# 🛒 Core Features

## 1. Product Catalog

TRYVOXEL provides a product catalog with:

- Product name
- Description
- Price
- Discount price
- Category
- Brand
- SKU
- Product images
- 3D model
- Stock
- Specifications
- Color options
- Dimensions
- Material
- Rating
- Review count
- Featured status
- Active/inactive status

Products automatically receive URL-friendly slugs and generated SKUs when necessary.

---

## 2. Product Search & Filtering

The product API supports:

- Keyword search
- Category filtering
- Brand filtering
- Minimum/maximum price
- Stock availability
- Featured products
- Minimum rating
- Pagination
- Sorting

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

- `.glb`
- `.gltf`

The backend's Cloudinary configuration also provides dedicated storage for 3D assets.

On the frontend, the project includes:

- Three.js
- React Three Fiber
- Drei

for building interactive 3D experiences.

---

# 👤 Authentication & User Accounts

TRYVOXEL uses **Passport Local Strategy** with persistent sessions stored in MongoDB.

Users can:

- Register
- Login using username/email
- Logout
- View their profile
- Update profile information
- Manage saved addresses
- Access their account area

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

- View their cart
- Add products
- Change item quantities
- Remove items
- Clear the cart

Each user has a unique cart document containing their selected products and quantities.

---

# ⭐ Reviews & Ratings

The project provides a review system associated with products.

Users can:

- Create reviews
- Update reviews
- Delete reviews
- Give ratings from **1–5**
- Add comments

Administrative review moderation is also represented in the API architecture.

---

# 🗂️ Categories

Products are organized using categories.

Categories support:

- Name
- Description
- Slug
- Image
- Active/inactive status

Administrators can create, update, delete, and upload category images.

---

# 💳 Orders & Checkout Architecture

The project contains the database schema and routing architecture for orders.

An order can contain:

- User
- Product items
- Quantity
- Purchase price
- Shipping address snapshot
- Subtotal
- Tax
- Shipping fee
- Total amount
- Payment information
- Order status
- Status history

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

Online payments are processed through Razorpay Checkout, which supports UPI,
cards, net banking, and wallets. UPI apps such as PhonePe, Paytm, and Google
Pay are presented by Razorpay when available for the customer's device and
enabled for the merchant account.

The backend creates Razorpay orders using server-side product prices and
returns the exact amount in paise for Checkout. It verifies the callback
signature and fetches the order and payment from Razorpay before marking an
order as paid; only captured payments are accepted. Repeated verification of a
successful payment returns the existing order instead of creating a duplicate.
Razorpay payment methods must also be enabled in the merchant's Razorpay
account.

Razorpay Standard Checkout handles UPI QR generation on desktop; this
application does not construct UPI payment URLs or QR payloads itself. Razorpay
Test Mode QR codes are not scannable and disappear shortly after display. Use
other Razorpay test payment methods in Test Mode; scanning UPI QR codes requires
Live Mode credentials and UPI QR availability enabled for the merchant account.

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

The active admin UI uses the separate, session-protected `/api/admin` API for
catalog, category, inventory, and order management. Legacy `/api/v1/admin`
routes for dashboard, users, payments, reviews, and settings remain mounted
for compatibility; some of those legacy controller operations are still
scaffolded and return `501 Not Implemented`.

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

- HTTP-only cookies
- Secure cookies in production
- SameSite configuration
- MongoDB-backed session storage

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

The public customer API is versioned under `/api/v1`. The separate admin API
uses `/api/admin`.

```text
Customer API: /api/v1
Admin API:    /api/admin
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
GET    /api/v1/users/auth/google
GET    /api/v1/users/auth/google/callback
POST   /api/v1/users/password/change
POST   /api/v1/users/password/forgot
POST   /api/v1/users/password/reset

GET    /api/v1/users/addresses
POST   /api/v1/users/addresses
PUT    /api/v1/users/addresses/:addressId
DELETE /api/v1/users/addresses/:addressId
```

### Products

```text
GET    /api/v1/products
GET    /api/v1/products/:slug
POST   /api/v1/products                 (admin)
PUT    /api/v1/products/:slug           (admin)
DELETE /api/v1/products/:slug           (admin)
POST   /api/v1/products/:slug/images    (admin)
PATCH  /api/v1/products/:slug/stock     (admin)
```

### Categories

```text
GET    /api/v1/categories
GET    /api/v1/categories/:slug

POST   /api/v1/categories               (admin)
PUT    /api/v1/categories/:slug         (admin)
DELETE /api/v1/categories/:slug         (admin)
POST   /api/v1/categories/:slug/image   (admin)
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
POST   /api/v1/orders/razorpay/create-order
POST   /api/v1/orders/razorpay/verify
PUT    /api/v1/orders/:id/status        (admin)
PUT    /api/v1/orders/:id/refund        (admin)
```

### Admin portal

```text
POST   /api/admin/auth/login
POST   /api/admin/auth/logout
GET    /api/admin/auth/me
GET    /api/admin/products
POST   /api/admin/products
GET    /api/admin/products/:id
PUT    /api/admin/products/:id
PATCH  /api/admin/products/:id/status
PATCH  /api/admin/products/:id/stock
POST   /api/admin/products/bulk
DELETE /api/admin/products/:id
POST   /api/admin/products/:id/images
PUT    /api/admin/products/:id/images
DELETE /api/admin/products/:id/images/:publicId
POST   /api/admin/products/:id/model3d
DELETE /api/admin/products/:id/model3d
GET    /api/admin/categories
POST   /api/admin/categories
GET    /api/admin/categories/:id
PUT    /api/admin/categories/:id
DELETE /api/admin/categories/:id
POST   /api/admin/categories/:id/image
DELETE /api/admin/categories/:id/image
GET    /api/admin/catalog/summary
GET    /api/admin/catalog/inventory
PATCH  /api/admin/catalog/inventory/:id
GET    /api/admin/catalog/inventory/:id/history
GET    /api/admin/orders
GET    /api/admin/orders/:id
PUT    /api/admin/orders/:id/status
PUT    /api/admin/orders/:id/payment
PUT    /api/admin/orders/:id/refund
```

Legacy `/api/v1/admin` routes remain mounted for compatibility. The admin UI
uses `/api/admin` and its separate session cookie.

---

# ⚙️ Environment Variables

Create a backend `.env` file in `backend/` and a frontend `.env` file in
`frontend/`. Do not place backend secrets in the frontend environment.

```env
NODE_ENV=development
PORT=5000

ATLASDB_URL=mongodb+srv://<username>:<password>@<cluster-host>/<dbname>

SECRET_KEY=<long-random-secret>

CORS_ORIGIN=http://localhost:5173

CLOUD_NAME=<cloudinary-cloud-name>
CLOUD_API_KEY=<cloudinary-api-key>
CLOUD_API_SECRET=<cloudinary-api-secret>

TAX_PERCENT=0
SHIPPING_FEE=0
FREE_SHIPPING_THRESHOLD=0

LOW_STOCK_THRESHOLD=5

ADMIN_NAME=TRYVOXEL Admin
ADMIN_EMAIL=admin@tryvoxel.com
ADMIN_PASSWORD=<admin-password>
ADMIN_PHONE=+910000000000
```

The backend variables are documented in `backend/.env.example`; frontend API
origins are documented in `frontend/.env.example`. **Never commit real
credentials or secrets to GitHub.**

Customers pay only the displayed product price multiplied by quantity. Checkout
adds no GST, shipping, or other fees; the cart, order, and Razorpay totals all
match the product subtotal.

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
cd backend
npm install
```

## 3. Install Frontend Dependencies

```bash
cd frontend
npm install
```

## 4. Configure Environment Variables

Copy the backend template `backend/.env.example` to `backend/.env`. Then copy
the frontend template `frontend/.env.example` to `frontend/.env`. Configure
MongoDB Atlas, Cloudinary, authentication, and application settings in the
backend environment. Set the customer and admin API URLs in the frontend
environment.

## 5. Seed Development Data

For local development only, run the seed script from the `backend/` directory:

```bash
npm run seed
```

This creates sample categories and products and may create the initial
administrator. It refuses to run with `NODE_ENV=production`. Populate a
production catalog through the admin console instead. The seed scripts do not
promote or modify an existing non-admin account.

## 6. Start the Backend

In one terminal, start the backend from the `backend/` directory:

```bash
cd backend
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

In a separate terminal, start the frontend from the `frontend/` directory:

```bash
cd frontend
npm run dev
```

The Vite development server runs the React client at:

```text
http://localhost:5173
```

---

# 🏭 Production Build and Deployment

Build the React client independently from the `frontend/` directory. Set these
public frontend variables in the Vercel build environment (they contain API
URLs, not credentials):

```env
VITE_API_BASE=https://api.example.com/api/v1
VITE_ADMIN_API_BASE=https://api.example.com/api/admin
```

The production bundle is written to `frontend/dist`. The Vercel configuration
at the repository root installs/builds the frontend and serves it as a static
site, including rewrites for `/tvx-console` and nested admin routes. The
storefront's client-side routes also fall back to `index.html`. The Express
API is deployed separately. In Vercel Project Settings, set the two
`VITE_*_API_BASE` values above for every build environment that will be used;
the production build rejects missing values, HTTP API URLs, and localhost
targets.

Set backend `CORS_ORIGIN` and `ADMIN_ORIGIN` to the exact deployed frontend
origin(s), and set the backend's production secrets and database URL in the
backend host's secret manager. Set `NODE_ENV=production`; the backend listener
then binds to `0.0.0.0` by default so external Node hosts can reach it (local
development continues to bind to `localhost`). Assign frontend and API custom
domains under the same site (for example, `www.example.com` and
`api.example.com`) because admin authentication uses secure,
`SameSite=Strict` session cookies. Express does not serve the frontend build.
For non-Vercel static hosts, configure equivalent rewrites to serve `index.html`
for storefront routes and `admin.html` for the configured `VITE_ADMIN_BASE`
and nested routes.

---

# 🧪 Testing

The backend is configured with Jest and Supertest. Run the suites from the
`backend/` directory:

```bash
cd backend
npm test
```

Watch mode:

```bash
npm run test:watch
```

The project uses Node as the Jest test environment and looks for tests inside the `backend/tests/` directory.
The test helper clears and drops the `tryvoxel_test` database. Run the suite
only with a disposable test database; it was not run during this migration to
avoid deleting existing data.

---

# 📦 Available NPM Scripts

These backend scripts are defined in `backend/package.json` and are run from
the `backend/` directory:

| Command                | Description                 |
| ---------------------- | --------------------------- |
| `npm start`            | Start production server     |
| `npm run dev`          | Start backend with Nodemon  |
| `npm run seed`         | Seed database               |
| `npm run seed-admin`   | Seed/promote the admin user |
| `npm run create-admin` | Create an admin user        |
| `npm test`             | Run test suite              |
| `npm run test:watch`   | Run tests in watch mode     |

These frontend scripts are defined in `frontend/package.json` and are run from
the `frontend/` directory:

| Command           | Description                  |
| ----------------- | ---------------------------- |
| `npm run dev`     | Start Vite dev server (5173) |
| `npm run build`   | Build the production bundle  |
| `npm run preview` | Preview the built bundle     |

---

# 🗃️ Seeded Product Categories

The seed data includes:

- **3D-Desk**
- **Lighting**
- **Home Decor**
- **Wearables**
- **Digital Goods**

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

- Full order creation/processing
- Order retrieval
- Order cancellation
- Order status updates
- Refund processing
- Admin dashboard statistics
- Admin user management operations
- Inventory administration
- Payment administration
- Admin review management
- Admin settings

These controller methods currently return HTTP `501 Not Implemented`, with the source explicitly identifying them as future phases.

This makes the repository a useful foundation for continuing development toward a complete production e-commerce platform.

---

# 🗺️ Future Roadmap

Potential next development phases include:

### Phase 1 — Storefront

- [x] Product catalog
- [x] Product filtering
- [x] Product search
- [x] Product details
- [x] Categories
- [x] User authentication
- [x] Cart

### Phase 2 — 3D Commerce

- [x] GLB/GLTF product model support
- [x] Cloudinary 3D storage
- [ ] Advanced 3D product viewer
- [ ] Interactive model customization
- [ ] AR preview

### Phase 3 — Commerce

- [ ] Complete checkout workflow
- [ ] Order creation
- [ ] Order history
- [ ] Order tracking
- [ ] Payment gateway integration
- [ ] Refund workflow

### Phase 4 — Administration

- [ ] Admin dashboard analytics
- [ ] Inventory management
- [ ] Customer management
- [ ] Payment management
- [ ] Review moderation
- [ ] Store settings

### Phase 5 — Advanced Experience

- [ ] Wishlist
- [ ] Product recommendations
- [ ] Advanced search
- [ ] Personalized shopping
- [ ] Coupons and promotions
- [ ] Notifications
- [ ] Analytics dashboard

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
cd backend
npm install
cd ../frontend
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

- Use a strong `SECRET_KEY`.
- Never commit `.env`.
- Never expose MongoDB credentials.
- Never expose Cloudinary API secrets.
- Change the initial admin password.
- Configure production CORS origins.
- Use HTTPS in production.
- Review authentication and authorization rules.
- Configure production environment variables separately from development.

The repository's environment template explicitly warns against committing `.env` and expects secrets to be supplied through environment variables.

---

# 📜 License

This project is currently released under the **ISC License** as specified in `backend/package.json`.

---

## ⭐ Project Summary

TRYVOXEL³ is a **3D-ready full-stack e-commerce platform** built with React, Node.js, Express, MongoDB, Three.js, React Three Fiber, Redux Toolkit, Passport.js, and Cloudinary.

It combines conventional e-commerce functionality with a foundation for **interactive 3D commerce**, allowing products to carry images, specifications, inventory information, ratings, and GLB/GLTF models.

The architecture is modular and designed to be extended with complete checkout, payments, order processing, administration, analytics, personalization, and advanced 3D/AR shopping experiences.
