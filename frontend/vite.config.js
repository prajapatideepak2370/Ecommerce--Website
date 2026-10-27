import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// The single production API configuration. These are public values (they are
// baked into the browser bundle by design, never secrets). A hosting dashboard
// variable still wins as long as it holds a usable value; these are used only
// when the configured value is missing or unusable for a production build.
const PRODUCTION_API_DEFAULTS = {
  VITE_API_BASE: "https://trivoxel-3d.onrender.com/api/v1",
  VITE_ADMIN_API_BASE: "https://trivoxel-3d.onrender.com/api/admin",
};

function isLoopbackHostname(hostname) {
  const host = hostname.toLowerCase();
  return (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "[::1]"
  );
}

/** Explains why a value is unusable in production, or null when it is fine. */
function describeProductionProblem(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "is empty";

  let url;
  try {
    url = new URL(trimmed, "https://production.invalid");
  } catch {
    return "is not a valid URL or same-origin path";
  }

  if (isLoopbackHostname(url.hostname)) return "points to localhost";

  const isSameOriginPath = trimmed.startsWith("/") && !trimmed.startsWith("//");
  if (!isSameOriginPath && url.protocol !== "https:")
    return "does not use HTTPS";

  return null;
}

export default defineConfig(({ mode }) => {
  const envDir = __dirname;
  const env = loadEnv(mode, envDir, "VITE_");
  const adminBase = (env.VITE_ADMIN_BASE || "/tvx-console").replace(/\/$/, "");

  if (mode === "production") {
    for (const [key, fallback] of Object.entries(PRODUCTION_API_DEFAULTS)) {
      const problem = describeProductionProblem(env[key]);
      if (!problem) continue;

      const configured = env[key] ? `${key}=${env[key]}` : `${key} is unset`;
      console.warn(
        `[vite] Ignoring ${configured} for this production build because it ${problem}. Using ${fallback} instead.`,
      );
      env[key] = fallback;
    }

    // Vite builds `import.meta.env` from process.env, and process.env takes
    // precedence over every .env file. Publishing the repaired values here is
    // what makes the bundle itself pick them up, not just this config file.
    for (const key of Object.keys(PRODUCTION_API_DEFAULTS)) {
      process.env[key] = env[key];
    }
  }

  const rewriteAdminEntry = (server) => {
    server.middlewares.use((req, _res, next) => {
      const url = req.url || "/";
      const pathname = url.split("?")[0];
      if (pathname === adminBase || pathname.startsWith(`${adminBase}/`)) {
        req.url = `/admin.html${url.slice(pathname.length)}`;
      }
      next();
    });
  };

  return {
    envDir,
    plugins: [
      react(),
      {
        name: "admin-entry-rewrite",
        configureServer: rewriteAdminEntry,
        configurePreviewServer: rewriteAdminEntry,
      },
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
    },
    build: {
      outDir: "dist",
      sourcemap: false,
      rollupOptions: {
        input: {
          store: path.resolve(__dirname, "index.html"),
          admin: path.resolve(__dirname, "admin.html"),
        },
        output: {
          manualChunks: {
            vendor: ["react", "react-dom", "react-router-dom"],
            three: ["three", "@react-three/fiber", "@react-three/drei"],
            state: ["@reduxjs/toolkit", "react-redux"],
          },
        },
      },
    },
  };
});
