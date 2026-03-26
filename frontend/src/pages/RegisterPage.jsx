import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { persistAuth, registerUser } from "../api";

function parseApiError(err) {
  if (!err?.data || typeof err.data !== "object") {
    return err?.message || "Registration failed.";
  }
  for (const value of Object.values(err.data)) {
    if (Array.isArray(value) && value.length > 0) return String(value[0]);
    if (typeof value === "string") return value;
  }
  return "Registration failed.";
}

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!name || !email || !password || !password2) {
      setError("Please fill all fields.");
      return;
    }
    if (password !== password2) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await registerUser({
        name,
        email,
        password,
        password2,
        role,
      });
      persistAuth({ token: res?.token, role: res?.role, name: res?.user?.name });
      navigate(res?.role === "admin" ? "/admin/dashboard" : "/");
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <h2 style={styles.title}>Create Account</h2>

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={styles.input}
          autoComplete="name"
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          autoComplete="email"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          autoComplete="new-password"
        />

        <input
          type="password"
          placeholder="Confirm password"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          style={styles.input}
          autoComplete="new-password"
        />

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={styles.input}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Creating account…" : "Register"}
        </button>

        <p>
          <br />
          Already have an account? <Link to="/login">Login</Link>
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
    background: "#fff",
    padding: "32px",
    width: "360px",
    borderRadius: "16px",
    boxShadow: "0 14px 34px rgba(26, 26, 46, 0.14)",
    border: "1px solid #e7e9f3",
  },
  title: {
    marginTop: 0,
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
  error: { color: "#b91c1c", fontSize: "13px", marginTop: "8px", textAlign: "left" },
  back: { marginTop: "12px", fontSize: "14px" },
};
