import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!username || !email || !password || !password2) {
      setError("Please fill all fields.");
      return;
    }
    setLoading(true);
    try {
      await registerUser({ username, email, password, password2 });
      navigate("/login");
    } catch (err) {
      setError(
        typeof err.data === "object"
          ? JSON.stringify(err.data)
          : err.message || "Registration failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <h2>Register to E-Easie</h2>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={styles.input}
          autoComplete="username"
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
    background: "#f2f2f2",
  },
  card: {
    background: "#fff",
    padding: "30px",
    width: "320px",
    borderRadius: "8px",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
    textAlign: "center",
  },
  input: {
    width: "100%",
    padding: "10px",
    margin: "10px 0",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: "10px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    borderRadius: "6px",
    fontWeight: "600",
  },
  error: { color: "#b91c1c", fontSize: "13px", marginTop: "8px", textAlign: "left" },
  back: { marginTop: "12px", fontSize: "14px" },
};
