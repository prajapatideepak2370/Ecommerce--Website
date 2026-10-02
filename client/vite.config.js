import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const envDir = path.resolve(__dirname, "..");
  const env = loadEnv(mode, envDir, "VITE_");
  const adminBase = (env.VITE_ADMIN_BASE || "/tvx-console").replace(/\/$/, "");
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
      proxy: {
        "/api": {
          target: "http://localhost:5000",
          changeOrigin: true,
          cookieDomainRewrite: "localhost",
        },
      },
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
