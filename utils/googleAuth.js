const User = require("../models/User");

class GoogleAuthError extends Error {
  constructor(code) {
    super(code);
    this.name = "GoogleAuthError";
    this.code = code;
  }
}

function getGoogleProfileData(profile) {
  const emailEntry = profile?.emails?.find((entry) => entry?.value);
  const email = emailEntry?.value?.trim().toLowerCase();
  const emailVerified =
    profile?._json?.email_verified === true ||
    emailEntry?.verified === true ||
    emailEntry?.verified === "true";

  if (!profile?.id || !email || !emailVerified) {
    throw new GoogleAuthError("email_not_verified");
  }

  return {
    googleId: String(profile.id),
    email,
    name: profile.displayName?.trim() || email.split("@")[0],
    avatar: profile.photos?.[0]?.value || "",
  };
}

function assertCustomerAccount(user) {
  if (user.role !== "customer") {
    throw new GoogleAuthError("account_conflict");
  }
  if (user.isBlocked) {
    throw new GoogleAuthError("account_blocked");
  }
  return user;
}

async function findAvailableUsername(googleId) {
  const base = `g${googleId.replace(/[^a-z0-9]/gi, "").slice(0, 36)}`;
  let username = base;
  let suffix = 1;

  while (await User.findOne({ username })) {
    suffix += 1;
    username = `${base}${suffix}`;
  }

  return username;
}

async function resolveGoogleUser(profile) {
  const identity = getGoogleProfileData(profile);
  let user = await User.findOne({ googleId: identity.googleId });

  if (user) {
    assertCustomerAccount(user);
    if (!user.avatar && identity.avatar) {
      user.avatar = identity.avatar;
      await user.save();
    }
    return user;
  }

  user = await User.findOne({ email: identity.email });
  if (user) {
    assertCustomerAccount(user);
    if (user.googleId && user.googleId !== identity.googleId) {
      throw new GoogleAuthError("account_conflict");
    }

    if (!user.googleId) {
      user.googleId = identity.googleId;
      if (identity.avatar && !user.avatar) user.avatar = identity.avatar;
      await user.save();
    }
    return user;
  }

  user = new User({
    ...identity,
    username: await findAvailableUsername(identity.googleId),
    role: "customer",
    isBlocked: false,
    phone: "",
    authProvider: "google",
  });

  try {
    await user.save();
    return user;
  } catch (error) {
    if (error?.code !== 11000) throw error;

    const concurrentUser = await User.findOne({
      $or: [{ googleId: identity.googleId }, { email: identity.email }],
    });
    if (concurrentUser) {
      assertCustomerAccount(concurrentUser);
      if (concurrentUser.googleId === identity.googleId) return concurrentUser;
      if (concurrentUser.email === identity.email) {
        if (concurrentUser.googleId) {
          throw new GoogleAuthError("account_conflict");
        }
        if (!concurrentUser.googleId) {
          concurrentUser.googleId = identity.googleId;
          if (identity.avatar && !concurrentUser.avatar) {
            concurrentUser.avatar = identity.avatar;
          }
          await concurrentUser.save();
        }
        return concurrentUser;
      }
    }
    throw error;
  }
}

module.exports = { GoogleAuthError, resolveGoogleUser };
