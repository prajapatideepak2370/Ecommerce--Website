const ExpressError = require("../utils/ExpressError");
const { createOriginMatcher } = require("../utils/origins");

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

module.exports = function requestOriginCheck(allowedOrigins) {
  const isAllowed =
    typeof allowedOrigins === "function"
      ? allowedOrigins
      : createOriginMatcher(allowedOrigins).isAllowed;

  return function checkRequestOrigin(req, _res, next) {
    if (SAFE_METHODS.has(String(req.method || "").toUpperCase())) {
      return next();
    }

    const origin = req.get("Origin");
    if (origin) {
      if (!isAllowed(origin)) {
        return next(new ExpressError(403, "Invalid request origin."));
      }
      return next();
    }

    const contentType = String(req.get("Content-Type") || "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    const requestedWith = String(req.get("X-Requested-With") || "").toLowerCase();
    if (contentType === "application/json" || requestedWith === "xmlhttprequest") {
      return next();
    }

    return next(new ExpressError(403, "Invalid request origin."));
  };
};
