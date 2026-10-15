require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const mongoSanitize = require("./middleware/mongoSanitize");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const passport = require("passport");
const LocalStrategy = require("passport-local");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

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
const adminOrdersRouter = require("./routes/admin/adminOrders");
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
          "img-src": [
            "'self'",
            "data:",
            "blob:",
            "https://res.cloudinary.com",
            "https://*.googleusercontent.com",
          ],
          "media-src": ["'self'", "https://res.cloudinary.com"],
          "script-src": ["'self'", "https://checkout.razorpay.com"],
          "style-src": [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
          ],
          "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
          "connect-src": [
            "'self'",
            "https://res.cloudinary.com",
            "https://api.razorpay.com",
          ],
          "frame-src": ["'self'", "https://api.razorpay.com"],
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

  const passwordResetRequestLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 429,
        message: "Too many password reset requests. Please try again later.",
      },
    },
  });

  const passwordChangeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 429,
        message: "Too many password change attempts. Please try again later.",
      },
    },
  });

  const passwordResetVerifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 429,
        message: "Too many password reset attempts. Please try again later.",
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
  app.use("/api/v1/users/auth/google", authLimiter);
  app.use("/api/v1/users/password/change", passwordChangeLimiter);
  app.use("/api/v1/users/password/forgot", passwordResetRequestLimiter);
  app.use("/api/v1/users/password/reset", passwordResetVerifyLimiter);

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

  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;
  const { resolveGoogleUser } = require("./utils/googleAuth");

  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_CALLBACK_URL) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: GOOGLE_CLIENT_ID,
          clientSecret: GOOGLE_CLIENT_SECRET,
          callbackURL: GOOGLE_CALLBACK_URL,
          state: true,
          pkce: "S256",
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const user = await resolveGoogleUser(profile);
            return done(null, user);
          } catch (err) {
            if (err.name === "GoogleAuthError") {
              return done(null, false, { message: err.code });
            }
            return done(err);
          }
        },
      ),
    );
  }

  passport.serializeUser((user, done) => {
    done(null, {
      username: user.username,
      authVersion: user.authVersion || 0,
    });
  });
  passport.deserializeUser(async (sessionUser, done) => {
    try {
      const legacySession = typeof sessionUser === "string";
      const user = await User.findByUsername(
        legacySession ? sessionUser : sessionUser.username,
      );
      const sessionVersion = legacySession ? 0 : sessionUser.authVersion;
      if (!user || (user.authVersion || 0) !== sessionVersion) {
        return done(null, false);
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  });

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
  app.use("/api/admin/orders", adminOrdersRouter);
  app.use("/api/admin", requireAdminAuthOr404ForUnknown);

  app.use("/api/v1", (req, res, next) => {
    next(
      new ExpressError(404, `Route ${req.method} ${req.originalUrl} not found`),
    );
  });

  app.use(errorHandler);

  return app;
}

module.exports = { buildApp };
