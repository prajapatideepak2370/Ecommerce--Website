const catchAsync = require("../utils/catchAsync");
const ExpressError = require("../utils/ExpressError");

const stub = (name) =>
  catchAsync(async (req, res, next) => {
    next(new ExpressError(501, `${name} will be implemented in Phase 7+`));
  });

module.exports = {
  getReviewsByProduct: stub("getReviewsByProduct"),
  createReview: stub("createReview"),
  updateReview: stub("updateReview"),
  deleteReview: stub("deleteReview"),
  moderateReview: stub("moderateReview (admin)"),
};
