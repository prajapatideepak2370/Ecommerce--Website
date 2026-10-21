require("dotenv").config();
const mongoose = require("mongoose");
const { buildApp } = require("./app");

const CONNECTION_CACHE_KEY = "__tryvoxelMongooseConnection";
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
    return connectionCache.promise;
  }

  connectionCache.promise = null;
  const connectionPromise = mongoose.connect(dbUrl, {
    tls: dbUrl.startsWith("mongodb+srv://"),
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 10,
  });
  connectionCache.promise = connectionPromise;

  try {
    await connectionPromise;
    console.log(
      "Connected to MongoDB:",
      dbUrl.split("@")[1]?.split("/")[0] || dbUrl,
    );
    return mongoose.connection;
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
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
  try {
    await connectDB();
    const expressApp = app || createApp();
    return expressApp(req, res);
  } catch (err) {
    console.error("Serverless request initialization failed:", err);
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
