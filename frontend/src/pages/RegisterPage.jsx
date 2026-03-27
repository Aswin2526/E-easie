import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { persistAuth, registerUser } from "../api";
import {
  AuthField,
  AuthGlobalStyles,
  IconEnvelope,
  IconLock,
  IconPerson,
  IconUsers,
  authButtonStyle,
  authCardStyle,
  authErrorStyle,
  authFooterStyle,
  authInputProps,
  authPageStyle,
  authSelectProps,
} from "../auth/AuthUi";

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
  const inputProps = authInputProps();
  const selectProps = authSelectProps();

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
    <div style={authPageStyle()}>
      <AuthGlobalStyles />
      <form onSubmit={handleSubmit} style={authCardStyle()}>
        <AuthField icon={<IconPerson />}>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            {...inputProps}
            autoComplete="name"
          />
        </AuthField>

        <AuthField icon={<IconEnvelope />}>
          <input
            type="email"
            placeholder="Email ID"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            {...inputProps}
            autoComplete="email"
          />
        </AuthField>

        <AuthField icon={<IconLock />}>
          <input
            type="password"
            placeholder="Set Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            {...inputProps}
            autoComplete="new-password"
          />
        </AuthField>

        <AuthField icon={<IconLock />}>
          <input
            type="password"
            placeholder="Confirm Password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            {...inputProps}
            autoComplete="new-password"
          />
        </AuthField>

        <AuthField icon={<IconUsers />}>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            {...selectProps}
            aria-label="Account type"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </AuthField>

        {error && <p style={authErrorStyle()}>{error}</p>}

        <button type="submit" style={authButtonStyle(loading)} disabled={loading}>
          {loading ? "Please wait…" : "Register"}
        </button>

        <p className="auth-ui-footer" style={authFooterStyle()}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
        <p className="auth-ui-footer" style={{ ...authFooterStyle(), marginTop: 12 }}>
          <Link to="/">← Back to home</Link>
        </p>
      </form>
    </div>
  );
}
