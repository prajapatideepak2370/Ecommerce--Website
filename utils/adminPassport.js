const { Passport } = require("passport");
const LocalStrategy = require("passport-local");
const User = require("../models/User");

const adminPassport = new Passport();

const GENERIC_INVALID = "Invalid credentials.";

async function adminLocalVerifier(usernameOrEmail, password, done) {
  try {
    const rawId = String(usernameOrEmail || "").trim().toLowerCase();
    if (!rawId || !password) {
      return done(null, false, { message: GENERIC_INVALID });
    }

    let query;
    if (rawId.includes("@")) {
      query = { email: rawId };
    } else {
      query = { username: rawId };
    }

    const user = await User.findOne(query).select(
      "_id name email username role isBlocked hash salt",
    );
    if (!user) {
      return done(null, false, { message: GENERIC_INVALID });
    }

    if (user.role !== "admin") {
      return done(null, false, { message: GENERIC_INVALID });
    }
    if (user.isBlocked) {
      return done(null, false, { message: GENERIC_INVALID });
    }

    const authenticate = User.authenticate();
    const normalizedUsername = user.username;
    authenticate(normalizedUsername, password, (err, result) => {
      if (err) return done(err);
      if (!result || result === false) {
        return done(null, false, { message: GENERIC_INVALID });
      }
      if (result.role !== "admin") {
        return done(null, false, { message: GENERIC_INVALID });
      }
      if (result.isBlocked) {
        return done(null, false, { message: GENERIC_INVALID });
      }
      return done(null, result);
    });
  } catch (err) {
    return done(err);
  }
}

adminPassport.use(
  new LocalStrategy(
    { usernameField: "username", passwordField: "password" },
    adminLocalVerifier,
  ),
);

adminPassport.serializeUser((user, done) => {
  done(null, String(user._id));
});

adminPassport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id)
      .select("_id name email username role isBlocked")
      .lean();
    if (!user) return done(null, false);
    if (user.role !== "admin" || user.isBlocked) return done(null, false);
    return done(null, user);
  } catch (err) {
    return done(err);
  }
});

module.exports = { adminPassport, GENERIC_INVALID };
