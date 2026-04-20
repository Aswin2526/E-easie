import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { adminPatchUser, fetchAdminUsers } from "../api";
import { adminSharedStyles as s } from "../admin/sharedStyles";
import { AdminPaginationBar, useAdminPagination } from "../admin/AdminPagination";
import { apiErrorMessage, matchesSearch } from "../admin/adminUtils";

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

/** Coerce API `is_active` to boolean so blocked users always show Inactive in the UI. */
function normalizeIsActive(value) {
  if (value === false || value === 0) return false;
  if (value === true || value === 1) return true;
  if (typeof value === "string") {
    const s = value.trim().toLowerCase();
    if (s === "false" || s === "0" || s === "no" || s === "off") return false;
    if (s === "true" || s === "1" || s === "yes" || s === "on") return true;
  }
  return true;
}

function normalizeUserRow(u) {
  return { ...u, is_active: normalizeIsActive(u?.is_active) };
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
    const list = res?.users || [];
    setUsers(list.map(normalizeUserRow));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refreshUsers();
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err, "Failed to load customers."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshUsers]);

  const filtered = useMemo(() => {
    return users.filter((u) => matchesSearch(searchQuery, u.id, u.name, u.email));
  }, [users, searchQuery]);

  const paginationResetKey = `${searchQuery}`;
  const { page, setPage, pageItems, totalPages, totalCount } = useAdminPagination(
    filtered,
    paginationResetKey
  );

  const myId = me?.id;
  const handleSetActive = async (u, isActive) => {
    if (userActionBusyId != null) return;
    if (!isActive && u.is_superuser) return;
    setUserActionMessage(null);
    setUserActionBusyId(u.id);
    try {
      const patchResult = await adminPatchUser(u.id, isActive);
      const nextActive = normalizeIsActive(
        patchResult?.is_active !== undefined ? patchResult.is_active : isActive
      );
      setUsers((prev) =>
        prev.map((row) => (row.id === u.id ? { ...row, is_active: nextActive } : row))
      );
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
        <p style={s.muted}>Loading customers…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={inner}>
        <section style={s.panel}>
          <h2 style={s.heading}>Customers</h2>
          <p style={s.error}>{error}</p>
        </section>
      </main>
    );
  }

  return (
    <main style={inner}>
      <section style={s.tableCard}>
        <h2 style={s.tableTitle}>Customers</h2>
        <p style={s.tableHint}>
          Customer accounts only (up to 50 recent). Staff are not listed here. Blocked customers cannot sign in until
          unblocked.
        </p>
        {userActionMessage ? <p style={s.userActionBanner}>{userActionMessage}</p> : null}
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Name</th>
              <th style={s.th}>Email</th>
              <th style={s.th}>Status</th>
              <th style={s.th}>Joined</th>
              <th style={s.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((u) => {
              const isSelf = myId != null && u.id === myId;
              const busy = userActionBusyId === u.id;
              const canToggleBlock = !isSelf && !u.is_superuser;
              const userIsActive = normalizeIsActive(u.is_active);
              return (
                <tr key={u.id} style={userIsActive === false ? s.rowInactive : undefined}>
                  <td style={s.td}>{u.name}</td>
                  <td style={s.td}>{u.email || "-"}</td>
                  <td style={s.td}>
                    <select
                      style={{
                        ...statusSelect,
                        color: userIsActive ? "#15803d" : "#b91c1c",
                      }}
                      value={userIsActive ? "active" : "inactive"}
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
                      {canToggleBlock ? (
                        userIsActive ? (
                          <button
                            type="button"
                            style={blockBtn}
                            disabled={busy}
                            onClick={() => handleSetActive(u, false)}
                          >
                            {busy ? "…" : "Block"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            style={unblockBtn}
                            disabled={busy}
                            onClick={() => handleSetActive(u, true)}
                          >
                            {busy ? "…" : "Unblock"}
                          </button>
                        )
                      ) : null}
                      {!canToggleBlock && !isSelf ? <span style={s.actionMuted}>—</span> : null}
                      {isSelf ? <span style={s.actionMuted}>You</span> : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <AdminPaginationBar
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
        />
        {filtered.length === 0 ? <p style={{ ...s.muted, padding: "16px" }}>No customers match your search.</p> : null}
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

const unblockBtn = {
  ...s.btnWarn,
  color: "#fff",
  background: "#15803d",
  border: "1px solid #166534",
};
