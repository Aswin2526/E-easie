import React from "react";

export const AUTH = {
  pageBg: "#FFF8E7",
  cardBg: "#EBEBFF",
  cardBorder: "#5D2E14",
  fieldBg: "#F2F2F7",
  accent: "#3B3B75",
  buttonBg: "#5B5BBF",
  buttonText: "#FFFFFF",
};

const iconProps = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: AUTH.accent,
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function IconPerson() {
  return (
    <svg {...iconProps}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function IconEnvelope() {
  return (
    <svg {...iconProps}>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

export function IconLock() {
  return (
    <svg {...iconProps}>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function IconUsers() {
  return (
    <svg {...iconProps}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function AuthGlobalStyles() {
  return (
    <style>{`
      .auth-ui-input::placeholder {
        color: ${AUTH.accent};
        font-weight: 700;
        opacity: 0.95;
      }
      .auth-ui-input {
        font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        font-weight: 700;
      }
      .auth-ui-select {
        font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        font-weight: 700;
        color: ${AUTH.accent};
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%233B3B75' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 14px center;
        padding-right: 36px;
      }
      .auth-ui-footer a {
        color: ${AUTH.accent};
        font-weight: 700;
        text-decoration: underline;
        text-underline-offset: 2px;
      }
    `}</style>
  );
}

const fieldWrap = {
  display: "flex",
  alignItems: "stretch",
  border: `1px solid ${AUTH.accent}`,
  borderRadius: 14,
  overflow: "hidden",
  background: AUTH.fieldBg,
  marginBottom: 16,
  boxSizing: "border-box",
};

const iconCell = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 52,
  flexShrink: 0,
  borderRight: `1px solid ${AUTH.accent}`,
};

const inputBase = {
  width: "100%",
  padding: "14px 16px",
  border: "none",
  background: "transparent",
  fontSize: 15,
  color: AUTH.accent,
  outline: "none",
  boxSizing: "border-box",
};

export function AuthField({ icon, children }) {
  return (
    <div style={fieldWrap}>
      <div style={iconCell}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center" }}>{children}</div>
    </div>
  );
}

export function authPageStyle() {
  return {
    flex: 1,
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: AUTH.pageBg,
    padding: 24,
    boxSizing: "border-box",
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  };
}

export function authCardStyle() {
  return {
    background: AUTH.cardBg,
    padding: "40px 36px",
    width: "100%",
    maxWidth: 400,
    borderRadius: 32,
    border: `2px solid ${AUTH.cardBorder}`,
    boxSizing: "border-box",
  };
}

export function authButtonStyle(disabled) {
  return {
    width: "100%",
    padding: "14px 16px",
    marginTop: 8,
    background: AUTH.buttonBg,
    color: AUTH.buttonText,
    border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    borderRadius: 14,
    fontWeight: 800,
    fontSize: 15,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    opacity: disabled ? 0.75 : 1,
  };
}

export function authInputProps() {
  return {
    className: "auth-ui-input",
    style: inputBase,
  };
}

export function authSelectProps() {
  return {
    className: "auth-ui-input auth-ui-select",
    style: { ...inputBase, cursor: "pointer", width: "100%" },
  };
}

export function authErrorStyle() {
  return {
    color: "#9a3412",
    fontSize: 13,
    fontWeight: 700,
    marginTop: 4,
    marginBottom: 8,
    textAlign: "left",
  };
}

export function authFooterStyle() {
  return {
    marginTop: 22,
    fontSize: 14,
    fontWeight: 700,
    color: AUTH.accent,
    textAlign: "center",
    lineHeight: 1.5,
  };
}
