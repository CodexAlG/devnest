import { useState } from "react";
import { useProjectStore } from "../store/projectStore";
import { useAuthStore } from "../store/authStore";
import { usePresence } from "../hooks/usePresence";

export default function MembersSidebar({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { members, activeProject } = useProjectStore();
  const { user } = useAuthStore();
  const { onlineUsers } = usePresence();
  const [tab, setTab] = useState<"online" | "offline">("online");

  const displayMembers = activeProject ? members : [];
  const allUsers = displayMembers.map((m) => m.profile).filter(Boolean);

  const online = allUsers.filter((p) => p && (onlineUsers.has(p.id) || p.id === user?.id));
  const offline = allUsers.filter((p) => p && !onlineUsers.has(p.id) && p.id !== user?.id);

  const list = tab === "online" ? online : offline;

  return (
    <>
      {open && (
        <aside
          style={{
            width: "220px",
            background: "var(--bg-sidebar)",
            borderLeft: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
          }}
        >
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
              {activeProject ? activeProject.name : "Miembros"}
            </span>
          </div>

          <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
            <button
              onClick={() => setTab("online")}
              style={{
                flex: 1, padding: "8px", fontSize: "11px", fontWeight: 600,
                background: tab === "online" ? "var(--bg-active)" : "transparent",
                border: "none", color: tab === "online" ? "var(--accent)" : "var(--text-muted)",
                cursor: "pointer",
              }}
            >
              En línea ({online.length})
            </button>
            <button
              onClick={() => setTab("offline")}
              style={{
                flex: 1, padding: "8px", fontSize: "11px", fontWeight: 600,
                background: tab === "offline" ? "var(--bg-active)" : "transparent",
                border: "none", color: tab === "offline" ? "var(--accent)" : "var(--text-muted)",
                cursor: "pointer",
              }}
            >
              Desconectados ({offline.length})
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
            {list.length === 0 ? (
              <div style={{ padding: "16px", textAlign: "center", fontSize: "12px", color: "var(--text-muted)" }}>
                No hay miembros
              </div>
            ) : (
              list.map((p) =>
                p ? (
                  <div
                    key={p.id}
                    style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      padding: "8px", borderRadius: "var(--radius-md)",
                    }}
                  >
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <div
                        style={{
                          width: "28px", height: "28px", borderRadius: "50%",
                          background: "var(--accent-soft)", color: "var(--accent)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "10px", fontWeight: 700,
                        }}
                      >
                        {p.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div
                        style={{
                          position: "absolute", bottom: "-1px", right: "-1px",
                          width: "10px", height: "10px", borderRadius: "50%",
                          background: tab === "online" || onlineUsers.has(p.id) ? "var(--success)" : "var(--text-muted)",
                          border: "2px solid var(--bg-sidebar)",
                        }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                        {p.role}
                      </div>
                    </div>
                  </div>
                ) : null
              )
            )}
          </div>
        </aside>
      )}

      <button
        onClick={onToggle}
        title={open ? "Cerrar miembros" : "Abrir miembros"}
        style={{
          position: "fixed", right: open ? "220px" : "0", top: "50%", transform: "translateY(-50%)",
          background: "var(--bg-sidebar)", border: "1px solid var(--border)", borderRight: "none",
          color: "var(--text-muted)", cursor: "pointer", padding: "8px 4px",
          borderRadius: "var(--radius-md) 0 0 var(--radius-md)", fontSize: "12px", zIndex: 100,
          transition: "right 0.15s",
        }}
      >
        {open ? "\u25B6" : "\u25C0"}
      </button>
    </>
  );
}
