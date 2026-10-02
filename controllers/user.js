const ExpressError = require("../utils/ExpressError");
const { sendSuccess } = require("../utils/helpers");
const User = require("../models/User");
const _ = require("lodash");

const sanitizeUser = (userDoc) => {
  if (!userDoc) return null;
  const obj = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  delete obj.hash;
  delete obj.salt;
  return obj;
};

module.exports.register = async (req, res, next) => {
  const { name, username, email, password, phone } = req.body;

  const dup = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
  }).select("_id email username");
  if (dup) {
    if (String(dup.email).toLowerCase() === String(email).toLowerCase()) {
      return next(new ExpressError(409, "A user with this email already exists."));
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
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    });
    sendSuccess(res, { loggedOut: true });
  });
};

module.exports.getMe = async (req, res, next) => {
  if (!req.user) return next(new ExpressError(401, "Not authenticated"));
  const user = await User.findById(req.user._id).select("-hash -salt").lean();
  sendSuccess(res, user);
};

module.exports.updateProfile = async (req, res, next) => {
  const allowed = _.pick(req.body, ["name", "email", "phone"]);
  if (allowed.email) allowed.email = allowed.email.toLowerCase();

  if (allowed.email && allowed.email !== req.user.email) {
    const dup = await User.findOne({ email: allowed.email, _id: { $ne: req.user._id } });
    if (dup) return next(new ExpressError(409, "A user with this email already exists."));
  }

  const updated = await User.findByIdAndUpdate(
    req.user._id,
    { $set: allowed },
    { returnDocument: "after", runValidators: true, select: "-hash -salt" },
  ).lean();
  sendSuccess(res, updated);
};

module.exports.getAddresses = async (req, res) => {
  const user = await User.findById(req.user._id, "addresses").lean();
  sendSuccess(res, (user && user.addresses) || []);
};

module.exports.addAddress = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ExpressError(401, "Not authenticated");

  const nextAddress = { ...req.body };
  const hasExistingDefault = user.addresses.some((a) => a.isDefault);

  if (req.body.isDefault && !hasExistingDefault) {
    user.addresses.forEach((a) => {
      a.isDefault = false;
    });
    nextAddress.isDefault = true;
  } else {
    nextAddress.isDefault = false;
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
  await user.save();

  const saved = await User.findById(
    req.user._id,
    { addresses: { $elemMatch: { _id: addressId } } },
  ).lean();
  sendSuccess(res, (saved && saved.addresses && saved.addresses[0]) || addr.toObject());
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
