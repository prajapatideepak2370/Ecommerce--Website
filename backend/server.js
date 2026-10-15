require("dotenv").config();
const mongoose = require("mongoose");
const { buildApp } = require("./app");

const DB_URL = process.env.ATLASDB_URL;

if (!DB_URL) {
  console.error("FATAL: ATLASDB_URL is not set. Check your .env file.");
  process.exit(1);
}

async function connectDB() {
  try {
    await mongoose.connect(DB_URL, {
      tls: DB_URL.startsWith("mongodb+srv://"),
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
    });
    console.log(
      "Connected to MongoDB:",
      DB_URL.split("@")[1]?.split("/")[0] || DB_URL,
    );
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    throw err;
  }
}

async function startServer() {
  await connectDB();

  const dbClientPromise = mongoose.connection
    .asPromise()
    .then((conn) => conn.getClient());

  const app = buildApp(dbClientPromise);
  app.set("dbState", "connected");

  const port = Number(process.env.PORT) || 5000;
  const hostname = process.env.HOST || "localhost";

  app.listen(port, hostname, () => {
    console.log(`TRYVOXEL³ API running at http://${hostname}:${port}`);
    console.log(`Health: http://${hostname}:${port}/api/v1/health`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  });
}

startServer().catch((err) => {
  console.error("FATAL startServer error:", err);
  process.exit(1);
});
