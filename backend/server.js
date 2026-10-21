require("dotenv").config();
const mongoose = require("mongoose");
const { buildApp } = require("./appFactory");

const sanitizeErrorMessage = (message) =>
  String(message || "Unknown error").replace(
    /mongodb(?:\+srv)?:\/\/[^\s"'<>]+/gi,
    "mongodb://[redacted]",
  );
let app;
let server;
let connectionPromise;
let startupPromise;

async function connectDB() {
  const dbUrl = process.env.ATLASDB_URL;
  if (!dbUrl) {
    throw new Error("ATLASDB_URL is not set. Check your environment.");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (mongoose.connection.readyState === 2 && connectionPromise) {
    console.info("[api] Reusing pending MongoDB connection", {
      readyState: mongoose.connection.readyState,
    });
    return connectionPromise;
  }

  const startedAt = Date.now();
  console.info("[api] Starting MongoDB connection", {
    readyState: mongoose.connection.readyState,
    hasAtlasDbUrl: true,
    serverSelectionTimeoutMs: 10000,
  });

  const pendingConnection = mongoose.connect(dbUrl, {
    tls: dbUrl.startsWith("mongodb+srv://"),
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 10,
  });
  connectionPromise = pendingConnection;

  try {
    await pendingConnection;
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
    if (connectionPromise === pendingConnection) {
      connectionPromise = null;
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
  app.set("databaseReady", () => mongoose.connection.readyState === 1);
  console.info("[api] Express application initialized");
  return app;
}

async function startServer() {
  if (server?.listening) {
    return server;
  }

  if (startupPromise) {
    return startupPromise;
  }

  startupPromise = (async () => {
    await connectDB();
    const expressApp = app || createApp();
    const port = Number(process.env.PORT) || 5000;
    const hostname = process.env.HOST || "0.0.0.0";

    server = await new Promise((resolve, reject) => {
      const httpServer = expressApp.listen(port, hostname);
      httpServer.once("error", reject);
      httpServer.once("listening", () => resolve(httpServer));
    });

    console.info("[api] HTTP server listening", {
      hostname,
      port,
      environment: process.env.NODE_ENV || "development",
    });
    return server;
  })();

  try {
    return await startupPromise;
  } catch (err) {
    startupPromise = null;
    console.error("[api] Server startup failed", {
      errorName: err.name,
      errorCode: err.code,
      message: sanitizeErrorMessage(err.message),
    });
    throw err;
  }
}

async function shutdownServer(signal) {
  console.info("[api] Graceful shutdown started", { signal });
  let shutdownError;

  if (server?.listening) {
    try {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    } catch (err) {
      shutdownError = err;
      console.error("[api] HTTP server shutdown failed", {
        errorName: err.name,
        errorCode: err.code,
        message: sanitizeErrorMessage(err.message),
      });
    }
  }

  try {
    await mongoose.disconnect();
  } catch (err) {
    shutdownError ||= err;
    console.error("[api] MongoDB shutdown failed", {
      errorName: err.name,
      errorCode: err.code,
      message: sanitizeErrorMessage(err.message),
    });
  }

  server = null;
  startupPromise = null;
  if (shutdownError) throw shutdownError;
  console.info("[api] Graceful shutdown completed", { signal });
}

module.exports = { startServer, shutdownServer };

if (require.main === module) {
  startServer().catch(() => {
    process.exit(1);
  });

  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.once(signal, () => {
      shutdownServer(signal).catch(() => {
        process.exitCode = 1;
      });
    });
  }
}
