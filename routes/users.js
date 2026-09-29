const express = require("express");
const router = express.Router();
const passport = require("passport");
const userController = require("../controllers/user");
const { requireAuth } = require("../middleware/auth");
const catchAsync = require("../utils/catchAsync");
const { validate } = require("../middleware/validate");
const { authSchemas } = require("../schema");
const ExpressError = require("../utils/ExpressError");

async function normalizeLogin(req, _res, next) {
  const { username, email, password } = req.body || {};
  const loginId = (username || email || "").toString().trim();
  if (!loginId || !password) {
    return next(new ExpressError(400, "Username/email and password are required."));
  }

  if (loginId.includes("@")) {
    const found = await require("../models/User")
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

router.post("/logout", requireAuth, catchAsync(userController.logout));

router.get("/me", requireAuth, catchAsync(userController.getMe));

router.put(
  "/profile",
  requireAuth,
  validate(authSchemas.profile),
  catchAsync(userController.updateProfile),
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
