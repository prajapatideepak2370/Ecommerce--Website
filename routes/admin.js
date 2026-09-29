const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin");
const catchAsync = require("../utils/catchAsync");
const { requireAuth } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");
const { validate } = require("../middleware/validate");
const { adminSchemas } = require("../schema");

router.use(requireAuth, requireAdmin);

router.get("/dashboard", catchAsync(adminController.getDashboardStats));

router.get("/users", catchAsync(adminController.listUsers));

router.patch(
  "/users/:userId/block",
  validate(adminSchemas.blockUser),
  catchAsync(adminController.blockUnblockUser),
);

router.get("/inventory", catchAsync(adminController.getInventory));

router.get("/payments", catchAsync(adminController.getPayments));

router.get("/reviews", catchAsync(adminController.listReviews));

router
  .route("/settings")
  .get(catchAsync(adminController.getSettings))
  .put(catchAsync(adminController.updateSettings));

module.exports = router;
