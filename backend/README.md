# TRYVOXEL³ — Backend (REST API)

Independent Node.js + Express 5 REST API for the TRYVOXEL³ e-commerce platform.
It owns all business logic, database access, authentication, validation, and
file/asset handling. It serves **JSON only** — it never renders HTML or serves
the frontend build.

## Responsibilities

- Business logic and application rules
- MongoDB connectivity, Mongoose models, and relationships
- REST endpoints for the customer API (`/api/v1`) and admin API (`/api/admin`)
- Authentication and authorization (Passport Local + Google OAuth, sessions)
- Request validation (Joi, in `schema.js`) and centralized error handling
- Security middleware (Helmet, CORS, rate limiting, Mongo sanitization)
- File uploads and media storage (Cloudinary, Multer)
- Payments (Razorpay order creation + signature verification)
- Transactional email (Nodemailer/SMTP)

## Stack

Node.js (>=20) · Express 5 · MongoDB + Mongoose · Passport.js ·
express-session + connect-mongo · Joi · Cloudinary + Multer · Helmet · CORS ·
express-rate-limit · Razorpay · Nodemailer · Jest + Supertest

## Structure

```text
backend/
├── controllers/     request handlers (customer + admin)
├── models/          Mongoose schemas
├── routes/          /api/v1 + /api/admin route definitions
├── middleware/      auth, validation, error handling, sanitization
├── utils/           cloudinary, razorpay, email, helpers, passport
├── seeders/         seed.js (development categories + sample products + admin)
├── scripts/         createAdmin.js, seedAdmin.js
├── tests/           Jest + Supertest suites
├── schema.js        Joi validation schemas
├── app.js           Express app factory (middleware + route mounting)
└── server.js        Cached DB connection + local HTTP listener/serverless handler
```

## Environment

Copy `.env.example` to `.env` and fill in real values. Never commit `.env`.

Key variables: `NODE_ENV`, `PORT`, `HOST`, `ATLASDB_URL`, `SECRET_KEY`,
`CORS_ORIGIN`, `ADMIN_ORIGIN`, `GOOGLE_*`, `SMTP_*`, `CLOUD_*`,
`RAZORPAY_*`, `ADMIN_*`. See [.env.example](./.env.example) for the full list.

`CORS_ORIGIN` must include the frontend dev origin (default
`http://localhost:5173`).

## Database Setup

1. Create a MongoDB (Atlas or local) database.
2. Put the connection string in `ATLASDB_URL`.
3. For development only, seed sample data:

   ```bash
   npm run seed          # development categories, sample products, admin
   ```

   `npm run seed` refuses to run when `NODE_ENV=production`. Production
   catalogs should be populated through the admin console. Use `npm run
   seed-admin` or `npm run create-admin` only for an intentional initial admin
   setup; neither script promotes or changes an existing non-admin account.

Sessions are stored in MongoDB via `connect-mongo` (`sessions` and
`adminSessions` collections).

## Run

```bash
npm install
npm run dev     # nodemon, http://localhost:5000
npm start       # production
```

`server.js` exports a serverless request handler. MongoDB is connected lazily
and its connection promise is reused across warm invocations; local `npm start`
continues to launch the HTTP listener.

Health check: `GET http://localhost:5000/api/v1/health`

## Tests

```bash
npm test             # Jest + Supertest
npm run test:watch
```

Tests use a disposable `tryvoxel_test` database and clear it between runs — run
only against a throwaway database.

## API

See the **API Structure** section of the root [`../README.md`](../README.md) for
the full endpoint list. Summary:

| Area       | Base path            |
| ---------- | -------------------- |
| Health     | `/api/v1/health`     |
| Users      | `/api/v1/users`      |
| Products   | `/api/v1/products`   |
| Categories | `/api/v1/categories` |
| Cart       | `/api/v1/cart`       |
| Orders     | `/api/v1/orders`     |
| Reviews    | `/api/v1/products/:productId/reviews` |
| Admin      | `/api/admin`         |

Responses are consistent JSON: success is `{ "success": true, "data": ... }`,
errors are `{ "success": false, "error": { "code", "message" } }`.

## Production Notes

- Set `NODE_ENV=production` (enables secure cookies and hides error stacks).
- Set distinct `SECRET_KEY` and `ADMIN_SESSION_SECRET` values, each at least
  32 characters long. Production startup rejects missing, placeholder, short,
  or identical session secrets.
- Set `CORS_ORIGIN` and `ADMIN_ORIGIN` to the deployed frontend origin(s).
- Set `ATLASDB_URL` in the deployment secret manager to the intended production
  database. Do not reuse the local development URI or run development seed data
  against production.
- Frontend and API should remain same-site for cookie-based auth unless the
  cookie/CSRF policy is deliberately adapted for cross-site deployment.
- Order placement uses MongoDB transactions to keep inventory and orders
  consistent. Use MongoDB Atlas or a local replica set; standalone MongoDB
  deployments do not support these transactions.
