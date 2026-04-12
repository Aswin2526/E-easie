import React, { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { clearAuth, fetchCurrentUser } from "../../api";

const SIDEBAR_ITEMS = [
  { label: "Dashboard", to: "/admin/dashboard", end: true },
  { label: "Users", to: "/admin/users" },
  { label: "Products", to: "/admin/products" },
  { label: "Payment", to: "/admin/payment" },
  { label: "Report", to: "/admin/report" },
];

const TITLE_BY_PATH = [
  [/^\/admin\/users\/?$/, "Users"],
  [/^\/admin\/products\/?$/, "Products"],
  [/^\/admin\/payment\/?$/, "Payment"],
  [/^\/admin\/report\/?$/, "Report"],
  [/^\/admin\/dashboard\/?$/, "Dashboard"],
  [/^\/admin\/?$/, "Dashboard"],
];

function pageTitle(pathname) {
  for (const [re, title] of TITLE_BY_PATH) {
    if (re.test(pathname)) return title;
  }
  return "Admin";
}

function AdminSidebar() {
  return (
    <aside className="admin-sidebar" style={styles.sidebar}>
      <div style={styles.sidebarBrand}>
        <div style={styles.sidebarLogo} aria-hidden>
          E
        </div>
        <div>
          <div style={styles.sidebarBrandName}>E-easie</div>
          <div style={styles.sidebarBrandTag}>ADMIN</div>
        </div>
      </div>
      <nav style={styles.sidebarNav} aria-label="Admin navigation">
        {SIDEBAR_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            style={({ isActive }) => ({
              ...styles.navItem,
              ...(isActive ? styles.navItemActive : {}),
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

function AdminTopBar({ me, title, searchQuery, setSearchQuery }) {
  const navigate = useNavigate();
  const name = (me?.user?.name && String(me.user.name).trim()) || me?.user?.email || "admin";
  const displayName = name.includes("@") ? name.split("@")[0] : name;
  const initial = (displayName[0] || "A").toUpperCase();
  const roleLabel = me?.is_superuser ? "Administrator" : "Administrator";

  const handleLogout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  return (
    <header style={styles.topNav}>
      <h1 style={styles.topNavTitle}>{title}</h1>
      <div style={styles.searchWrap}>
        <label style={styles.searchBar} htmlFor="admin-global-search">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9ca3af"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            id="admin-global-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order ID, name, or email…"
            style={styles.searchInput}
          />
        </label>
      </div>
      <div style={styles.topNavRight}>
        <button type="button" style={styles.iconBtn} aria-label="Notifications">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
        <div style={styles.userBlock}>
          <div style={styles.userAvatar} aria-hidden>
            {initial}
          </div>
          <div style={styles.userText}>
            <span style={styles.userName}>{displayName}</span>
            <span style={styles.userRole}>{roleLabel}</span>
          </div>
        </div>
        <button type="button" style={styles.logoutBtn} onClick={handleLogout}>
          Log out
        </button>
      </div>
    </header>
  );
}

export default function AdminLayout() {
  const { pathname } = useLocation();
  const [me, setMe] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await fetchCurrentUser();
        if (!cancelled) setMe(profile);
      } catch {
        if (!cancelled) setMe(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const title = useMemo(() => pageTitle(pathname), [pathname]);

  const outletContext = useMemo(
    () => ({ me, searchQuery, setSearchQuery }),
    [me, searchQuery],
  );

  return (
    <div className="admin-app-layout" style={styles.layoutRoot}>
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap");
        .admin-app-layout {
          font-family: "Inter", system-ui, -apple-system, sans-serif;
        }
        @media (max-width: 900px) {
          .admin-app-layout {
            flex-direction: column;
          }
          .admin-sidebar {
            width: 100% !important;
            max-width: none !important;
            min-height: auto;
          }
          .admin-dashboard-main-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <AdminSidebar />
      <div style={styles.mainColumn}>
        <AdminTopBar
          me={me}
          title={title}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <div style={styles.pageContent}>
          <Outlet context={outletContext} />
        </div>
      </div>
    </div>
  );
}

const styles = {
  layoutRoot: {
    display: "flex",
    minHeight: "100vh",
    background: "#F9FAFB",
    boxSizing: "border-box",
  },
  sidebar: {
    width: "18%",
    minWidth: "240px",
    maxWidth: "280px",
    background: "#111827",
    padding: "28px 20px",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    boxSizing: "border-box",
  },
  sidebarBrand: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "36px",
    paddingLeft: "4px",
  },
  sidebarLogo: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 800,
    fontSize: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sidebarBrandName: {
    color: "#fff",
    fontWeight: 700,
    fontSize: "17px",
    letterSpacing: "-0.02em",
    lineHeight: 1.2,
  },
  sidebarBrandTag: {
    color: "#9ca3af",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.14em",
    marginTop: "4px",
  },
  sidebarNav: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  navItem: {
    display: "block",
    color: "#fff",
    textDecoration: "none",
    fontSize: "15px",
    fontWeight: 500,
    padding: "12px 16px",
    borderRadius: "10px",
    transition: "background 0.15s ease",
  },
  navItemActive: {
    background: "rgba(255, 255, 255, 0.1)",
  },
  mainColumn: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    background: "#F9FAFB",
  },
  topNav: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    background: "#fff",
    padding: "16px 28px",
    borderBottom: "1px solid #f3f4f6",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
    flexShrink: 0,
  },
  topNavTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 700,
    color: "#111827",
    flexShrink: 0,
  },
  searchWrap: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    minWidth: "200px",
    padding: "0 12px",
  },
  searchBar: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    width: "100%",
    maxWidth: "520px",
    padding: "10px 18px",
    borderRadius: "999px",
    border: "1px solid #e5e7eb",
    background: "#fff",
    boxSizing: "border-box",
  },
  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "14px",
    color: "#111827",
    background: "transparent",
    minWidth: 0,
    fontFamily: "inherit",
  },
  topNavRight: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    flexShrink: 0,
  },
  iconBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px",
    border: "none",
    background: "transparent",
    borderRadius: "10px",
    cursor: "pointer",
  },
  logoutBtn: {
    fontSize: "13px",
    fontWeight: 600,
    padding: "8px 14px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    color: "#374151",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  userBlock: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  userAvatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "#7c3aed",
    color: "#fff",
    fontWeight: 700,
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  userText: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    lineHeight: 1.2,
  },
  userName: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#111827",
  },
  userRole: {
    fontSize: "13px",
    color: "#6b7280",
    fontWeight: 500,
  },
  pageContent: {
    flex: 1,
    overflow: "auto",
    background: "#F9FAFB",
  },
};
