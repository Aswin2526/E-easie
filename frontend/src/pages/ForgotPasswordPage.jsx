import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  requestForgotPasswordOtp,
  resetPasswordWithOtp,
  verifyForgotPasswordOtp,
} from "../api";
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

function parseApiError(err, fallback) {
  if (!err?.data || typeof err.data !== "object") return err?.message || fallback;
  if (typeof err.data.detail === "string") return err.data.detail;
  for (const value of Object.values(err.data)) {
    if (Array.isArray(value) && value[0]) return String(value[0]);
    if (typeof value === "string") return value;
  }
  return err?.message || fallback;
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const inputProps = authInputProps();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const onSendOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    setLoading(true);
    try {
      const res = await requestForgotPasswordOtp(email.trim());
      setMessage(res?.message || "If this email exists, OTP has been sent.");
      setStep(2);
    } catch (err) {
      setError(parseApiError(err, "Could not send OTP."));
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!otp.trim()) {
      setError("Please enter OTP.");
      return;
    }
    setLoading(true);
    try {
      const res = await verifyForgotPasswordOtp(email.trim(), otp.trim());
      setMessage(res?.message || "OTP verified.");
      setStep(3);
    } catch (err) {
      setError(parseApiError(err, "Invalid OTP."));
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!password || !password2) {
      setError("Please fill all fields.");
      return;
    }
    if (password !== password2) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await resetPasswordWithOtp({
        email: email.trim(),
        otp: otp.trim(),
        password,
        password2,
      });
      setMessage(res?.message || "Password changed successfully.");
      setTimeout(() => navigate("/login"), 900);
    } catch (err) {
      setError(parseApiError(err, "Could not reset password."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={authPageStyle()}>
      <AuthGlobalStyles />
      <form
        onSubmit={step === 1 ? onSendOtp : step === 2 ? onVerifyOtp : onResetPassword}
        style={authCardStyle()}
      >
        {step === 1 ? (
          <>
            <AuthField icon={<IconEnvelope />}>
              <input
                type="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                {...inputProps}
              />
            </AuthField>
            <button type="submit" style={authButtonStyle(loading)} disabled={loading}>
              {loading ? "Please wait…" : "Send OTP"}
            </button>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <AuthField icon={<IconLock />}>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                {...inputProps}
              />
            </AuthField>
            <button type="submit" style={authButtonStyle(loading)} disabled={loading}>
              {loading ? "Please wait…" : "Verify OTP"}
            </button>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <AuthField icon={<IconLock />}>
              <input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                {...inputProps}
              />
            </AuthField>
            <AuthField icon={<IconLock />}>
              <input
                type="password"
                placeholder="Confirm new password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                {...inputProps}
              />
            </AuthField>
            <button type="submit" style={authButtonStyle(loading)} disabled={loading}>
              {loading ? "Please wait…" : "Reset Password"}
            </button>
          </>
        ) : null}

        {error ? <p style={authErrorStyle()}>{error}</p> : null}
        {message ? <p style={{ ...authErrorStyle(), color: "#166534" }}>{message}</p> : null}

        <p className="auth-ui-footer" style={{ ...authFooterStyle(), marginTop: 12 }}>
          <Link to="/login">← Back to login</Link>
        </p>
      </form>
    </div>
  );
}
