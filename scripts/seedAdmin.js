require("dotenv").config();
const mongoose = require("mongoose");

const { seedAdmin, connectDB } = require("../seeders/seed");

async function main() {
  try {
    await connectDB();
    const admin = await seedAdmin();
    console.log(`seed-admin OK: ${admin ? admin.email : "(no changes)"}`);
  } catch (err) {
    console.error("seed-admin failed:", err);
    process.exit(1);
  } finally {
    try {
      await mongoose.disconnect();
    } catch (_) {}
    console.log("Disconnected");
  }
}

main();
