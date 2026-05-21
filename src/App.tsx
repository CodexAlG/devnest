import { useState, useEffect } from "react";
import { NavLink, Routes, Route } from "react-router-dom";

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

function PagePlaceholder({ name }: { name: string }): React.JSX.Element {
  return (
    <div style={{ textAlign: "center", marginTop: "20vh" }}>
      <h1 style={{ fontSize: "2rem", color: "var(--text-primary)", marginBottom: "8px" }}>
        {name}
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>Próximamente</p>
    </div>
  );
}

function App(): React.JSX.Element {
  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw" }}>
      {/* SIDEBAR */}
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
        {/* Logo */}
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

        {/* Navigation */}
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

        {/* Footer - User */}
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
            CO
          </div>
          <div style={{ overflow: "hidden" }}>
            <p style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)" }}>
              Coordinador
            </p>
            <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>coordinator</p>
          </div>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* TOPBAR */}
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
          <PageTitle />
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

        {/* CONTENT */}
        <main
          style={{
            flex: 1,
            background: "var(--bg-base)",
            padding: "24px",
            overflowY: "auto",
          }}
        >
          <Routes>
            <Route path="/" element={<PagePlaceholder name="Dashboard" />} />
            <Route path="/proyectos" element={<PagePlaceholder name="Proyectos" />} />
            <Route path="/board" element={<PagePlaceholder name="Board" />} />
            <Route path="/backlog" element={<PagePlaceholder name="Backlog" />} />
            <Route path="/sprints" element={<PagePlaceholder name="Sprints" />} />
            <Route path="/chat" element={<PagePlaceholder name="Chat" />} />
            <Route path="/reportes" element={<PagePlaceholder name="Reportes" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function PageTitle(): React.JSX.Element {
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

  return <span style={{ fontWeight: 600, fontSize: "14px" }}>{title}</span>;
}

export default App;
