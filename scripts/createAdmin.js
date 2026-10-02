require("dotenv").config();
const mongoose = require("mongoose");
const readline = require("readline/promises");
const { stdin: input, stdout: output } = require("process");

const User = require("../models/User");

const DB_URL = process.env.ATLASDB_URL;

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const eq = key.indexOf("=");
    let k, v;
    if (eq >= 0) {
      k = key.slice(0, eq);
      v = key.slice(eq + 1);
    } else {
      k = key;
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        v = next;
        i += 1;
      } else {
        v = true;
      }
    }
    out[k] = v;
  }
  return out;
}

function assertEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim());
}

async function connectDB() {
  if (!DB_URL) {
    console.error("FATAL: ATLASDB_URL is not set. Check your .env file.");
    process.exit(1);
  }
  await mongoose.connect(DB_URL, {
    tls: DB_URL.startsWith("mongodb+srv://"),
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 5,
  });
  console.log("Connected to MongoDB.");
}

async function prompt(rl, promptText, opts = {}) {
  const { required = true, validator = () => true, default: def = "" } = opts;
  while (true) {
    const label = def ? `${promptText} (${def}): ` : `${promptText}: `;
    const raw = (await rl.question(label)).trim();
    const val = raw || def;
    if (required && !val) {
      console.log("  A value is required. Try again.");
      continue;
    }
    const ok = typeof validator === "function" ? validator(val) : true;
    if (!ok) {
      console.log("  Validation failed. Try again.");
      continue;
    }
    return val;
  }
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  const hasAllFlags = Boolean(
    args.email && args.password && (args.username || args.name),
  );

  let rl = null;
  if (!hasAllFlags) {
    rl = readline.createInterface({ input, output });
  }

  try {
    await connectDB();

    let name = typeof args.name === "string" ? args.name : null;
    if (!name) {
      name = await prompt(rl, "Full name");
    }

    let email = typeof args.email === "string" ? args.email.trim() : null;
    if (!email) {
      email = await prompt(rl, "Email", { validator: assertEmail });
    } else if (!assertEmail(email)) {
      console.error("Invalid email address:", email);
      process.exit(1);
    }
    email = email.toLowerCase();

    let username =
      typeof args.username === "string" ? args.username.trim() : null;
    if (!username) {
      username = await prompt(rl, "Username (alphanumeric login id)", {
        default: email,
        validator: (v) => /^[a-zA-Z0-9_.-@+]{3,50}$/.test(v),
      });
    }
    username = username.toLowerCase();

    let phone = typeof args.phone === "string" ? args.phone.trim() : "";
    if (!phone && !hasAllFlags) {
      phone = await prompt(rl, "Phone (optional)", { required: false });
    }

    let password = typeof args.password === "string" ? args.password : null;
    if (!password) {
      password = await prompt(rl, "Password (at least 8 chars)", {
        validator: (v) => v.length >= 8,
      });
    } else if (password.length < 8) {
      console.error("Password must be at least 8 characters.");
      process.exit(1);
    }

    const existing = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() },
      ],
    });

    if (existing) {
      existing.role = "admin";
      existing.isBlocked = false;
      if (name) existing.name = name;
      if (phone !== undefined) existing.phone = phone;
      if (existing.email !== email) existing.email = email;
      if (existing.username !== username) existing.username = username;
      await existing.setPassword(password);
      await existing.save();
      console.log(
        `Updated existing user → admin: ${existing.email} / username=${existing.username}`,
      );
    } else {
      const user = new User({
        name,
        email,
        username,
        role: "admin",
        isBlocked: false,
        phone: phone || "",
      });
      await User.register(user, password);
      console.log(`Created admin: ${email} / username=${username}`);
    }
    console.log(
      "create-admin OK — sign in at your configured admin portal (default: /tvx-console).",
    );
  } catch (err) {
    console.error("create-admin failed:", err.message);
    process.exit(1);
  } finally {
    try {
      if (rl) rl.close();
    } catch (_) {
      /* ignore */
    }
    try {
      await mongoose.disconnect();
    } catch (_) {
      /* ignore */
    }
  }
}

run();
