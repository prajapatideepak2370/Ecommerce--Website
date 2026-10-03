const express = require("express");
const router = express.Router();

const adminOrdersController = require("../../controllers/adminOrders");
const catchAsync = require("../../utils/catchAsync");
const { validate } = require("../../middleware/validate");
const { orderSchemas, adminSchemas } = require("../../schema");
const { csrfHeaderCheck, requireAdminAuth } = require("../../middleware/adminAuth");

router.use(requireAdminAuth);

router.get(["/", ""], catchAsync(adminOrdersController.listOrders));

router.get("/:id", catchAsync(adminOrdersController.getOrder));

router.put(
  "/:id/status",
  csrfHeaderCheck,
  validate(orderSchemas.status),
  catchAsync(adminOrdersController.updateStatus),
);

router.put(
  "/:id/payment",
  csrfHeaderCheck,
  catchAsync(adminOrdersController.updatePayment),
);

router.put(
  "/:id/refund",
  csrfHeaderCheck,
  catchAsync(adminOrdersController.refundOrder),
);

module.exports = router;
