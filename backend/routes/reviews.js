const express = require("express");
const router = express.Router({ mergeParams: true });
const reviewController = require("../controllers/review");
const catchAsync = require("../utils/catchAsync");
const { requireAuth } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");
const { validate } = require("../middleware/validate");
const { reviewSchemas } = require("../schema");

router.get("/", catchAsync(reviewController.getReviewsByProduct));

router.use(requireAuth);

router.post(
  "/",
  validate(reviewSchemas.create),
  catchAsync(reviewController.createReview),
);

router
  .route("/:reviewId")
  .put(validate(reviewSchemas.update), catchAsync(reviewController.updateReview))
  .delete(catchAsync(reviewController.deleteReview));

router.put(
  "/:reviewId/moderate",
  requireAdmin,
  catchAsync(reviewController.moderateReview),
);

module.exports = router;
