import { Routes, Route, Navigate, Outlet } from "react-router-dom";

import MainLayout from "../layouts/MainLayout.jsx";
import AccountLayout from "../layouts/AccountLayout.jsx";

import ProtectedRoute from "./ProtectedRoute.jsx";

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
