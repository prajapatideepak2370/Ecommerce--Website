const ExpressError = require("../utils/ExpressError");
const { sendSuccess } = require("../utils/helpers");
const User = require("../models/user");
const _ = require("lodash");
const crypto = require("crypto");
const emailService = require("../utils/email");
const { isProductionEnvironment } = require("../utils/runtimeEnvironment");

const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;
const GENERIC_RESET_MESSAGE =
  "If an account exists for this email, a password reset link will be sent.";

const sanitizeUser = (userDoc) => {
  if (!userDoc) return null;
  const obj = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  delete obj.hash;
  delete obj.salt;
  delete obj.resetTokenHash;
  delete obj.resetTokenExpiresAt;
  delete obj.authVersion;
  return obj;
};

module.exports.register = async (req, res, next) => {
  const { name, username, email, password, phone } = req.body;

  const dup = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
  }).select("_id email username");
  if (dup) {
    if (String(dup.email).toLowerCase() === String(email).toLowerCase()) {
      return next(
        new ExpressError(409, "A user with this email already exists."),
      );
    }
    return next(new ExpressError(409, "This username is already taken."));
  }

  const user = new User({
    name,
    email: email.toLowerCase(),
    username: username.toLowerCase(),
    phone: phone || "",
    role: "customer",
    isBlocked: false,
  });

  const registered = await User.register(user, password);

  await new Promise((resolve, reject) => {
    req.login(registered, (err) => (err ? reject(err) : resolve()));
  });

  sendSuccess(res, sanitizeUser(registered), 201);
};

module.exports.login = async (req, res, next) => {
  if (!req.user) return next(new ExpressError(401, "Login failed."));
  sendSuccess(res, sanitizeUser(req.user));
};

module.exports.logout = async (req, res, next) => {
  await new Promise((resolve, reject) => {
    req.logout((err) => (err ? reject(err) : resolve()));
  });
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie("tryvoxel.sid", {
      httpOnly: true,
      sameSite: isProductionEnvironment() ? "none" : "lax",
      secure: isProductionEnvironment(),
    });
    sendSuccess(res, { loggedOut: true });
  });
};

module.exports.getMe = async (req, res, next) => {
  if (!req.user) return next(new ExpressError(401, "Not authenticated"));
  const user = await User.findById(req.user._id)
    .select("-hash -salt -resetTokenHash -resetTokenExpiresAt -authVersion")
    .lean();
  sendSuccess(res, user);
};

module.exports.updateProfile = async (req, res, next) => {
  const allowed = _.pick(req.body, ["name", "email", "phone"]);
  if (allowed.email) allowed.email = allowed.email.toLowerCase();

  if (allowed.email && allowed.email !== req.user.email) {
    const dup = await User.findOne({
      email: allowed.email,
      _id: { $ne: req.user._id },
    });
    if (dup)
      return next(
        new ExpressError(409, "A user with this email already exists."),
      );
  }

  const updated = await User.findByIdAndUpdate(
    req.user._id,
    { $set: allowed },
    {
      returnDocument: "after",
      runValidators: true,
      select: "-hash -salt -resetTokenHash -resetTokenExpiresAt -authVersion",
    },
  ).lean();
  sendSuccess(res, updated);
};

module.exports.getAddresses = async (req, res) => {
  const user = await User.findById(req.user._id, "addresses").lean();
  sendSuccess(res, (user && user.addresses) || []);
};

module.exports.changePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  if (currentPassword === newPassword) {
    return next(
      new ExpressError(
        400,
        "Choose a new password different from your current password.",
      ),
    );
  }

  const user = await User.findById(req.user._id);
  if (!user)
    return next(
      new ExpressError(401, "Authentication required. Please log in."),
    );

  user.authVersion = (user.authVersion || 0) + 1;
  try {
    await user.changePassword(currentPassword, newPassword);
  } catch (err) {
    if (err.name === "IncorrectPasswordError") {
      return next(new ExpressError(400, "Current password is incorrect."));
    }
    if (err.name === "NoSaltValueStoredError") {
      return next(
        new ExpressError(
          400,
          "This account has no password set. Use Forgot Password to set one.",
        ),
      );
    }
    throw err;
  }

  await new Promise((resolve, reject) => {
    req.login(user, (err) => (err ? reject(err) : resolve()));
  });

  sendSuccess(res, { message: "Password updated successfully." });
};

module.exports.forgotPassword = async (req, res, next) => {
  if (!emailService.isConfigured()) {
    return next(
      new ExpressError(
        503,
        "Password reset email is not configured. Please contact support.",
      ),
    );
  }

  const email = req.body.email.toLowerCase();
  const user = await User.findOne({ email });
  if (!user) {
    return sendSuccess(res, { message: GENERIC_RESET_MESSAGE });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        resetTokenHash: tokenHash,
        resetTokenExpiresAt: expiresAt,
      },
    },
  );

  try {
    await emailService.sendPasswordResetEmail(user.email, token);
  } catch (err) {
    await User.updateOne(
      { _id: user._id, resetTokenHash: tokenHash },
      { $unset: { resetTokenHash: 1, resetTokenExpiresAt: 1 } },
    );
    console.error(
      "[password-reset] Email delivery failed:",
      err.code || err.name || "unknown error",
    );
  }

  sendSuccess(res, { message: GENERIC_RESET_MESSAGE });
};

module.exports.resetPassword = async (req, res, next) => {
  const tokenHash = crypto
    .createHash("sha256")
    .update(req.body.token)
    .digest("hex");
  const user = await User.findOne({
    resetTokenHash: tokenHash,
    resetTokenExpiresAt: { $gt: new Date() },
  }).select("+resetTokenHash +resetTokenExpiresAt");

  if (!user) {
    return next(
      new ExpressError(
        400,
        "This password reset link is invalid or has expired.",
      ),
    );
  }

  await user.setPassword(req.body.newPassword);
  const updated = await User.findOneAndUpdate(
    {
      _id: user._id,
      resetTokenHash: tokenHash,
      resetTokenExpiresAt: { $gt: new Date() },
    },
    {
      $set: {
        hash: user.hash,
        salt: user.salt,
        resetTokenHash: null,
        resetTokenExpiresAt: null,
      },
      $inc: { authVersion: 1 },
    },
    { new: true, runValidators: true },
  );

  if (!updated) {
    return next(
      new ExpressError(
        400,
        "This password reset link is invalid or has expired.",
      ),
    );
  }

  sendSuccess(res, {
    message: "Password reset successfully. You can now log in.",
  });
};

module.exports.addAddress = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ExpressError(401, "Not authenticated");

  const nextAddress = { ...req.body };
  if (req.body.isDefault) {
    user.addresses.forEach((a) => {
      a.isDefault = false;
    });
    nextAddress.isDefault = true;
  } else {
    nextAddress.isDefault = !user.addresses.some((a) => a.isDefault);
  }

  user.addresses.push(nextAddress);
  await user.save();

  const newAddr = user.addresses[user.addresses.length - 1];
  sendSuccess(res, newAddr, 201);
};

module.exports.updateAddress = async (req, res, next) => {
  const { addressId } = req.params;
  const user = await User.findById(req.user._id);
  if (!user) throw new ExpressError(401, "Not authenticated");

  const addr = user.addresses.id(addressId);
  if (!addr) return next(new ExpressError(404, "Address not found"));

  if (req.body.isDefault) {
    user.addresses.forEach((a) => {
      a.isDefault = false;
    });
  }

  Object.assign(addr, req.body);
  if (user.addresses.length > 0 && !user.addresses.some((a) => a.isDefault)) {
    addr.isDefault = true;
  }
  await user.save();

  const saved = await User.findById(req.user._id, {
    addresses: { $elemMatch: { _id: addressId } },
  }).lean();
  sendSuccess(
    res,
    (saved && saved.addresses && saved.addresses[0]) || addr.toObject(),
  );
};

module.exports.deleteAddress = async (req, res, next) => {
  const { addressId } = req.params;
  const user = await User.findById(req.user._id);
  if (!user) throw new ExpressError(401, "Not authenticated");

  const idx = user.addresses.findIndex(
    (a) => String(a._id) === String(addressId),
  );
  if (idx === -1) return next(new ExpressError(404, "Address not found"));

  user.addresses.splice(idx, 1);

  if (user.addresses.length > 0 && !user.addresses.some((a) => a.isDefault)) {
    user.addresses[0].isDefault = true;
  }

  await user.save();
  sendSuccess(res, { deleted: true, id: addressId });
};
