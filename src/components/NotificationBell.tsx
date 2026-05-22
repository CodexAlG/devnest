import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useAuthStore } from "../store/authStore";

interface Notification {
  id: string;
  type: "assigned" | "mentioned" | "updated";
  message: string;
  taskId: string;
  time: string;
}

async function fetchNotifications(userId: string): Promise<Notification[]> {
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, status, updated_at, reporter:profiles!tasks_reporter_id_fkey(name)")
    .eq("assignee_id", userId)
    .order("updated_at", { ascending: false })
    .limit(10);

  const notes: Notification[] = (tasks || []).map((t: any) => ({
    id: `assigned-${t.id}`,
    type: "assigned" as const,
    message: `${t.reporter?.name || "Alguien"} te asignó "${t.title}"`,
    taskId: t.id,
    time: t.updated_at,
  }));

  return notes;
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<Notification[]>([]);
  const [read, setRead] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchNotifications(user.id).then(setNotes);
  }, [user?.id]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = notes.filter((n) => !read.has(n.id)).length;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => { setOpen((o) => !o); if (!open) setRead(new Set(notes.map((n) => n.id))); }}
        title="Notificaciones"
        style={{
          background: "transparent", border: "none", cursor: "pointer",
          fontSize: "16px", color: "var(--text-muted)", padding: "6px",
          borderRadius: "var(--radius-md)", position: "relative", lineHeight: 1,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span style={{
            position: "absolute", top: "0", right: "0",
            background: "var(--danger)", color: "#fff",
            fontSize: "9px", fontWeight: 700, minWidth: "16px", height: "16px",
            borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
            lineHeight: 1,
          }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "100%", right: "0", marginTop: "4px",
          width: "320px", maxHeight: "360px", overflowY: "auto",
          background: "var(--bg-surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)", boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          zIndex: 1000,
        }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
            Notificaciones
          </div>
          {notes.length === 0 ? (
            <div style={{ padding: "24px 14px", textAlign: "center", fontSize: "12px", color: "var(--text-muted)" }}>
              Sin notificaciones
            </div>
          ) : (
            notes.map((n) => (
              <div
                key={n.id}
                onClick={() => { setOpen(false); navigate(`/board/task/${n.taskId}`); }}
                style={{
                  padding: "10px 14px", cursor: "pointer", fontSize: "12px",
                  color: "var(--text-secondary)", borderBottom: "1px solid var(--border)",
                  lineHeight: 1.4,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {n.message}
                <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>
                  {new Date(n.time).toLocaleDateString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
