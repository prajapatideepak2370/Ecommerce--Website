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
    for (const [key, defaultPath] of Object.entries(productionApiBases)) {
      const value = (env[key] || defaultPath).trim();
      let url;
      try {
        url = new URL(value, "https://production.invalid");
      } catch {
        throw new Error(`${key} must be a valid HTTPS URL or same-origin path.`);
      }

      const hostname = url.hostname.toLowerCase();
      if (
        hostname === "localhost" ||
        hostname.endsWith(".localhost") ||
        hostname === "127.0.0.1" ||
        hostname === "[::1]"
      ) {
        throw new Error(`${key} must not point to localhost in production.`);
      }

      const isSameOriginPath =
        value.startsWith("/") && !value.startsWith("//");
      if (
        !isSameOriginPath &&
        (!/^https:\/\//i.test(value) || url.protocol !== "https:")
      ) {
        throw new Error(`${key} must use HTTPS in production.`);
      }
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
