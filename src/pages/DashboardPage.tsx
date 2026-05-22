import { useNavigate } from "react-router-dom";
import { useProjectStore } from "../store/projectStore";
import { useAuthStore } from "../store/authStore";
import { supabase } from "../services/supabase";
import { useEffect, useState } from "react";

interface TaskStats {
  total: number;
  done: number;
  byStatus: { status: string; count: number }[];
  myTasks: { id: string; title: string; status: string }[];
}

const statusColors: Record<string, string> = {
  backlog: "var(--text-muted)", todo: "var(--info)",
  in_progress: "var(--warning)", review: "var(--accent)",
  done: "var(--success)", blocked: "var(--danger)",
};

const STATUSES = ["backlog", "todo", "in_progress", "review", "done", "blocked"];

async function fetchTaskStats(userId?: string): Promise<TaskStats> {
  const { count: total } = await supabase.from("tasks").select("*", { count: "exact", head: true });
  const { count: done } = await supabase.from("tasks").select("*", { count: "exact", head: true }).eq("status", "done");

  const statusCounts: { status: string; count: number }[] = [];
  for (const s of STATUSES) {
    const { count } = await supabase.from("tasks").select("*", { count: "exact", head: true }).eq("status", s);
    statusCounts.push({ status: s, count: count ?? 0 });
  }

  let myTasks: { id: string; title: string; status: string }[] = [];
  if (userId) {
    const { data } = await supabase
      .from("tasks")
      .select("id, title, status")
      .eq("assignee_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);
    myTasks = (data as any[]) || [];
  }

  return { total: total ?? 0, done: done ?? 0, byStatus: statusCounts, myTasks };
}

async function fetchActiveSprintName(): Promise<string | null> {
  const { data } = await supabase
    .from("sprints")
    .select("name")
    .eq("status", "active")
    .limit(1)
    .single();
  return data?.name || null;
}

export default function DashboardPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { projects, fetchProjects, setActiveProject } = useProjectStore();
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [sprintName, setSprintName] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
    fetchTaskStats(user?.id).then(setStats);
    fetchActiveSprintName().then(setSprintName);
  }, []);

  const activeProjects = projects.filter((p) => p.status === "active").length;
  const maxCount = Math.max(...(stats?.byStatus.map((s) => s.count) || [1]), 1);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: "24px" }}>
      <h1 style={{ fontSize: "20px", color: "var(--text-primary)" }}>Dashboard</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        <StatCard label="Proyectos activos" value={activeProjects} color="var(--accent)" />
        <StatCard label="Sprint activo" value={sprintName || "—"} color="var(--warning)" small />
        <StatCard label="Tareas totales" value={stats?.total ?? "..."} color="var(--text-primary)" />
        <StatCard label="Completadas" value={stats?.done ?? "..."} color="var(--success)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", flex: 1 }}>
        <div style={{ background: "var(--bg-surface)", borderRadius: "var(--radius-lg)", padding: "16px", border: "1px solid var(--border)" }}>
          <h2 style={{ fontSize: "14px", color: "var(--text-primary)", marginBottom: "12px" }}>Tareas por estado</h2>
          {!stats ? (
            <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>Cargando...</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {stats.byStatus.map((s) => (
                <div key={s.status}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                    <span style={{ color: "var(--text-secondary)", textTransform: "capitalize" }}>{s.status.replace("_", " ")}</span>
                    <span style={{ color: statusColors[s.status], fontWeight: 600 }}>{s.count}</span>
                  </div>
                  <div style={{ height: "6px", background: "var(--bg-hover)", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(s.count / maxCount) * 100}%`, background: statusColors[s.status], borderRadius: "3px", transition: "width 0.3s" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ background: "var(--bg-surface)", borderRadius: "var(--radius-lg)", padding: "16px", border: "1px solid var(--border)" }}>
          <h2 style={{ fontSize: "14px", color: "var(--text-primary)", marginBottom: "12px" }}>Mis tareas</h2>
          {!stats ? (
            <div style={{ color: "var(--text-muted)", fontSize: "13px", padding: "12px 0" }}>Cargando...</div>
          ) : stats.myTasks.length === 0 ? (
            <div style={{ color: "var(--text-muted)", fontSize: "13px", padding: "12px 0" }}>
              No tenés tareas asignadas
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {stats.myTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => navigate(`/board/task/${t.id}`)}
                  style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "8px 10px", borderRadius: "var(--radius-md)",
                    cursor: "pointer", fontSize: "13px",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{
                    width: "8px", height: "8px", borderRadius: "50%",
                    background: statusColors[t.status], flexShrink: 0,
                  }} />
                  <span style={{ color: "var(--text-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.title}
                  </span>
                  <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>{t.status.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ background: "var(--bg-surface)", borderRadius: "var(--radius-lg)", padding: "16px", border: "1px solid var(--border)" }}>
        <h2 style={{ fontSize: "14px", color: "var(--text-primary)", marginBottom: "12px" }}>Proyectos recientes</h2>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {projects.slice(0, 6).map((p) => (
            <div
              key={p.id}
              onClick={async () => { await setActiveProject(p); navigate("/board"); }}
              style={{
                flex: "1 1 180px", padding: "12px 14px",
                background: "var(--bg-base)", borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)", cursor: "pointer", minWidth: "160px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <div style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 600, marginBottom: "4px" }}>
                {p.name}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                {p.member_count ?? 0} miembros
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>
              No hay proyectos todavía — creá uno en Proyectos
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, small }: { label: string; value: string | number; color: string; small?: boolean }) {
  return (
    <div style={{
      background: "var(--bg-surface)", borderRadius: "var(--radius-lg)",
      padding: "16px", border: "1px solid var(--border)",
    }}>
      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px", fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: small ? "14px" : "24px", fontWeight: 700, color }}>
        {value}
      </div>
    </div>
  );
}
