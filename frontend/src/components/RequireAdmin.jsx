import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getStoredRole, getStoredToken } from "../api";

export default function RequireAdmin() {
  const token = getStoredToken();
  const role = getStoredRole();

  if (!token || role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
