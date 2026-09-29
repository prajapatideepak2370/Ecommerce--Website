const catchAsync = require("../utils/catchAsync");
const ExpressError = require("../utils/ExpressError");

const stub = (name) =>
  catchAsync(async (req, res, next) => {
    next(new ExpressError(501, `${name} will be implemented in Phase 8+`));
  });

module.exports = {
  getDashboardStats: stub("getDashboardStats"),
  listUsers: stub("listUsers"),
  blockUnblockUser: stub("blockUnblockUser"),
  getInventory: stub("getInventory"),
  getPayments: stub("getPayments"),
  listReviews: stub("listReviews"),
  getSettings: stub("getSettings"),
  updateSettings: stub("updateSettings"),
};
