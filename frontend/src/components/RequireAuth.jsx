import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getStoredToken } from "../api";

export default function RequireAuth() {
  const token = getStoredToken();
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}
