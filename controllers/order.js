const catchAsync = require("../utils/catchAsync");
const ExpressError = require("../utils/ExpressError");

const stub = (name) =>
  catchAsync(async (req, res, next) => {
    next(new ExpressError(501, `${name} will be implemented in Phase 5+`));
  });

module.exports = {
  createOrder: stub("createOrder"),
  getMyOrders: stub("getMyOrders"),
  getOrderById: stub("getOrderById"),
  cancelOrder: stub("cancelOrder"),
  getAllOrders: stub("getAllOrders (admin)"),
  updateOrderStatus: stub("updateOrderStatus (admin)"),
  markRefunded: stub("markRefunded (admin)"),
};
