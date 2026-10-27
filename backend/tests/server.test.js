const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const { buildApp } = require("../appFactory");

describe("Express server startup", () => {
  let startServer;
  let shutdownServer;

  it("does not open a listener when imported", () => {
    const listen = jest.spyOn(express.application, "listen");
    ({ startServer, shutdownServer } = require("../server"));

    expect(typeof startServer).toBe("function");
    expect(listen).not.toHaveBeenCalled();
    listen.mockRestore();
  });

  it("binds the HTTP server to all interfaces", async () => {
    const originalDbUrl = process.env.ATLASDB_URL;
    const originalPort = process.env.PORT;
    const originalHost = process.env.HOST;
    const listen = jest.spyOn(express.application, "listen");
    const listeners = {};
    const httpServer = {
      listening: false,
      once: jest.fn((event, callback) => {
        listeners[event] = callback;
        return httpServer;
      }),
      close: jest.fn((callback) => callback()),
    };

    process.env.ATLASDB_URL = "mongodb://localhost/test";
    process.env.PORT = "5000";
    process.env.HOST = "localhost";
    const mongoClient = {
      db: jest.fn(() => ({
        collection: jest.fn(() => ({
          createIndex: jest.fn().mockResolvedValue("ok"),
        })),
      })),
    };
    jest.spyOn(mongoose, "connect").mockResolvedValue(mongoose.connection);
    jest
      .spyOn(mongoose.connection, "asPromise")
      .mockResolvedValue({ getClient: jest.fn(() => mongoClient) });
    jest.spyOn(mongoose, "disconnect").mockResolvedValue();
    listen.mockImplementation((port, hostname) => {
      setImmediate(() => {
        httpServer.listening = true;
        listeners.listening();
      });
      return httpServer;
    });

    let serverStarted = false;
    try {
      await startServer();
      serverStarted = true;
      expect(listen).toHaveBeenCalledWith(5000, "0.0.0.0");
    } finally {
      if (serverStarted) await shutdownServer("test");
      jest.restoreAllMocks();
      if (originalDbUrl === undefined) delete process.env.ATLASDB_URL;
      else process.env.ATLASDB_URL = originalDbUrl;
      if (originalPort === undefined) delete process.env.PORT;
      else process.env.PORT = originalPort;
      if (originalHost === undefined) delete process.env.HOST;
      else process.env.HOST = originalHost;
    }
  });

  it("fails startup clearly when the database URL is missing", async () => {
    const originalDbUrl = process.env.ATLASDB_URL;
    const errorLog = jest.spyOn(console, "error").mockImplementation();
    process.env.ATLASDB_URL = "";

    try {
      await expect(startServer()).rejects.toThrow(
        "ATLASDB_URL is not set. Check your environment.",
      );
      expect(errorLog).toHaveBeenCalledWith(
        "[api] Server startup failed",
        expect.objectContaining({ errorName: "Error" }),
      );
    } finally {
      errorLog.mockRestore();
      if (originalDbUrl === undefined) {
        delete process.env.ATLASDB_URL;
      } else {
        process.env.ATLASDB_URL = originalDbUrl;
      }
    }
  });
});

describe("health endpoints and API routing", () => {
  let app;

  beforeEach(() => {
    const collection = { createIndex: jest.fn().mockResolvedValue("ok") };
    const client = {
      db: jest.fn(() => ({
        collection: jest.fn(() => collection),
      })),
    };
    app = buildApp(Promise.resolve(client));
  });

  it("reports process health independently from database readiness", async () => {
    const liveness = await request(app).get("/healthz");
    expect(liveness.status).toBe(200);
    expect(liveness.body).toEqual({ success: true, status: "ok" });

    const readiness = await request(app).get("/readyz");
    expect(readiness.status).toBe(503);
    expect(readiness.body).toEqual({
      success: false,
      status: "not_ready",
      database: "disconnected",
    });
  });

  it("reports readiness after the database is connected", async () => {
    app.set("databaseReady", () => true);

    const readiness = await request(app).get("/readyz");
    expect(readiness.status).toBe(200);
    expect(readiness.body).toEqual({
      success: true,
      status: "ready",
      database: "connected",
    });

    const health = await request(app).get("/api/v1/health");
    expect(health.status).toBe(200);
    expect(health.body.success).toBe(true);
    expect(health.body.data.dbState).toBe("connected");
  });

  it("keeps unknown API paths in the API", async () => {
    const missingRoute = await request(app).get("/api/v1/not-a-route");
    expect(missingRoute.status).toBe(404);
    expect(missingRoute.body.success).toBe(false);
  });
});
