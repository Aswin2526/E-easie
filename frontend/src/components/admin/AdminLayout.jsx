import React, { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { clearAuth, fetchCurrentUser } from "../../api";

const SIDEBAR_ITEMS = [
  { label: "Dashboard", to: "/admin/dashboard", end: true },
  { label: "Customers", to: "/admin/users" },
  { label: "Orders", to: "/admin/orders" },
  { label: "Products", to: "/admin/products" },
  { label: "Report", to: "/admin/report" },
];

const TITLE_BY_PATH = [
  [/^\/admin\/users\/?$/, "Customers"],
  [/^\/admin\/orders\/?$/, "Orders"],
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

function AdminTopBar({ me, title }) {
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
      <div style={styles.topNavRight}>
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
            height: auto !important;
            min-height: 100vh;
            max-height: none !important;
            overflow: visible !important;
          }
          .admin-sidebar {
            width: 100% !important;
            max-width: none !important;
            min-height: auto;
            flex-shrink: 0;
          }
          .admin-main-column {
            flex: 1 1 auto;
            min-height: min(60vh, 480px);
            overflow: hidden;
          }
          .admin-dashboard-main-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <AdminSidebar />
      <div className="admin-main-column" style={styles.mainColumn}>
        <AdminTopBar
          me={me}
          title={title}
        />
        <div style={styles.pageContent} data-admin-page-content>
          <Outlet context={outletContext} />
        </div>
      </div>
    </div>
  );
}

const styles = {
  layoutRoot: {
    display: "flex",
    height: "100vh",
    maxHeight: "100vh",
    overflow: "hidden",
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
    alignSelf: "stretch",
    overflowY: "auto",
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
    minHeight: 0,
    overflow: "hidden",
    background: "#F9FAFB",
  },
  topNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
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
  topNavRight: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    flexShrink: 0,
    marginLeft: "auto",
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
    minHeight: 0,
    overflow: "auto",
    background: "#F9FAFB",
  },
};
