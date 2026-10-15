require("dotenv").config();
const mongoose = require("mongoose");
const { buildApp } = require("../../app");

async function makeTestApp() {
  const base = process.env.ATLASDB_URL || "";
  if (!base) throw new Error("ATLASDB_URL missing in env");
  const url = base.includes("?")
    ? base.replace(/\/([^/?]+)(\?)/, "/tryvoxel_test$2")
    : base.replace(/\/([^/?]+)$/, "/tryvoxel_test");

  await mongoose.connect(url, {
    tls: url.startsWith("mongodb+srv://"),
    serverSelectionTimeoutMS: 10000,
  });

  await mongoose.connection.db
    .collections()
    .then((cols) => Promise.all(cols.map((c) => c.deleteMany({}))));

  const dbClientPromise = mongoose.connection
    .asPromise()
    .then((c) => c.getClient());
  const app = buildApp(dbClientPromise);
  app.set("dbState", "connected");
  return app;
}

async function teardown() {
  try {
    await mongoose.connection.dropDatabase();
  } catch (_) {}
  await mongoose.disconnect();
}

module.exports = { makeTestApp, teardown };
