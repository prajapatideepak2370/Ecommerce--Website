const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order");
const catchAsync = require("../utils/catchAsync");
const { requireAuth } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");
const { validate } = require("../middleware/validate");
const { orderSchemas } = require("../schema");

router.use(requireAuth);

router
  .route("/")
  .get(
    (req, res, next) => (req.user && req.user.role === "admin" ? orderController.getAllOrders(req, res, next) : orderController.getMyOrders(req, res, next)),
  )
  .post(validate(orderSchemas.create), catchAsync(orderController.createOrder));

router.get("/:id", catchAsync(orderController.getOrderById));

router.post("/:id/cancel", catchAsync(orderController.cancelOrder));

router.put(
  "/:id/status",
  requireAdmin,
  validate(orderSchemas.status),
  catchAsync(orderController.updateOrderStatus),
);

router.put(
  "/:id/refund",
  requireAdmin,
  catchAsync(orderController.markRefunded),
);

module.exports = router;
