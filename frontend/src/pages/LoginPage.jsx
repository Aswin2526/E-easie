import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, persistAuth } from "../api";
import {
  AuthField,
  AuthGlobalStyles,
  IconEnvelope,
  IconLock,
  authButtonStyle,
  authCardStyle,
  authErrorStyle,
  authFooterStyle,
  authInputProps,
  authPageStyle,
} from "../auth/AuthUi";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputProps = authInputProps();

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
    <div style={authPageStyle()}>
      <AuthGlobalStyles />
      <form onSubmit={handleSubmit} style={authCardStyle()}>
        <AuthField icon={<IconEnvelope />}>
          <input
            type="email"
            placeholder="Email ID"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            {...inputProps}
            autoComplete="username"
          />
        </AuthField>

        <AuthField icon={<IconLock />}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            {...inputProps}
            autoComplete="current-password"
          />
        </AuthField>

        {error && <p style={authErrorStyle()}>{error}</p>}

        <button type="submit" style={authButtonStyle(loading)} disabled={loading}>
          {loading ? "Please wait…" : "Login"}
        </button>

        <p className="auth-ui-footer" style={authFooterStyle()}>
          Don’t have an account? <Link to="/register">Register</Link>
        </p>
        <p className="auth-ui-footer" style={{ ...authFooterStyle(), marginTop: 12 }}>
          <Link to="/">← Back to home</Link>
        </p>
      </form>
    </div>
  );
}
