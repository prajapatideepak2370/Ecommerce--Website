import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider as ReduxProvider } from "react-redux";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import { store } from "./store/index.js";
import AppRoutes from "./routes/AppRoutes.jsx";
import { initializeTheme } from "./utils/theme.js";
import "./index.css";

initializeTheme();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ReduxProvider store={store}>
      <BrowserRouter>
        <App>
          <AppRoutes />
        </App>
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
    </ReduxProvider>
  </React.StrictMode>
);
