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
            background: "#14161d",
            color: "#eceff5",
            border: "1px solid #262935",
            borderRadius: "12px",
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
);
