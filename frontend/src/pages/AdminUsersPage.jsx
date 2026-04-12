import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { adminDeleteUser, adminPatchUser, fetchAdminUsers } from "../api";
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
  const amSuperuser = Boolean(me?.is_superuser);

  const handleToggleBlock = async (u) => {
    if (userActionBusyId != null) return;
    const next = !u.is_active;
    if (!next && u.is_superuser) return;
    setUserActionMessage(null);
    setUserActionBusyId(u.id);
    try {
      await adminPatchUser(u.id, next);
      await refreshUsers();
      setUserActionMessage(next ? `Unblocked ${u.name || u.email}.` : `Blocked ${u.name || u.email}.`);
    } catch (err) {
      setUserActionMessage(apiErrorMessage(err, "Could not update user."));
    } finally {
      setUserActionBusyId(null);
    }
  };

  const handleDeleteUser = async (u) => {
    if (userActionBusyId != null) return;
    const ok = window.confirm(
      `Permanently delete user "${u.name || u.email}"? Their wishlist and cart will be removed. Orders stay on record without this account.`,
    );
    if (!ok) return;
    setUserActionMessage(null);
    setUserActionBusyId(u.id);
    try {
      await adminDeleteUser(u.id);
      await refreshUsers();
      setUserActionMessage(`Deleted ${u.name || u.email}.`);
    } catch (err) {
      setUserActionMessage(apiErrorMessage(err, "Could not delete user."));
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
              const canDelete = !isSelf && !u.is_superuser && (!u.is_staff || amSuperuser);
              return (
                <tr key={u.id} style={u.is_active === false ? s.rowInactive : undefined}>
                  <td style={s.td}>{u.name}</td>
                  <td style={s.td}>{u.email || "-"}</td>
                  <td style={s.td}>{u.role}</td>
                  <td style={s.td}>
                    {u.is_active === false ? (
                      <span style={s.statusBlocked}>Blocked</span>
                    ) : (
                      <span style={s.statusActive}>Active</span>
                    )}
                  </td>
                  <td style={s.td}>{formatDateTime(u.date_joined)}</td>
                  <td style={s.tdActions}>
                    <div style={s.actionBtns}>
                      {canBlock ? (
                        <button
                          type="button"
                          style={u.is_active ? s.btnWarn : s.btnSecondary}
                          disabled={busy}
                          onClick={() => handleToggleBlock(u)}
                        >
                          {busy ? "…" : u.is_active ? "Block" : "Unblock"}
                        </button>
                      ) : null}
                      {canDelete ? (
                        <button type="button" style={s.btnDanger} disabled={busy} onClick={() => handleDeleteUser(u)}>
                          Delete
                        </button>
                      ) : null}
                      {!canBlock && !canDelete && !isSelf ? <span style={s.actionMuted}>—</span> : null}
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
