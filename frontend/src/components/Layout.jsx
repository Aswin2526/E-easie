import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout() {
  const { pathname } = useLocation();
  const showFooter = !pathname.startsWith("/admin") && !pathname.startsWith("/payment-receipt");
  const showStoreNav = !pathname.startsWith("/admin");

  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      {showStoreNav ? <Navbar /> : null}
      <Outlet />
      {showFooter ? <Footer /> : null}
    </div>
  );
}
