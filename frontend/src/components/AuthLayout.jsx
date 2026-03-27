import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function AuthLayout() {
  return (
    <div style={styles.shell}>
      <Navbar />
      <main style={styles.main}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

const styles = {
  shell: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#fff",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
  },
};
