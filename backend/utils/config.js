function assertProductionSessionSecrets(env = process.env) {
  if (env.NODE_ENV !== "production") return;

  const secret = env.SECRET_KEY || "";
  const adminSecret = env.ADMIN_SESSION_SECRET || "";
  const isUsable = (value) =>
    value.length >= 32 &&
    !/[<>]/.test(value) &&
    !value.includes("dev-secret-change-me-please");

  if (!isUsable(secret)) {
    throw new Error("Production requires a SECRET_KEY of at least 32 characters.");
  }
  if (!isUsable(adminSecret)) {
    throw new Error(
      "Production requires an ADMIN_SESSION_SECRET of at least 32 characters.",
    );
  }
  if (secret === adminSecret) {
    throw new Error(
      "ADMIN_SESSION_SECRET must be different from SECRET_KEY in production.",
    );
  }
}

module.exports = { assertProductionSessionSecrets };
