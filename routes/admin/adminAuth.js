const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const adminAuthController = require("../../controllers/adminAuth");
const catchAsync = require("../../utils/catchAsync");
const { validate } = require("../../middleware/validate");
const { adminAuthSchemas } = require("../../schema");
const {
  adminLoginBruteForce,
  recordAdminLoginFailed,
  requireAdminAuth,
  csrfHeaderCheck,
} = require("../../middleware/adminAuth");

const { adminPassport, GENERIC_INVALID } = require("../../utils/adminPassport");
const ExpressError = require("../../utils/ExpressError");
const { auditLoginFail } = require("../../utils/adminAudit");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 429,
      message: GENERIC_INVALID,
    },
  },
});

async function normalizeAdminLogin(req, _res, next) {
  const { username, email, password } = req.body || {};
  const loginId = (username || email || "").toString().trim();
  if (!loginId || !password) {
    return next(new ExpressError(400, GENERIC_INVALID));
  }
  if (loginId.includes("@")) {
    const User = require("../../models/User");
    const found = await User.findOne({
      email: loginId.toLowerCase(),
    }).select("username");
    if (!found) {
      recordAdminLoginFailed(req);
      await auditLoginFail(req);
      return next(new ExpressError(401, GENERIC_INVALID));
    }
    req.body.username = found.username;
  } else {
    req.body.username = loginId.toLowerCase();
  }
  next();
}

function authenticateAdmin(req, res, next) {
  adminPassport.authenticate("local", (err, user) => {
    if (err) return next(err);
    if (!user) {
      recordAdminLoginFailed(req);
      return auditLoginFail(req).then(
        () => next(new ExpressError(401, GENERIC_INVALID)),
        next,
      );
    }

    req.session.regenerate((sessionErr) => {
      if (sessionErr) return next(sessionErr);
      req.logIn(user, { session: true }, next);
    });
  })(req, res, next);
}

router.post(
  "/login",
  loginLimiter,
  adminLoginBruteForce,
  validate(adminAuthSchemas.login),
  catchAsync(normalizeAdminLogin),
  authenticateAdmin,
  catchAsync(adminAuthController.login),
);

router.post(
  "/logout",
  requireAdminAuth,
  csrfHeaderCheck,
  catchAsync(adminAuthController.logout),
);

router.get("/me", requireAdminAuth, catchAsync(adminAuthController.me));

module.exports = router;
