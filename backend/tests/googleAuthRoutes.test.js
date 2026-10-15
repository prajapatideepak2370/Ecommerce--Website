const request = require("supertest");
const { makeTestApp, teardown } = require("./helpers/testApp");

let app;

beforeAll(async () => {
  app = await makeTestApp();
});

afterAll(async () => {
  await teardown();
});

describe("Google OAuth routes", () => {
  it("starts Google OAuth with session-backed state and PKCE", async () => {
    const response = await request.agent(app).get("/api/v1/users/auth/google");

    expect(response.statusCode).toBe(302);
    const authorizationUrl = new URL(response.headers.location);
    expect(authorizationUrl.origin).toBe("https://accounts.google.com");
    expect(authorizationUrl.searchParams.get("response_type")).toBe("code");
    expect(authorizationUrl.searchParams.get("scope")).toContain("email");
    expect(authorizationUrl.searchParams.get("state")).toBeTruthy();
    expect(authorizationUrl.searchParams.get("code_challenge")).toBeTruthy();
    expect(authorizationUrl.searchParams.get("code_challenge_method")).toBe(
      "S256",
    );
    expect(response.headers["set-cookie"]).toBeDefined();
  });

  it("rejects a callback with invalid OAuth state", async () => {
    const browser = request.agent(app);
    const start = await browser.get("/api/v1/users/auth/google");
    const authorizationUrl = new URL(start.headers.location);
    const callback = await browser.get(
      `/api/v1/users/auth/google/callback?code=fake-code&state=${encodeURIComponent(
        `${authorizationUrl.searchParams.get("state")}-tampered`,
      )}`,
    );

    expect(callback.statusCode).toBe(302);
    const errorUrl = new URL(callback.headers.location);
    expect(errorUrl.pathname).toBe("/login");
    expect(errorUrl.searchParams.get("google_error")).toBe(
      "authentication_failed",
    );
  });
});
