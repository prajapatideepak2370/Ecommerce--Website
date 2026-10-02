const User = require("../models/User");
const { sendSuccess } = require("../utils/helpers");
const { GENERIC_INVALID } = require("../utils/adminPassport");
const ExpressError = require("../utils/ExpressError");
const {
  auditLoginSuccess,
  auditLoginFail,
  auditLogout,
} = require("../utils/adminAudit");
const {
  recordAdminLoginFailed,
  clearAdminLoginFailed,
} = require("../middleware/adminAuth");

const ADMIN_COOKIE_NAME = "tryvoxel.admin.sid";

function _isProd() {
  return process.env.NODE_ENV === "production";
}

function _sanitizeAdmin(u) {
  if (!u) return null;
  const obj = typeof u.toObject === "function" ? u.toObject() : { ...u };
  delete obj.hash;
  delete obj.salt;
  delete obj.addresses;
  delete obj.phone;
  return {
    _id: obj._id,
    name: obj.name,
    email: obj.email,
    username: obj.username,
    role: obj.role,
    isBlocked: Boolean(obj.isBlocked),
  };
}

module.exports.login = async (req, res, next) => {
  if (!req.user) {
    recordAdminLoginFailed(req);
    await auditLoginFail(req);
    return next(new ExpressError(401, GENERIC_INVALID));
  }
  if (req.user.role !== "admin" || req.user.isBlocked) {
    recordAdminLoginFailed(req);
    await auditLoginFail(req);
    return next(new ExpressError(401, GENERIC_INVALID));
  }
  clearAdminLoginFailed(req);
  await auditLoginSuccess(req);
  sendSuccess(res, _sanitizeAdmin(req.user));
};

module.exports.logout = async (req, res, next) => {
  await auditLogout(req);
  await new Promise((resolve, reject) => {
    req.logout((err) => (err ? reject(err) : resolve()));
  });
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie(ADMIN_COOKIE_NAME, {
      httpOnly: true,
      sameSite: "strict",
      secure: _isProd(),
    });
    sendSuccess(res, { loggedOut: true });
  });
};

module.exports.me = async (req, res, next) => {
  if (!req.user) return next(new ExpressError(401, GENERIC_INVALID));
  const user = await User.findById(req.user._id)
    .select("_id name email username role isBlocked")
    .lean();
  if (!user || user.role !== "admin" || user.isBlocked) {
    return next(new ExpressError(401, GENERIC_INVALID));
  }
  sendSuccess(res, _sanitizeAdmin(user));
};

module.exports.ADMIN_COOKIE_NAME = ADMIN_COOKIE_NAME;
