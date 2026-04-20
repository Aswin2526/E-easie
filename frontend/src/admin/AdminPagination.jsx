import React, { useEffect, useMemo, useState } from "react";

export const ADMIN_PAGE_SIZE = 5;

/**
 * Client-side pagination for admin tables.
 * @param {unknown[]} filteredItems - full filtered list
 * @param {unknown} resetKey - when this reference changes, page resets to 1
 */
export function useAdminPagination(filteredItems, resetKey) {
  const [page, setPage] = useState(1);
  const totalCount = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / ADMIN_PAGE_SIZE) || 1);

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const safePage = Math.min(Math.max(1, page), totalPages);
  const slice = useMemo(() => {
    const start = (safePage - 1) * ADMIN_PAGE_SIZE;
    return filteredItems.slice(start, start + ADMIN_PAGE_SIZE);
  }, [filteredItems, safePage]);

  return {
    page: safePage,
    setPage,
    pageItems: slice,
    totalPages,
    totalCount,
    pageSize: ADMIN_PAGE_SIZE,
  };
}

export function AdminPaginationBar({ page, totalPages, totalCount, onPrev, onNext }) {
  if (totalCount <= ADMIN_PAGE_SIZE) return null;
  const from = (page - 1) * ADMIN_PAGE_SIZE + 1;
  const to = Math.min(page * ADMIN_PAGE_SIZE, totalCount);
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding: "12px 16px",
        borderTop: "1px solid #eef1f8",
        background: "#fafbfc",
      }}
    >
      <span style={{ fontSize: "13px", color: "#64748b" }}>
        Showing {from}–{to} of {totalCount}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button
          type="button"
          onClick={onPrev}
          disabled={page <= 1}
          style={{ ...navBtn, ...(page <= 1 ? navBtnDisabled : {}) }}
        >
          Previous
        </button>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a2e" }}>
          Page {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={page >= totalPages}
          style={{ ...navBtn, ...(page >= totalPages ? navBtnDisabled : {}) }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

const navBtn = {
  padding: "8px 14px",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  background: "#fff",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  color: "#1e293b",
};

const navBtnDisabled = {
  opacity: 0.45,
  cursor: "not-allowed",
};
