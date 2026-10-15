const ExpressError = require("../utils/ExpressError");
const { GENERIC_INVALID } = require("../utils/adminPassport");

const ADMIN_LOGIN_MAX_ATTEMPTS = Math.max(
  1,
  Number(process.env.ADMIN_LOGIN_MAX_ATTEMPTS) || 5,
);

const _failedAttempts = new Map();
const _LOCK_MS = 15 * 60 * 1000;

function _getKey(ip, loginId) {
  return `${ip || ""}|${String(loginId || "").trim().toLowerCase()}`;
}

function _getClientIp(req) {
  const ip =
    (req.headers &&
      (req.headers["x-forwarded-for"] || req.headers["x-real-ip"])) ||
    req.ip ||
    (req.connection && req.connection.remoteAddress) ||
    "";
  if (Array.isArray(ip)) return ip[0];
  return String(ip || "").split(",")[0].trim();
}

function adminLoginBruteForce(req, _res, next) {
  const ip = _getClientIp(req);
  const loginId = (req.body && (req.body.username || req.body.email)) || "";
  req._adminBruteLoginId = loginId;
  const key = _getKey(ip, loginId);
  const rec = _failedAttempts.get(key);
  if (rec) {
    const now = Date.now();
    if (now - rec.firstFailedAt > _LOCK_MS) {
      _failedAttempts.delete(key);
    } else if (rec.count >= ADMIN_LOGIN_MAX_ATTEMPTS) {
      const left = Math.ceil((_LOCK_MS - (now - rec.firstFailedAt)) / 60000);
      console.warn(
        `[ADMIN BRUTE] Locked out: ip=${ip} attempts=${rec.count} minLeft=${left}`,
      );
      return next(
        new ExpressError(429, GENERIC_INVALID),
      );
    }
  }
  req._adminBruteIp = ip;
  next();
}

function recordAdminLoginFailed(req) {
  const ip = (req && req._adminBruteIp) || _getClientIp(req);
  const loginId =
    (req && req._adminBruteLoginId) ||
    (req && req.body && (req.body.username || req.body.email)) ||
    "";
  const key = _getKey(ip, loginId);
  const now = Date.now();
  const rec = _failedAttempts.get(key);
  if (!rec || now - rec.firstFailedAt > _LOCK_MS) {
    _failedAttempts.set(key, { count: 1, firstFailedAt: now });
  } else {
    rec.count += 1;
  }
  console.warn(
    `[ADMIN LOGIN FAIL] ip=${ip} count=${_failedAttempts.get(key).count}`,
  );
}

function clearAdminLoginFailed(req) {
  if (!req) return;
  const ip = req._adminBruteIp || _getClientIp(req);
  const loginId =
    req._adminBruteLoginId ||
    (req.body && (req.body.username || req.body.email)) ||
    "";
  const key = _getKey(ip, loginId);
  _failedAttempts.delete(key);
}

function requireAdminAuth(req, _res, next) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return next(new ExpressError(401, GENERIC_INVALID));
  }
  const u = req.user;
  if (!u || u.role !== "admin") {
    return next(new ExpressError(401, GENERIC_INVALID));
  }
  if (u.isBlocked) {
    return next(new ExpressError(401, GENERIC_INVALID));
  }
  next();
}

function requireAdminAuthOr404ForUnknown(req, res, next) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return next(new ExpressError(401, GENERIC_INVALID));
  }
  const u = req.user;
  if (!u || u.role !== "admin" || u.isBlocked) {
    return next(new ExpressError(401, GENERIC_INVALID));
  }
  next(
    new ExpressError(404, `Route ${req.method} ${req.originalUrl} not found`),
  );
}

function csrfHeaderCheck(req, res, next) {
  const method = (req.method || "").toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) return next();
  const xhr = req.get("X-Requested-With");
  if (String(xhr || "").toLowerCase() === "xmlhttprequest") return next();
  return next(
    new ExpressError(403, "Invalid request. Refresh and try again."),
  );
}

module.exports = {
  adminLoginBruteForce,
  recordAdminLoginFailed,
  clearAdminLoginFailed,
  requireAdminAuth,
  requireAdminAuthOr404ForUnknown,
  csrfHeaderCheck,
};
