import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider } from "./store/AuthContext.jsx";
import AdminConsoleLayout from "./layouts/AdminConsoleLayout.jsx";
import AdminRouteGuard from "./routes/AdminRouteGuard.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminProductsList from "./pages/AdminProductsList.jsx";
import AdminProductForm from "./pages/AdminProductForm.jsx";
import AdminInventory from "./pages/AdminInventory.jsx";
import AdminCategoriesManager from "./pages/AdminCategoriesManager.jsx";
import AdminOrders from "./pages/AdminOrders.jsx";
import { setupAdminInterceptors } from "./api/client.js";

function AnimatedOutlet({ children }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default function AdminApp() {
  useEffect(() => {
    setupAdminInterceptors();
  }, []);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-ink-950 text-ink-100">
        <Routes>
          <Route path="/login" element={<AdminLogin />} />
          <Route
            element={
              <AdminRouteGuard>
                <AdminConsoleLayout />
              </AdminRouteGuard>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route
              path="products"
              element={
                <AnimatedOutlet>
                  <AdminProductsList />
                </AnimatedOutlet>
              }
            />
            <Route
              path="products/new"
              element={
                <AnimatedOutlet>
                  <AdminProductForm mode="create" />
                </AnimatedOutlet>
              }
            />
            <Route
              path="products/:id"
              element={
                <AnimatedOutlet>
                  <AdminProductForm mode="edit" />
                </AnimatedOutlet>
              }
            />
            <Route
              path="inventory"
              element={
                <AnimatedOutlet>
                  <AdminInventory />
                </AnimatedOutlet>
              }
            />
            <Route
              path="categories"
              element={
                <AnimatedOutlet>
                  <AdminCategoriesManager />
                </AnimatedOutlet>
              }
            />
            <Route
              path="orders"
              element={
                <AnimatedOutlet>
                  <AdminOrders />
                </AnimatedOutlet>
              }
            />
            <Route
              path="orders/:orderId"
              element={
                <AnimatedOutlet>
                  <AdminOrders />
                </AnimatedOutlet>
              }
            />
          </Route>
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </div>
    </AuthProvider>
  );
}
