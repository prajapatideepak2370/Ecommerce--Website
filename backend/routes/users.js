const express = require("express");
const router = express.Router();
const passport = require("passport");
const userController = require("../controllers/user");
const { requireAuth } = require("../middleware/auth");
const catchAsync = require("../utils/catchAsync");
const { validate } = require("../middleware/validate");
const { authSchemas } = require("../schema");
const ExpressError = require("../utils/ExpressError");
const {
  getFrontendUrl,
  getGoogleCallbackUrl,
} = require("../utils/deploymentUrls");

const googleErrorCodes = new Set([
  "access_denied",
  "account_blocked",
  "account_conflict",
  "email_not_verified",
  "not_configured",
  "authentication_failed",
]);

function frontendRedirect(path, query = {}) {
  const frontendUrl = new URL(path, getFrontendUrl());
  Object.entries(query).forEach(([key, value]) =>
    frontendUrl.searchParams.set(key, value),
  );
  return frontendUrl.toString();
}

function googleErrorCode(err, info, req) {
  const code = err?.code || info?.message || req.query.error;
  return googleErrorCodes.has(code) ? code : "authentication_failed";
}

async function normalizeLogin(req, _res, next) {
  const { username, email, password } = req.body || {};
  const loginId = (username || email || "").toString().trim();
  if (!loginId || !password) {
    return next(
      new ExpressError(400, "Username/email and password are required."),
    );
  }

  if (loginId.includes("@")) {
    const found = await require("../models/user")
      .findOne({ email: loginId.toLowerCase() })
      .select("username");
    if (!found) {
      return next(new ExpressError(401, "Invalid email or password."));
    }
    req.body.username = found.username;
  } else {
    req.body.username = loginId.toLowerCase();
  }
  next();
}

router.post(
  "/register",
  validate(authSchemas.register),
  catchAsync(userController.register),
);

router.post(
  "/login",
  validate(authSchemas.login),
  catchAsync(normalizeLogin),
  passport.authenticate("local"),
  catchAsync(userController.login),
);

router.get("/auth/google", (req, res, next) => {
  if (
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_CLIENT_SECRET ||
    !getGoogleCallbackUrl()
  ) {
    return res.redirect(
      frontendRedirect("/login", { google_error: "not_configured" }),
    );
  }
  return passport.authenticate("google", {
    scope: ["profile", "email"],
  })(req, res, next);
});

router.get("/auth/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: false }, (err, user, info) => {
    if (err && err.name !== "GoogleAuthError") return next(err);
    if (!user) {
      return res.redirect(
        frontendRedirect("/login", {
          google_error: googleErrorCode(err, info, req),
        }),
      );
    }
    req.login(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      return res.redirect(frontendRedirect("/", { google_success: "1" }));
    });
  })(req, res, next);
});

router.post("/logout", requireAuth, catchAsync(userController.logout));

router.get("/me", requireAuth, catchAsync(userController.getMe));

router.put(
  "/profile",
  requireAuth,
  validate(authSchemas.profile),
  catchAsync(userController.updateProfile),
);

router.post(
  "/password/change",
  requireAuth,
  validate(authSchemas.changePassword),
  catchAsync(userController.changePassword),
);

router.post(
  "/password/forgot",
  validate(authSchemas.forgotPassword),
  catchAsync(userController.forgotPassword),
);

router.post(
  "/password/reset",
  validate(authSchemas.resetPassword),
  catchAsync(userController.resetPassword),
);

router
  .route("/addresses")
  .get(requireAuth, catchAsync(userController.getAddresses))
  .post(
    requireAuth,
    validate(authSchemas.address),
    catchAsync(userController.addAddress),
  );

router
  .route("/addresses/:addressId")
  .put(
    requireAuth,
    validate(authSchemas.address),
    catchAsync(userController.updateAddress),
  )
  .delete(requireAuth, catchAsync(userController.deleteAddress));

module.exports = router;
