const ExpressError = require("../utils/ExpressError");

module.exports.requireAuth = (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return next(new ExpressError(401, "Authentication required. Please log in."));
  }
  if (req.user && req.user.isBlocked) {
    return req.logout((err) => {
      if (err) return next(err);
      return next(new ExpressError(403, "This account has been blocked. Please contact support."));
    });
  }
  next();
};
