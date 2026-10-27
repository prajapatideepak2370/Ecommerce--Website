const {
  getFrontendUrl,
  getGoogleCallbackUrl,
  PRODUCTION_FRONTEND_URL,
} = require("../utils/deploymentUrls");

describe("production deployment URLs", () => {
  it("replaces localhost frontend and OAuth URLs with deployed URLs", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation();

    try {
      const env = {
        NODE_ENV: "production",
        FRONTEND_URL: "http://localhost:5173",
        GOOGLE_CALLBACK_URL:
          "http://localhost:5000/api/v1/users/auth/google/callback",
      };

      expect(getFrontendUrl(env)).toBe(PRODUCTION_FRONTEND_URL);
      expect(getGoogleCallbackUrl(env)).toBe(
        `${PRODUCTION_FRONTEND_URL}/api/v1/users/auth/google/callback`,
      );
      expect(warn).toHaveBeenCalledTimes(2);
    } finally {
      warn.mockRestore();
    }
  });

  it("uses production URL defaults when values are missing", () => {
    const env = { NODE_ENV: "production" };

    expect(getFrontendUrl(env)).toBe(PRODUCTION_FRONTEND_URL);
    expect(getGoogleCallbackUrl(env)).toBe(
      `${PRODUCTION_FRONTEND_URL}/api/v1/users/auth/google/callback`,
    );
  });

  it("uses deployed URLs when running on Render despite a development NODE_ENV", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation();

    try {
      const env = {
        NODE_ENV: "development",
        RENDER: "true",
        FRONTEND_URL: "http://localhost:5173",
        GOOGLE_CALLBACK_URL:
          "http://localhost:5000/api/v1/users/auth/google/callback",
      };

      expect(getFrontendUrl(env)).toBe(PRODUCTION_FRONTEND_URL);
      expect(getGoogleCallbackUrl(env)).toBe(
        `${PRODUCTION_FRONTEND_URL}/api/v1/users/auth/google/callback`,
      );
    } finally {
      warn.mockRestore();
    }
  });

  it("preserves configured HTTPS production URLs", () => {
    const env = {
      NODE_ENV: "production",
      FRONTEND_URL: "https://shop.example",
      GOOGLE_CALLBACK_URL: "https://api.example/oauth/callback",
    };

    expect(getFrontendUrl(env)).toBe("https://shop.example");
    expect(getGoogleCallbackUrl(env)).toBe("https://api.example/oauth/callback");
  });

  it("preserves local URLs outside production", () => {
    const env = {
      NODE_ENV: "development",
      FRONTEND_URL: "http://localhost:5173",
      GOOGLE_CALLBACK_URL: "http://localhost:5000/callback",
    };

    expect(getFrontendUrl(env)).toBe("http://localhost:5173");
    expect(getGoogleCallbackUrl(env)).toBe("http://localhost:5000/callback");
  });
});
