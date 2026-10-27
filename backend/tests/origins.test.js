const { createOriginMatcher, parseOrigins } = require("../utils/origins");
const requestOriginCheck = require("../middleware/csrf");

describe("parseOrigins", () => {
  it("splits, trims, drops blanks, and strips trailing slashes", () => {
    expect(
      parseOrigins(" https://a.example , https://b.example/ ,, "),
    ).toEqual(["https://a.example", "https://b.example"]);
  });

  it("returns an empty list for empty input", () => {
    expect(parseOrigins("")).toEqual([]);
    expect(parseOrigins(undefined)).toEqual([]);
  });
});

describe("createOriginMatcher", () => {
  const matcher = createOriginMatcher([
    "https://shop.example",
    "https://*.vercel.app",
  ]);

  it("matches exact origins", () => {
    expect(matcher.isAllowed("https://shop.example")).toBe(true);
  });

  it("matches wildcard subdomain patterns", () => {
    expect(matcher.isAllowed("https://tryvoxel.vercel.app")).toBe(true);
    expect(
      matcher.isAllowed("https://tryvoxel-git-main-team.vercel.app"),
    ).toBe(true);
  });

  it("is case-insensitive and tolerates a trailing slash", () => {
    expect(matcher.isAllowed("HTTPS://Shop.Example/")).toBe(true);
  });

  it("rejects unlisted, suffix-spoofed, and missing origins", () => {
    expect(matcher.isAllowed("https://attacker.example")).toBe(false);
    expect(matcher.isAllowed("https://tryvoxel.vercel.app.attacker.example")).toBe(
      false,
    );
    expect(matcher.isAllowed("https://notvercel.app")).toBe(false);
    expect(matcher.isAllowed(undefined)).toBe(false);
    expect(matcher.isAllowed("")).toBe(false);
  });

  it("reflects the callback style used by the cors middleware", () => {
    const callback = jest.fn();
    matcher.matcher("https://shop.example", callback);
    expect(callback).toHaveBeenCalledWith(null, true);

    callback.mockClear();
    matcher.matcher("https://attacker.example", callback);
    expect(callback).toHaveBeenCalledWith(null, false);

    callback.mockClear();
    matcher.matcher(undefined, callback);
    expect(callback).toHaveBeenCalledWith(null, true);
  });
});

describe("requestOriginCheck with a wildcard allowlist", () => {
  const allowedOrigins = createOriginMatcher(["https://*.vercel.app"]);

  function run({ origin, method = "POST" } = {}) {
    const req = {
      method,
      get: (name) => ({ Origin: origin, "Content-Type": "application/json" })[name],
    };
    const next = jest.fn();
    requestOriginCheck(allowedOrigins.isAllowed)(req, {}, next);
    return next;
  }

  it("allows a mutating request from a preview deployment", () => {
    expect(
      run({ origin: "https://tryvoxel-git-main.vercel.app" }),
    ).toHaveBeenCalledWith();
  });

  it("still rejects a mutating request from an untrusted origin", () => {
    const next = run({ origin: "https://attacker.example" });
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 403 }),
    );
  });
});
