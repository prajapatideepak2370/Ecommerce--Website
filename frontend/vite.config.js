import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const envDir = __dirname;
  const env = loadEnv(mode, envDir, "VITE_");
  const adminBase = (env.VITE_ADMIN_BASE || "/tvx-console").replace(/\/$/, "");
  const productionApiBases = {
    VITE_API_BASE: "/api/v1",
    VITE_ADMIN_API_BASE: "/api/admin",
  };

  if (mode === "production") {
    const problems = [];

    for (const [key, defaultPath] of Object.entries(productionApiBases)) {
      const raw = env[key];
      const value = (raw || defaultPath).trim();
      const source = raw
        ? `${key}=${raw}`
        : `${key} is unset, using the default "${defaultPath}"`;

      let url;
      try {
        url = new URL(value, "https://production.invalid");
      } catch {
        problems.push(
          `${key} must be a valid URL or same-origin path (${source}).`,
        );
        continue;
      }

      const hostname = url.hostname.toLowerCase();
      if (
        hostname === "localhost" ||
        hostname.endsWith(".localhost") ||
        hostname === "127.0.0.1" ||
        hostname === "[::1]"
      ) {
        problems.push(
          `${key} must not point to localhost in production (${source}).`,
        );
        continue;
      }

      const isSameOriginPath = value.startsWith("/") && !value.startsWith("//");
      if (
        !isSameOriginPath &&
        (!/^https:\/\//i.test(value) || url.protocol !== "https:")
      ) {
        problems.push(`${key} must use HTTPS in production (${source}).`);
      }
    }

    if (problems.length) {
      throw new Error(
        [
          "Production build configuration is invalid:",
          ...problems.map((problem) => `  - ${problem}`),
          "",
          "Vite reads VITE_* variables at build time and process.env wins over",
          "any .env file, so a stale value in the hosting dashboard will override",
          "this repository. Fix it in Vercel -> Project -> Settings -> Environment",
          "Variables (Production scope), then redeploy. Applying a fix to the",
          "code alone is not enough: the build must be re-run.",
        ].join("\n"),
      );
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
