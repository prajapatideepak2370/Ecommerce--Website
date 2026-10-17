const requestOriginCheck = require("../middleware/csrf");

describe("request origin check", () => {
  const middleware = requestOriginCheck(["https://shop.tryvoxel.test"]);

  function run(method, headers = {}) {
    const req = {
      method,
      get: (name) => headers[name.toLowerCase()],
    };
    const next = jest.fn();
    middleware(req, {}, next);
    return next;
  }

  it("allows safe methods without an origin", () => {
    const next = run("GET");

    expect(next).toHaveBeenCalledWith();
  });

  it("allows unsafe requests from an approved origin", () => {
    const next = run("POST", { origin: "https://shop.tryvoxel.test" });

    expect(next).toHaveBeenCalledWith();
  });

  it("rejects unsafe requests from an unapproved origin", () => {
    const next = run("POST", { origin: "https://attacker.test" });

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 403 }),
    );
  });

  it("allows originless JSON API clients", () => {
    const next = run("POST", { "content-type": "application/json" });

    expect(next).toHaveBeenCalledWith();
  });

  it("allows originless XMLHttpRequest API clients", () => {
    const next = run("POST", { "x-requested-with": "XMLHttpRequest" });

    expect(next).toHaveBeenCalledWith();
  });

  it("rejects originless form submissions", () => {
    const next = run("POST", {
      "content-type": "application/x-www-form-urlencoded",
    });

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 403 }),
    );
  });
});
