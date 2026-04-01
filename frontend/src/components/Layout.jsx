import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout() {
  const { pathname } = useLocation();
  const showFooter = !pathname.startsWith("/admin");

  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      <Navbar />
      <Outlet />
      {showFooter ? <Footer /> : null}
    </div>
  );
}
