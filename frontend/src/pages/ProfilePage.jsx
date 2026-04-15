import React, { useEffect, useState } from "react";
import { fetchCurrentUser } from "../api";
import { apiErrorMessage } from "../admin/adminUtils";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchCurrentUser();
        if (!cancelled) setProfile(res);
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err, "Could not load profile."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <main style={styles.wrap}>
        <p style={styles.muted}>Loading profile...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={styles.wrap}>
        <section style={styles.card}>
          <h1 style={styles.title}>My Profile</h1>
          <p style={styles.error}>{error}</p>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.wrap}>
      <section style={styles.card}>
        <h1 style={styles.title}>My Profile</h1>
        <div style={styles.row}>
          <span style={styles.label}>Name</span>
          <span style={styles.value}>{profile?.name || "-"}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Email</span>
          <span style={styles.value}>{profile?.email || "-"}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Role</span>
          <span style={styles.value}>{profile?.is_superuser ? "Admin" : "User"}</span>
        </div>
      </section>
    </main>
  );
}

const styles = {
  wrap: {
    padding: "24px 28px 40px",
    maxWidth: "980px",
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
  },
  card: {
    background: "#fff",
    border: "1px solid #e6e8f0",
    borderRadius: "14px",
    padding: "20px",
    boxShadow: "0 8px 24px rgba(26, 26, 46, 0.04)",
  },
  title: {
    margin: 0,
    color: "#1a1a2e",
    fontSize: "24px",
    fontWeight: 800,
  },
  row: {
    display: "grid",
    gridTemplateColumns: "120px 1fr",
    gap: "12px",
    padding: "12px 0",
    borderBottom: "1px solid #eef1f8",
  },
  label: {
    color: "#64748b",
    fontSize: "13px",
    fontWeight: 700,
  },
  value: {
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: 600,
  },
  muted: {
    color: "#51607a",
    padding: "8px 0",
  },
  error: {
    marginTop: "12px",
    color: "#b91c1c",
    fontSize: "15px",
  },
};
