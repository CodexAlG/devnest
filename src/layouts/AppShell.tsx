import { useState, useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const navItems = [
  { path: "/", label: "Dashboard", icon: "\u229E" },
  { path: "/proyectos", label: "Proyectos", icon: "\u25C8" },
  { path: "/board", label: "Board", icon: "\u25A6" },
  { path: "/backlog", label: "Backlog", icon: "\u2630" },
  { path: "/sprints", label: "Sprints", icon: "\u25CE" },
];

const commItems = [
  { path: "/chat", label: "Chat", icon: "\u25FB" },
  { path: "/reportes", label: "Reportes", icon: "\u220E" },
];

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/proyectos": "Proyectos",
  "/board": "Board",
  "/backlog": "Backlog",
  "/sprints": "Sprints",
  "/chat": "Chat",
  "/reportes": "Reportes",
};

export default function AppShell(): React.JSX.Element {
  const { user, logout } = useAuth();
  const [title, setTitle] = useState("Dashboard");

  useEffect(() => {
    const path = window.location.hash.replace("#", "") || "/";
    setTitle(pageTitles[path] || "DevNest");

    const handler = () => {
      const p = window.location.hash.replace("#", "") || "/";
      setTitle(pageTitles[p] || "DevNest");
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw" }}>
      <aside
        style={{
          width: "var(--sidebar-width)",
          background: "var(--bg-sidebar)",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "var(--radius-md)",
              background: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "14px",
              color: "#fff",
            }}
          >
            DN
          </div>
          <span style={{ fontWeight: 700, fontSize: "16px", color: "var(--accent)" }}>
            DevNest
          </span>
        </div>

        <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
          <p
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--text-muted)",
              letterSpacing: "0.08em",
              padding: "8px 12px 4px",
            }}
          >
            WORKSPACE
          </p>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 12px",
                borderRadius: "var(--radius-md)",
                textDecoration: "none",
                color: isActive ? "var(--accent)" : "var(--text-secondary)",
                background: isActive ? "var(--bg-active)" : "transparent",
                fontWeight: isActive ? 600 : 400,
                fontSize: "13px",
                marginBottom: "2px",
              })}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                if (!el.style.background || el.style.background === "transparent") {
                  el.style.background = "var(--bg-hover)";
                }
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                if (el.style.background === "var(--bg-hover)") {
                  el.style.background = "transparent";
                }
              }}
            >
              <span style={{ fontSize: "16px", width: "20px", textAlign: "center" }}>
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}

          <p
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--text-muted)",
              letterSpacing: "0.08em",
              padding: "16px 12px 4px",
              marginTop: "8px",
              borderTop: "1px solid var(--border)",
            }}
          >
            COMUNICACIÓN
          </p>
          {commItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 12px",
                borderRadius: "var(--radius-md)",
                textDecoration: "none",
                color: isActive ? "var(--accent)" : "var(--text-secondary)",
                background: isActive ? "var(--bg-active)" : "transparent",
                fontWeight: isActive ? 600 : 400,
                fontSize: "13px",
                marginBottom: "2px",
              })}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                if (!el.style.background || el.style.background === "transparent") {
                  el.style.background = "var(--bg-hover)";
                }
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                if (el.style.background === "var(--bg-hover)") {
                  el.style.background = "transparent";
                }
              }}
            >
              <span style={{ fontSize: "16px", width: "20px", textAlign: "center" }}>
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "var(--accent-soft)",
              color: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "12px",
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ overflow: "hidden", flex: 1 }}>
            <p
              style={{
                fontWeight: 600,
                fontSize: "13px",
                color: "var(--text-primary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user?.name || "Usuario"}
            </p>
            <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{user?.role}</p>
          </div>
          <button
            onClick={logout}
            title="Cerrar sesión"
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: "16px",
              padding: "4px",
              lineHeight: 1,
            }}
          >
            &#x23FB;
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header
          style={{
            height: "var(--topbar-height)",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
            flexShrink: 0,
          }}
        >
          <span style={{ fontWeight: 600, fontSize: "14px" }}>{title}</span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              color: "var(--success)",
              fontWeight: 500,
            }}
          >
            <span style={{ fontSize: "10px" }}>&#9679;</span>
            Conectado
          </div>
        </header>

        <main
          style={{
            flex: 1,
            background: "var(--bg-base)",
            padding: "24px",
            overflowY: "auto",
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
