import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, persistAuth } from "../api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Please fill all fields.");
      return;
    }
    setLoading(true);
    try {
      const res = await loginUser(email, password);
      persistAuth({ token: res?.token, role: res?.role, name: res?.user?.name });
      navigate(res?.role === "admin" ? "/admin/dashboard" : "/");
    } catch (err) {
      setError(
        typeof err.data === "object" && (err.data?.detail || err.data?.error)
          ? String(err.data.detail || err.data.error)
          : err.message || "Login failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <h2 style={styles.title}>Sign In</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          autoComplete="username"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          autoComplete="current-password"
        />

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Signing in…" : "Login"}
        </button>

        <p>
          <br />
          Don’t have an account? <Link to="/register">Register</Link>
        </p>
        <p style={styles.back}>
          <Link to="/">← Back to home</Link>
        </p>
      </form>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(180deg, #eef1ff 0%, #f6f7fb 100%)",
  },
  card: {
    background: "#ffffff",
    padding: "32px",
    width: "360px",
    borderRadius: "16px",
    boxShadow: "0 14px 34px rgba(26, 26, 46, 0.14)",
    border: "1px solid #e7e9f3",
  },
  title: {
    marginTop: "0",
    marginBottom: "12px",
    color: "#1a1a2e",
    fontWeight: 800,
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    margin: "10px 0",
    boxSizing: "border-box",
    borderRadius: "10px",
    border: "1px solid #ccd2ea",
    outline: "none",
  },
  button: {
    width: "100%",
    padding: "12px",
    background: "#1a1a2e",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    borderRadius: "10px",
    fontWeight: 800,
    letterSpacing: "0.02em",
  },
  error: { color: "#b91c1c", fontSize: "14px", marginTop: "8px" },
  back: { marginTop: "12px", fontSize: "14px" },
};
