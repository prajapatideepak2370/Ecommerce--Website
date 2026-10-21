const request = require("supertest");
const serverlessHandler = require("../server");
const { buildApp } = require("../appFactory");

describe("Vercel API entrypoint", () => {
  it("exports a request handler without starting a listener", () => {
    expect(typeof serverlessHandler).toBe("function");
  });

  it("returns a descriptive service error when database configuration is absent", async () => {
    const originalDbUrl = process.env.ATLASDB_URL;
    process.env.ATLASDB_URL = "";

    const response = {
      headersSent: false,
      status: jest.fn(function setStatus(status) {
        this.statusCode = status;
        return this;
      }),
      json: jest.fn(function sendJson(body) {
        this.body = body;
        return this;
      }),
    };

    try {
      await serverlessHandler({}, response);
      expect(response.statusCode).toBe(503);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 503,
          message: "Service temporarily unavailable",
        },
      });
    } finally {
      if (originalDbUrl === undefined) {
        delete process.env.ATLASDB_URL;
      } else {
        process.env.ATLASDB_URL = originalDbUrl;
      }
    }
  });

  it("serves the health endpoint and keeps API misses in the API", async () => {
    const collection = { createIndex: jest.fn().mockResolvedValue("ok") };
    const client = {
      db: jest.fn(() => ({
        collection: jest.fn(() => collection),
      })),
    };
    const app = buildApp(Promise.resolve(client));
    app.set("dbState", "connected");

    const health = await request(app).get("/api/v1/health");
    expect(health.status).toBe(200);
    expect(health.body.success).toBe(true);
    expect(health.body.data.dbState).toBe("connected");

    const missingRoute = await request(app).get("/api/v1/not-a-route");
    expect(missingRoute.status).toBe(404);
    expect(missingRoute.body.success).toBe(false);
  });
});
