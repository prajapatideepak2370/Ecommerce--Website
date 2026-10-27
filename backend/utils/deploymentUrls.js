const PRODUCTION_FRONTEND_URL = "https://trivoxel3d-mu.vercel.app";
const GOOGLE_CALLBACK_PATH = "/api/v1/users/auth/google/callback";
const { isProductionEnvironment } = require("./runtimeEnvironment");

function isLoopbackUrl(value) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    return (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "[::1]"
    );
  } catch {
    return false;
  }
}

function resolveProductionUrl(value, fallback, name) {
  const configured = String(value || "").trim();
  if (!configured) return fallback;

  let url;
  try {
    url = new URL(configured);
  } catch {
    url = null;
  }

  if (
    !url ||
    url.protocol !== "https:" ||
    isLoopbackUrl(configured)
  ) {
    console.warn(
      `[api] Ignoring invalid production ${name}; using the deployed URL.`,
    );
    return fallback;
  }

  return configured;
}

function getFrontendUrl(env = process.env) {
  if (!isProductionEnvironment(env)) {
    return env.FRONTEND_URL || "http://localhost:5173";
  }
  return resolveProductionUrl(
    env.FRONTEND_URL,
    PRODUCTION_FRONTEND_URL,
    "FRONTEND_URL",
  );
}

function getGoogleCallbackUrl(env = process.env) {
  if (!isProductionEnvironment(env)) {
    return env.GOOGLE_CALLBACK_URL || "";
  }
  return resolveProductionUrl(
    env.GOOGLE_CALLBACK_URL,
    `${PRODUCTION_FRONTEND_URL}${GOOGLE_CALLBACK_PATH}`,
    "GOOGLE_CALLBACK_URL",
  );
}

module.exports = {
  getFrontendUrl,
  getGoogleCallbackUrl,
  PRODUCTION_FRONTEND_URL,
};
