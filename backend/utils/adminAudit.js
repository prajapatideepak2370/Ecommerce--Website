const AdminAuditLog = require("../models/AdminAuditLog");
const _ = require("lodash");

function _computeDiff(before, after) {
  if (before == null || after == null) return null;
  try {
    const b = JSON.parse(JSON.stringify(before));
    const a = JSON.parse(JSON.stringify(after));
    const keys = new Set([...Object.keys(b || {}), ...Object.keys(a || {})]);
    const diff = {};
    let hasDiff = false;
    keys.forEach((k) => {
      const bv = b[k];
      const av = a[k];
      if (_.isEqual(bv, av)) return;
      diff[k] = { before: bv, after: av };
      hasDiff = true;
    });
    return hasDiff ? diff : null;
  } catch (_e) {
    return null;
  }
}

async function audit(
  req,
  action,
  entityType,
  entityId,
  before,
  after,
  reason,
  metadata,
) {
  try {
    const doc = new AdminAuditLog({
      adminId: req && req.user && req.user._id ? req.user._id : null,
      adminUsername:
        (req && req.user && (req.user.username || req.user.email)) || "",
      action,
      entityType,
      entityId: String(entityId || ""),
      beforeSnapshot: before != null ? before : null,
      afterSnapshot: after != null ? after : null,
      diff: _computeDiff(before, after),
      reason: typeof reason === "string" ? reason : "",
      ip:
        (req &&
          (req.ip ||
            (req.headers &&
              (req.headers["x-forwarded-for"] || req.headers["x-real-ip"])))) ||
        "",
      userAgent: (req && req.headers && req.headers["user-agent"]) || "",
      metadata: metadata || {},
    });
    await doc.save();
    return doc;
  } catch (err) {
    console.warn("[ADMIN AUDIT WRITE FAIL:", err.message);
    return null;
  }
}

async function auditLoginSuccess(req) {
  return audit(req, "login.success", "auth", "(login)", null, null, "");
}
async function auditLoginFail(req) {
  return audit(req, "login.fail", "auth", "(login)", null, null, "");
}
async function auditLogout(req) {
  return audit(req, "logout", "auth", "(logout)", null, null, "");
}

module.exports = {
  audit,
  auditLoginSuccess,
  auditLoginFail,
  auditLogout,
};
