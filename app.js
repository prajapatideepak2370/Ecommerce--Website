require("dotenv").config();

const fs = require("fs");
const express = require("express");
const helmet = require("helmet");
const mongoSanitize = require("./middleware/mongoSanitize");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const passport = require("passport");
const LocalStrategy = require("passport-local");
const path = require("path");

const User = require("./models/User");
const ExpressError = require("./utils/ExpressError");
const errorHandler = require("./middleware/errorHandler");

const usersRouter = require("./routes/users");
const productsRouter = require("./routes/products");
const categoriesRouter = require("./routes/categories");
const cartRouter = require("./routes/cart");
const ordersRouter = require("./routes/orders");
const reviewsRouter = require("./routes/reviews");
const adminRouter = require("./routes/admin");

const adminAuthRouter = require("./routes/admin/adminAuth");
const adminProductsRouter = require("./routes/admin/adminProducts");
const adminCategoriesRouter = require("./routes/admin/adminCategories");
const adminCatalogRouter = require("./routes/admin/adminCatalog");
const { adminPassport, GENERIC_INVALID } = require("./utils/adminPassport");
const {
  requireAdminAuth,
  requireAdminAuthOr404ForUnknown,
} = require("./middleware/adminAuth");

function buildApp(dbClientPromise) {
  const app = express();

  app.set("trust proxy", 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "default-src": ["'self'"],
          "img-src": ["'self'", "data:", "blob:", "https://res.cloudinary.com"],
          "media-src": ["'self'", "https://res.cloudinary.com"],
          "script-src": ["'self'"],
          "style-src": [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
          ],
          "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
          "connect-src": ["'self'"],
          "frame-src": ["'self'"],
          "worker-src": ["'self'", "blob:"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  const corsOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  const adminOrigins = (process.env.ADMIN_ORIGIN || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  const allCorsOrigins = Array.from(new Set([...corsOrigins, ...adminOrigins]));

  app.use(
    cors({
      origin: allCorsOrigins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Accept", "X-Requested-With"],
    }),
  );

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(mongoSanitize());

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 429,
        message: "Too many auth attempts. Please try again in 15 minutes.",
      },
    },
  });

  const generalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use("/api/v1", generalLimiter);
  app.use("/api/v1/users/login", authLimiter);
  app.use("/api/v1/users/register", authLimiter);

  const sessionStore = MongoStore.create({
    clientPromise: dbClientPromise,
    collectionName: "sessions",
    crypto: {
      secret: process.env.SECRET_KEY || "dev-secret-change-me-please",
    },
    touchAfter: 24 * 3600,
  });

  const isProd = process.env.NODE_ENV === "production";
  const customerSessionMiddleware = session({
    store: sessionStore,
    secret: process.env.SECRET_KEY || "dev-secret-change-me-please",
    resave: false,
    saveUninitialized: false,
    name: "tryvoxel.sid",
    cookie: {
      httpOnly: true,
      sameSite: isProd ? "none" : "lax",
      secure: isProd,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  });

  passport.use(
    new LocalStrategy({ usernameField: "username" }, User.authenticate()),
  );
  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());

  app.use("/api/v1", customerSessionMiddleware);
  app.use("/api/v1", passport.initialize());
  app.use("/api/v1", passport.session());

  app.get("/api/v1/health", (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        status: "ok",
        service: "TRYVOXEL³ API",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        dbState: req.app.get("dbState") || "connecting",
      },
    });
  });

  app.use("/api/v1/users", usersRouter);
  app.use("/api/v1/products", productsRouter);
  app.use("/api/v1/products/:productId/reviews", reviewsRouter);
  app.use("/api/v1/categories", categoriesRouter);
  app.use("/api/v1/cart", cartRouter);
  app.use("/api/v1/orders", ordersRouter);
  app.use("/api/v1/admin", adminRouter);

  const adminSessionStore = MongoStore.create({
    clientPromise: dbClientPromise,
    collectionName: "adminSessions",
    crypto: {
      secret:
        process.env.ADMIN_SESSION_SECRET ||
        process.env.SECRET_KEY ||
        "admin-dev-secret-change-me-please",
    },
    touchAfter: 3600,
  });

  const ADMIN_COOKIE_MAX_AGE = Math.max(
    60_000,
    Number(process.env.ADMIN_SESSION_MAX_AGE || 2 * 60 * 60) * 1000,
  );

  const adminSessionMiddleware = session({
    store: adminSessionStore,
    secret:
      process.env.ADMIN_SESSION_SECRET ||
      process.env.SECRET_KEY ||
      "admin-dev-secret-change-me-please",
    resave: false,
    saveUninitialized: false,
    name: "tryvoxel.admin.sid",
    cookie: {
      httpOnly: true,
      sameSite: "strict",
      secure: isProd,
      maxAge: ADMIN_COOKIE_MAX_AGE,
    },
  });

  const adminGeneralLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use("/api/admin", (req, res, next) => {
    res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
    next();
  });
  app.use("/api/admin", adminGeneralLimiter);
  app.use("/api/admin", adminSessionMiddleware);
  app.use("/api/admin", adminPassport.initialize());
  app.use("/api/admin", adminPassport.session());
  app.use("/api/admin/auth", adminAuthRouter);
  app.use("/api/admin", requireAdminAuth);
  app.use("/api/admin/products", adminProductsRouter);
  app.use("/api/admin/categories", adminCategoriesRouter);
  app.use("/api/admin/catalog", adminCatalogRouter);
  app.use("/api/admin", requireAdminAuthOr404ForUnknown);

  const clientDist = path.join(__dirname, "client", "dist");
  const hasClientBuild =
    fs.existsSync(clientDist) &&
    fs.existsSync(path.join(clientDist, "index.html"));
  const hasAdminBuild =
    fs.existsSync(clientDist) &&
    fs.existsSync(path.join(clientDist, "admin.html"));
  const ADMIN_BASE_RAW = process.env.VITE_ADMIN_BASE || "/tvx-console";
  const ADMIN_BASE = ADMIN_BASE_RAW.endsWith("/")
    ? ADMIN_BASE_RAW.slice(0, -1)
    : ADMIN_BASE_RAW;
  const ADMIN_BASE_REGEX = new RegExp(
    `^${ADMIN_BASE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\/.*)?$`,
  );

  if (hasClientBuild) {
    if (hasAdminBuild) {
      app.get("/admin.html", (_req, res) => {
        res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
        res.sendStatus(404);
      });
    }
    app.use(express.static(clientDist));
    if (hasAdminBuild) {
      app.get(ADMIN_BASE_REGEX, (_req, res) => {
        res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
        res.sendFile(path.join(clientDist, "admin.html"));
      });
    }
    app.get(/^(?!\/api).*/, (req, res) => {
      if (hasAdminBuild && ADMIN_BASE_REGEX.test(req.path)) {
        res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
        return res.sendFile(path.join(clientDist, "admin.html"));
      }
      res.sendFile(path.join(clientDist, "index.html"));
    });
  }

  app.use("/api/v1", (req, res, next) => {
    next(
      new ExpressError(404, `Route ${req.method} ${req.originalUrl} not found`),
    );
  });

  app.use(errorHandler);

  return app;
}

module.exports = { buildApp };
