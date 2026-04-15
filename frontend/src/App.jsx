import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { NotifyProvider } from "./contexts/NotifyContext";
import Layout from "./components/Layout";
import AuthLayout from "./components/AuthLayout";
import AdminLayout from "./components/admin/AdminLayout";
import RequireAdmin from "./components/RequireAdmin";
import RequireAuth from "./components/RequireAuth";
import HomePage from "./pages/HomePage";
import CategoryPage from "./pages/CategoryPage";
import CustomizePage from "./pages/CustomizePage";
import TrackOrderPage from "./pages/TrackOrderPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminProductsPage from "./pages/AdminProductsPage";
import AdminPaymentPage from "./pages/AdminPaymentPage";
import AdminReportPage from "./pages/AdminReportPage";
import CartPage from "./pages/CartPage";
import WishlistPage from "./pages/WishlistPage";
import PaymentReceiptPage from "./pages/PaymentReceiptPage";
import ProfilePage from "./pages/ProfilePage";

export default function App() {
  return (
    <BrowserRouter>
      <NotifyProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/category" element={<CategoryPage />} />
          <Route path="/track-order" element={<TrackOrderPage />} />
          <Route element={<RequireAuth />}>
            <Route path="/customize" element={<CustomizePage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/payment-receipt" element={<PaymentReceiptPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          <Route element={<RequireAdmin />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/products" element={<AdminProductsPage />} />
              <Route path="/admin/payment" element={<AdminPaymentPage />} />
              <Route path="/admin/report" element={<AdminReportPage />} />
            </Route>
          </Route>
        </Route>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
      </Routes>
      </NotifyProvider>
    </BrowserRouter>
  );
}
