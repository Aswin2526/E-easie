import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { adminPatchUser, fetchAdminUsers } from "../api";
import { adminSharedStyles as s } from "../admin/sharedStyles";
import { apiErrorMessage, matchesSearch } from "../admin/adminUtils";

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

export default function AdminUsersPage() {
  const { me, searchQuery } = useOutletContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [userActionBusyId, setUserActionBusyId] = useState(null);
  const [userActionMessage, setUserActionMessage] = useState(null);

  const refreshUsers = useCallback(async () => {
    const res = await fetchAdminUsers();
    setUsers(res?.users || []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refreshUsers();
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err, "Failed to load users."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshUsers]);

  const filtered = useMemo(() => {
    return users.filter((u) =>
      matchesSearch(searchQuery, u.id, u.name, u.email, u.role),
    );
  }, [users, searchQuery]);

  const myId = me?.id;
  const handleSetActive = async (u, isActive) => {
    if (userActionBusyId != null) return;
    if (!isActive && u.is_superuser) return;
    setUserActionMessage(null);
    setUserActionBusyId(u.id);
    try {
      await adminPatchUser(u.id, isActive);
      await refreshUsers();
      setUserActionMessage(
        isActive ? `Set ${u.name || u.email} to Active.` : `Set ${u.name || u.email} to Inactive.`,
      );
    } catch (err) {
      setUserActionMessage(apiErrorMessage(err, "Could not update user."));
    } finally {
      setUserActionBusyId(null);
    }
  };

  if (loading) {
    return (
      <main style={inner}>
        <p style={s.muted}>Loading users…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={inner}>
        <section style={s.panel}>
          <h2 style={s.heading}>Users</h2>
          <p style={s.error}>{error}</p>
        </section>
      </main>
    );
  }

  return (
    <main style={inner}>
      <section style={s.tableCard}>
        <h2 style={s.tableTitle}>Users</h2>
        <p style={s.tableHint}>
          Customer accounts only (up to 50 recent). Staff are not listed here. Blocked users cannot sign in until
          unblocked.
        </p>
        {userActionMessage ? <p style={s.userActionBanner}>{userActionMessage}</p> : null}
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Name</th>
              <th style={s.th}>Email</th>
              <th style={s.th}>Role</th>
              <th style={s.th}>Status</th>
              <th style={s.th}>Joined</th>
              <th style={s.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const isSelf = myId != null && u.id === myId;
              const busy = userActionBusyId === u.id;
              const canBlock = !isSelf && !u.is_superuser;
              return (
                <tr key={u.id} style={u.is_active === false ? s.rowInactive : undefined}>
                  <td style={s.td}>{u.name}</td>
                  <td style={s.td}>{u.email || "-"}</td>
                  <td style={s.td}>{u.role}</td>
                  <td style={s.td}>
                    <select
                      style={{
                        ...statusSelect,
                        color: u.is_active ? "#15803d" : "#b91c1c",
                      }}
                      value={u.is_active ? "active" : "inactive"}
                      disabled={busy || isSelf}
                      onChange={(e) => handleSetActive(u, e.target.value === "active")}
                      aria-label={`Status for ${u.name || u.email}`}
                    >
                      <option value="active" style={{ color: "#15803d" }}>
                        Active
                      </option>
                      <option value="inactive" style={{ color: "#b91c1c" }}>
                        Inactive
                      </option>
                    </select>
                  </td>
                  <td style={s.td}>{formatDateTime(u.date_joined)}</td>
                  <td style={s.tdActions}>
                    <div style={s.actionBtns}>
                      {canBlock ? (
                        <button
                          type="button"
                          style={blockBtn}
                          disabled={busy}
                          onClick={() => handleSetActive(u, false)}
                        >
                          {busy ? "…" : "Block"}
                        </button>
                      ) : null}
                      {!canBlock && !isSelf ? <span style={s.actionMuted}>—</span> : null}
                      {isSelf ? <span style={s.actionMuted}>You</span> : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 ? <p style={{ ...s.muted, padding: "16px" }}>No users match your search.</p> : null}
      </section>
    </main>
  );
}

const inner = {
  padding: "24px 28px 40px",
  maxWidth: "1280px",
  margin: "0 auto",
  width: "100%",
  boxSizing: "border-box",
};

const statusSelect = {
  minWidth: "96px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  padding: "6px 10px",
  fontSize: "12px",
  fontWeight: 600,
  color: "#1f2937",
  background: "#fff",
};

const blockBtn = {
  ...s.btnWarn,
  color: "#fff",
  background: "#000",
  border: "1px solid #000",
};
