const requestOriginCheck = require("../middleware/csrf");
const { assertProductionSessionSecrets } = require("../utils/config");

function runOriginCheck({
  method = "POST",
  origin,
  contentType,
  requestedWith,
} = {}) {
  const req = {
    method,
    get: (name) =>
      ({
        Origin: origin,
        "Content-Type": contentType,
        "X-Requested-With": requestedWith,
      })[name],
  };
  const next = jest.fn();
  requestOriginCheck(["https://store.example", "https://admin.example"])(
    req,
    {},
    next,
  );
  return next;
}

describe("request origin validation", () => {
  it("accepts an allowed browser origin", () => {
    expect(
      runOriginCheck({ origin: "https://store.example" }),
    ).toHaveBeenCalledWith();
  });

  it("rejects an untrusted origin", () => {
    const next = runOriginCheck({ origin: "https://attacker.example" });

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 403 }),
    );
  });

  it("rejects form submissions without an origin", () => {
    const next = runOriginCheck({
      contentType: "application/x-www-form-urlencoded",
    });

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 403 }),
    );
  });

  it("allows JSON API clients without an Origin header", () => {
    expect(
      runOriginCheck({ contentType: "application/json; charset=utf-8" }),
    ).toHaveBeenCalledWith();
  });
});

describe("production session secrets", () => {
  const secret = "a".repeat(32);

  it("allows distinct, sufficiently long production secrets", () => {
    expect(() =>
      assertProductionSessionSecrets({
        NODE_ENV: "production",
        SECRET_KEY: secret,
        ADMIN_SESSION_SECRET: "b".repeat(32),
      }),
    ).not.toThrow();
  });

  it("rejects missing, weak, placeholder, or shared production secrets", () => {
    const cases = [
      { SECRET_KEY: secret },
      {
        SECRET_KEY: "short",
        ADMIN_SESSION_SECRET: "b".repeat(32),
      },
      {
        SECRET_KEY: "<long-random-string-at-least-32-chars>",
        ADMIN_SESSION_SECRET: "b".repeat(32),
      },
      {
        SECRET_KEY: secret,
        ADMIN_SESSION_SECRET: "admin-dev-secret-change-me-please",
      },
      { SECRET_KEY: secret, ADMIN_SESSION_SECRET: secret },
    ];

    cases.forEach((values) => {
      expect(() =>
        assertProductionSessionSecrets({
          NODE_ENV: "production",
          ...values,
        }),
      ).toThrow();
    });
  });

  it("does not require production secrets outside production", () => {
    expect(() =>
      assertProductionSessionSecrets({ NODE_ENV: "test" }),
    ).not.toThrow();
  });

  it("requires production secrets on Render even when NODE_ENV is development", () => {
    expect(() =>
      assertProductionSessionSecrets({
        NODE_ENV: "development",
        RENDER: "true",
      }),
    ).toThrow("Production requires a SECRET_KEY");
  });
});
