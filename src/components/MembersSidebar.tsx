import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { useAuthStore } from "../store/authStore";
import { usePresence } from "../hooks/usePresence";
import type { AppUser } from "../types/entities";

import type { PostgrestResponse } from "@supabase/supabase-js";

let cached: AppUser[] | null = null;

function getAllUsers(): Promise<AppUser[]> {
  if (cached) return Promise.resolve(cached);
  return supabase.from("profiles").select("*").order("name").then(
    (res: PostgrestResponse<AppUser>) => {
      const result = (res.data as AppUser[]) || [];
      cached = result;
      return result;
    }
  );
}

export default function MembersSidebar({ open }: { open: boolean }) {
  const { user } = useAuthStore();
  const { onlineUsers } = usePresence();
  const [users, setUsers] = useState<AppUser[]>([]);

  useEffect(() => {
    getAllUsers().then(setUsers);
  }, []);

  const online: AppUser[] = [];
  const offline: AppUser[] = [];

  users.forEach((u) => {
    if (u.id === user?.id || onlineUsers.has(u.id)) {
      online.push(u);
    } else {
      offline.push(u);
    }
  });

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
              Miembros — {users.length}
            </span>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
            {online.length > 0 && (
              <>
                <div style={{ padding: "8px 8px 4px", fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  En línea — {online.length}
                </div>
                {online.map((u) => (
                  <MemberRow key={u.id} user={u} online currentUserId={user?.id} />
                ))}
              </>
            )}

            {offline.length > 0 && (
              <>
                <div style={{ padding: "12px 8px 4px", fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Desconectados — {offline.length}
                </div>
                {offline.map((u) => (
                  <MemberRow key={u.id} user={u} online={false} currentUserId={user?.id} />
                ))}
              </>
            )}

            {users.length === 0 && (
              <div style={{ padding: "16px", textAlign: "center", fontSize: "12px", color: "var(--text-muted)" }}>
                Cargando...
              </div>
            )}
          </div>
        </aside>
      )}
    </>
  );
}

function MemberRow({ user: u, online: isOnline, currentUserId }: { user: AppUser; online: boolean; currentUserId?: string }) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: "8px",
        padding: "6px 8px", borderRadius: "var(--radius-md)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
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
          {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
        </div>
        <div
          style={{
            position: "absolute", bottom: "0", right: "0",
            width: "10px", height: "10px", borderRadius: "50%",
            background: isOnline ? "var(--success)" : "var(--text-muted)",
            border: "2px solid var(--bg-sidebar)",
          }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {u.name}
          {u.id === currentUserId && <span style={{ color: "var(--text-muted)", fontWeight: 400, marginLeft: "4px", fontSize: "10px" }}>(vos)</span>}
        </div>
      </div>
    </div>
  );
}
