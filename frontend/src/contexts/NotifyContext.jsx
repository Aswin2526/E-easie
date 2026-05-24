import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const NotifyContext = createContext(null);

const VARIANT_META = {
  success: { accent: "#3b82f6", iconBg: "#dbeafe", iconColor: "#1d4ed8", glyph: "✓" },
  error: { accent: "#dc2626", iconBg: "#fee2e2", iconColor: "#b91c1c", glyph: "!" },
  warning: { accent: "#d97706", iconBg: "#fef3c7", iconColor: "#b45309", glyph: "!" },
  info: { accent: "#2563eb", iconBg: "#dbeafe", iconColor: "#1d4ed8", glyph: "i" },
};

function pack(variant, a, b) {
  if (a && typeof a === "object") {
    const duration = typeof a.duration === "number" ? a.duration : 5200;
    const title = String(a.title ?? "").trim();
    const message = String(a.message ?? "").trim();
    return { variant, duration, ...a, title, message };
  }
  if (b != null && String(b).length) {
    return { variant, title: String(a ?? "").trim(), message: String(b).trim(), duration: 5200 };
  }
  return { variant, title: String(a ?? "").trim(), message: "", duration: 5200 };
}

function Toast({ item, onDismiss }) {
  const meta = VARIANT_META[item.variant] || VARIANT_META.info;
  const hasTitle = item.title && String(item.title).trim().length > 0;
  const hasMessage = item.message && String(item.message).trim().length > 0;

  return (
    <div
      className="app-notify-toast"
      role="alert"
      style={{
        pointerEvents: "auto",
        display: "flex",
        gap: "14px",
        alignItems: "flex-start",
        padding: "14px 16px",
        borderRadius: "12px",
        background: "#fff",
        boxShadow: "0 10px 40px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(15, 23, 42, 0.06)",
        borderLeft: `4px solid ${meta.accent}`,
        maxWidth: "min(400px, calc(100vw - 32px))",
      }}
    >
      <div
        aria-hidden
        style={{
          flexShrink: 0,
          width: "36px",
          height: "36px",
          borderRadius: "10px",
          background: meta.iconBg,
          color: meta.iconColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
          fontWeight: "800",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {meta.glyph}
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingTop: "2px" }}>
        {hasTitle ? (
          <p style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "#0f172a", lineHeight: 1.35 }}>
            {item.title}
          </p>
        ) : null}
        {hasMessage ? (
          <p
            style={{
              margin: hasTitle ? "6px 0 0 0" : 0,
              fontSize: "14px",
              color: "#475569",
              lineHeight: 1.5,
              wordBreak: "break-word",
            }}
          >
            {item.message}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        aria-label="Dismiss notification"
        style={{
          flexShrink: 0,
          margin: 0,
          padding: "4px 8px",
          border: "none",
          background: "transparent",
          color: "#94a3b8",
          fontSize: "20px",
          lineHeight: 1,
          cursor: "pointer",
          borderRadius: "6px",
        }}
      >
        ×
      </button>
    </div>
  );
}

export function NotifyProvider({ children }) {
  const [items, setItems] = useState([]);
  const timersRef = useRef(new Map());

  const dismiss = useCallback((id) => {
    const t = timersRef.current.get(id);
    if (t) clearTimeout(t);
    timersRef.current.delete(id);
    setItems((xs) => xs.filter((x) => x.id !== id));
  }, []);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current.clear();
    };
  }, []);

  const push = useCallback(
    (raw) => {
      const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const duration = typeof raw.duration === "number" ? raw.duration : 5200;
      const entry = { ...raw, id, duration };
      setItems((xs) => [...xs.slice(-4), entry]);
      if (duration > 0) {
        const t = setTimeout(() => dismiss(id), duration);
        timersRef.current.set(id, t);
      }
      return id;
    },
    [dismiss]
  );

  const notify = useCallback(
    (opts) => {
      if (typeof opts === "string") {
        return push({ variant: "info", title: String(opts).trim(), message: "", duration: 5200 });
      }
      const duration = typeof opts.duration === "number" ? opts.duration : 5200;
      return push({
        variant: "info",
        duration,
        ...opts,
        title: String(opts?.title ?? "").trim(),
        message: String(opts?.message ?? "").trim(),
      });
    },
    [push]
  );

  const success = useCallback((a, b) => push(pack("success", a, b)), [push]);
  const error = useCallback((a, b) => push(pack("error", a, b)), [push]);
  const warning = useCallback((a, b) => push(pack("warning", a, b)), [push]);
  const info = useCallback((a, b) => push(pack("info", a, b)), [push]);

  const value = useMemo(
    () => ({ notify, success, error, warning, info, dismiss }),
    [notify, success, error, warning, info, dismiss]
  );

  const stack =
    items.length === 0 ? null : (
      <div
        aria-live="polite"
        aria-relevant="additions text"
        aria-label="Notifications"
        style={{
          position: "fixed",
          top: "max(16px, env(safe-area-inset-top))",
          right: "max(16px, env(safe-area-inset-right))",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          alignItems: "flex-end",
          pointerEvents: "none",
        }}
      >
        {items.map((item) => (
          <Toast key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </div>
    );

  return (
    <NotifyContext.Provider value={value}>
      {children}
      {typeof document !== "undefined" ? createPortal(stack, document.body) : null}
    </NotifyContext.Provider>
  );
}

export function useNotify() {
  const ctx = useContext(NotifyContext);
  if (!ctx) {
    throw new Error("useNotify must be used within NotifyProvider");
  }
  return ctx;
}
