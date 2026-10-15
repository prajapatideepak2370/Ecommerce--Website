import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import AdminApp from "./App.jsx";
import "../index.css";

const ADMIN_BASE = (import.meta.env.VITE_ADMIN_BASE || "/tvx-console").replace(
  /\/$/,
  "",
);

ReactDOM.createRoot(document.getElementById("admin-root")).render(
  <React.StrictMode>
    <BrowserRouter
      basename={ADMIN_BASE}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AdminApp />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "rgb(var(--color-ink-900))",
            color: "rgb(var(--color-ink-100))",
            border: "1px solid rgb(var(--color-ink-800))",
            borderRadius: "12px",
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
);
