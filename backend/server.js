require("dotenv").config();
const mongoose = require("mongoose");
const { buildApp } = require("./appFactory");

const CONNECTION_CACHE_KEY = "__tryvoxelMongooseConnection";
const sanitizeErrorMessage = (message) =>
  String(message || "Unknown error").replace(
    /mongodb(?:\+srv)?:\/\/[^\s"'<>]+/gi,
    "mongodb://[redacted]",
  );
let app;

async function connectDB() {
  const dbUrl = process.env.ATLASDB_URL;
  if (!dbUrl) {
    throw new Error("ATLASDB_URL is not set. Check your environment.");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const connectionCache =
    globalThis[CONNECTION_CACHE_KEY] ||
    (globalThis[CONNECTION_CACHE_KEY] = { promise: null });

  if (mongoose.connection.readyState === 2 && connectionCache.promise) {
    console.info("[api] Reusing pending MongoDB connection", {
      readyState: mongoose.connection.readyState,
    });
    return connectionCache.promise;
  }

  const startedAt = Date.now();
  console.info("[api] Starting MongoDB connection", {
    readyState: mongoose.connection.readyState,
    hasAtlasDbUrl: true,
    serverSelectionTimeoutMs: 10000,
  });

  connectionCache.promise = null;
  const connectionPromise = mongoose.connect(dbUrl, {
    tls: dbUrl.startsWith("mongodb+srv://"),
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 10,
  });
  connectionCache.promise = connectionPromise;

  try {
    await connectionPromise;
    console.info("[api] MongoDB connection established", {
      elapsedMs: Date.now() - startedAt,
      readyState: mongoose.connection.readyState,
    });
    return mongoose.connection;
  } catch (err) {
    console.error("[api] MongoDB connection failed", {
      elapsedMs: Date.now() - startedAt,
      readyState: mongoose.connection.readyState,
      name: err.name,
      code: err.code,
      message: sanitizeErrorMessage(err.message),
    });
    if (connectionCache.promise === connectionPromise) {
      connectionCache.promise = null;
    }
    throw err;
  }
}

function createApp() {
  const dbClientPromise = mongoose.connection
    .asPromise()
    .then((conn) => conn.getClient());

  app = buildApp(dbClientPromise);
  app.set("dbState", "connected");
  console.info("[api] Express application initialized");
  return app;
}

async function startServer() {
  await connectDB();
  const expressApp = createApp();

  const port = Number(process.env.PORT) || 5000;
  const hostname =
    process.env.HOST ||
    (process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost");

  expressApp.listen(port, hostname, () => {
    console.log(`TRYVOXEL³ API running at http://${hostname}:${port}`);
    console.log(`Health: http://${hostname}:${port}/api/v1/health`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  });
}

async function serverlessHandler(req, res) {
  const startedAt = Date.now();
  const requestDetails = {
    method: req.method,
    path: String(req.url || "/").split("?")[0],
    vercelRequestId: req.headers?.["x-vercel-id"],
    dbReadyState: mongoose.connection.readyState,
    hasAtlasDbUrl: Boolean(process.env.ATLASDB_URL),
  };
  let stage = "database-connection";
  console.info("[api] Serverless request received", requestDetails);

  try {
    await connectDB();
    stage = "app-initialization";
    const expressApp = app || createApp();
    stage = "express-dispatch";
    console.info("[api] Dispatching request to Express", {
      ...requestDetails,
      elapsedMs: Date.now() - startedAt,
      dbReadyState: mongoose.connection.readyState,
    });
    return expressApp(req, res);
  } catch (err) {
    console.error("[api] Serverless request failed", {
      ...requestDetails,
      stage,
      elapsedMs: Date.now() - startedAt,
      dbReadyState: mongoose.connection.readyState,
      errorName: err.name,
      errorCode: err.code,
      errorMessage: sanitizeErrorMessage(err.message),
    });
    if (!res.headersSent) {
      return res.status(503).json({
        success: false,
        error: {
          code: 503,
          message: "Service temporarily unavailable",
        },
      });
    }
  }
}

module.exports = serverlessHandler;

if (require.main === module) {
  startServer().catch((err) => {
    console.error("FATAL startServer error:", err);
    process.exit(1);
  });
}
