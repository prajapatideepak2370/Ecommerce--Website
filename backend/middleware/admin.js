const ExpressError = require("../utils/ExpressError");

module.exports.requireAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new ExpressError(401, "Authentication required."));
  }
  if (req.user.role !== "admin") {
    return next(new ExpressError(403, "Admin access required."));
  }
  next();
};
