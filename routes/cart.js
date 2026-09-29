const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cart");
const catchAsync = require("../utils/catchAsync");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { cartSchemas } = require("../schema");

router.use(requireAuth);

router
  .route("/")
  .get(catchAsync(cartController.getCart))
  .delete(catchAsync(cartController.clearCart));

router.post(
  "/items",
  validate(cartSchemas.addItem),
  catchAsync(cartController.addToCart),
);

router
  .route("/items/:itemId")
  .put(
    validate(cartSchemas.updateQuantity),
    catchAsync(cartController.updateQuantity),
  )
  .delete(catchAsync(cartController.removeItem));

module.exports = router;
