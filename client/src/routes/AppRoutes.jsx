import { Routes, Route, Navigate, Outlet } from "react-router-dom";

import MainLayout from "../layouts/MainLayout.jsx";
import AccountLayout from "../layouts/AccountLayout.jsx";
import AdminLayout from "../layouts/AdminLayout.jsx";

import ProtectedRoute from "./ProtectedRoute.jsx";
import AdminRoute from "./AdminRoute.jsx";

import Home from "../pages/Home.jsx";
import Shop from "../pages/Shop.jsx";
import ProductDetails from "../pages/ProductDetails.jsx";
import About from "../pages/About.jsx";
import NotFound from "../pages/NotFound.jsx";

import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";

import Cart from "../pages/Cart.jsx";
import Checkout from "../pages/Checkout.jsx";
import OrderConfirmation from "../pages/OrderConfirmation.jsx";

import Profile from "../pages/account/Profile.jsx";
import Addresses from "../pages/account/Addresses.jsx";
import MyOrders from "../pages/account/MyOrders.jsx";
import Settings from "../pages/account/Settings.jsx";

import AdminDashboard from "../pages/admin/AdminDashboard.jsx";
import AdminProducts from "../pages/admin/AdminProducts.jsx";
import AdminCategories from "../pages/admin/AdminCategories.jsx";
import AdminOrders from "../pages/admin/AdminOrders.jsx";
import AdminCustomers from "../pages/admin/AdminCustomers.jsx";
import AdminReviews from "../pages/admin/AdminReviews.jsx";
import AdminInventory from "../pages/admin/AdminInventory.jsx";
import AdminPayments from "../pages/admin/AdminPayments.jsx";

function PublicOutlet() {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}

function AccountOutlet() {
  return (
    <ProtectedRoute>
      <AccountLayout />
    </ProtectedRoute>
  );
}

function AdminOutlet() {
  return (
    <AdminRoute>
      <AdminLayout />
    </AdminRoute>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicOutlet />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/collections" element={<Shop />} />
        <Route path="/new" element={<Shop />} />
        <Route path="/product/:slug" element={<ProductDetails />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order/confirmation/:orderId"
          element={
            <ProtectedRoute>
              <OrderConfirmation />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="/account" element={<AccountOutlet />}>
        <Route index element={<Profile />} />
        <Route path="addresses" element={<Addresses />} />
        <Route path="orders" element={<MyOrders />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="/admin" element={<AdminOutlet />}>
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="inventory" element={<AdminInventory />} />
        <Route path="payments" element={<AdminPayments />} />
      </Route>

      <Route
        path="/404"
        element={
          <MainLayout>
            <NotFound />
          </MainLayout>
        }
      />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
