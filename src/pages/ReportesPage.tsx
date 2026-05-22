import { useEffect, useState, useCallback } from "react";
import { useProjectStore } from "../store/projectStore";
import { supabase } from "../services/supabase";
import type { Task, Sprint, ProjectMember } from "../types/entities";

interface ProjectData {
  tasks: Task[];
  sprints: Sprint[];
  members: ProjectMember[];
}

async function fetchProjectData(projectId: string): Promise<ProjectData> {
  const [tasksRes, sprintsRes, membersRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("*, assignee:profiles!tasks_assignee_id_fkey(id, name, email, role), reporter:profiles!tasks_reporter_id_fkey(id, name, email, role)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }),
    supabase.from("sprints").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
    supabase.from("project_members").select("*, profile:profiles(*)").eq("project_id", projectId),
  ]);

  return {
    tasks: (tasksRes.data as Task[]) || [],
    sprints: (sprintsRes.data as Sprint[]) || [],
    members: (membersRes.data as ProjectMember[]) || [],
  };
}

const statusLabels: Record<string, string> = {
  backlog: "Backlog", todo: "To Do", in_progress: "In Progress",
  review: "Review", done: "Done", blocked: "Blocked",
};

const statusColors: Record<string, string> = {
  backlog: "var(--text-muted)", todo: "var(--info)",
  in_progress: "var(--warning)", review: "var(--accent)",
  done: "var(--success)", blocked: "var(--danger)",
};

const priorityColors: Record<string, string> = {
  low: "var(--text-muted)", medium: "var(--info)",
  high: "var(--warning)", critical: "var(--danger)",
};

export default function ReportesPage(): React.JSX.Element {
  const { projects, fetchProjects } = useProjectStore();
  const [selProjectId, setSelProjectId] = useState<string | null>(null);
  const [data, setData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (projects.length === 0) fetchProjects();
  }, []);

  useEffect(() => {
    if (projects.length > 0 && !selProjectId) {
      loadProject(projects[0].id);
    }
  }, [projects, selProjectId]);

  const loadProject = useCallback(async (projectId: string) => {
    setSelProjectId(projectId);
    setLoading(true);
    const d = await fetchProjectData(projectId);
    setData(d);
    setLoading(false);
  }, []);

  const { tasks, sprints, members } = data || { tasks: [], sprints: [], members: [] };
  const activeSprint = sprints.find((s) => s.status === "active");
  const sprintTasks = activeSprint ? tasks.filter((t) => t.sprint_id === activeSprint.id) : [];
  const sprintDone = sprintTasks.filter((t) => t.status === "done").length;
  const sprintTotal = sprintTasks.length;

  const byStatus = ["backlog", "todo", "in_progress", "review", "done", "blocked"].map((s) => ({
    status: s,
    count: tasks.filter((t) => t.status === s).length,
    label: statusLabels[s],
    color: statusColors[s],
  }));

  const byPriority = ["critical", "high", "medium", "low"].map((p) => ({
    priority: p,
    count: tasks.filter((t) => t.priority === p).length,
    color: priorityColors[p],
  }));

  const memberLoad = members.map((m) => ({
    name: m.profile?.name || "—",
    count: tasks.filter((t) => t.assignee_id === m.user_id).length,
    done: tasks.filter((t) => t.assignee_id === m.user_id && t.status === "done").length,
  }));

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "20px", color: "var(--text-primary)" }}>Reportes</h1>
        <div style={{ display: "flex", gap: "8px" }}>
          {projects.slice(0, 5).map((p) => (
            <button
              key={p.id}
              onClick={() => loadProject(p.id)}
              style={{
                padding: "6px 12px", fontSize: "12px",
                background: selProjectId === p.id ? "var(--accent)" : "var(--bg-surface)",
                color: selProjectId === p.id ? "#fff" : "var(--text-secondary)",
                border: "1px solid var(--border)", borderRadius: "var(--radius-md)",
                cursor: "pointer", fontWeight: 500,
              }}
            >
              {p.name}
            </button>
          ))}
          {!selProjectId && projects.length > 0 && (
            <span style={{ fontSize: "12px", color: "var(--text-muted)", padding: "6px 0" }}>
              Seleccioná un proyecto
            </span>
          )}
        </div>
      </div>

      {activeSprint && (
        <div style={{
          background: "var(--bg-surface)", borderRadius: "var(--radius-lg)",
          padding: "16px", border: "1px solid var(--border)",
        }}>
          <h2 style={{ fontSize: "14px", color: "var(--text-primary)", marginBottom: "8px" }}>
            Sprint activo: {activeSprint.name}
          </h2>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>
            {sprintDone} de {sprintTotal} tareas completadas
          </div>
          <div style={{ height: "8px", background: "var(--bg-hover)", borderRadius: "4px", overflow: "hidden" }}>
            <div style={{
              height: "100%", width: sprintTotal > 0 ? `${(sprintDone / sprintTotal) * 100}%` : "0%",
              background: "var(--success)", borderRadius: "4px", transition: "width 0.3s",
            }} />
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", flex: 1 }}>
        <div style={{
          background: "var(--bg-surface)", borderRadius: "var(--radius-lg)",
          padding: "16px", border: "1px solid var(--border)",
        }}>
          <h2 style={{ fontSize: "14px", color: "var(--text-primary)", marginBottom: "12px" }}>Tareas por estado</h2>
          <Table headers={["Estado", "Cantidad"]}>
            {byStatus.map((s) => (
              <tr key={s.status}>
                <td style={tdStyle}>
                  <span style={{ color: s.color, fontWeight: 600 }}>{s.label}</span>
                </td>
                <td style={{ ...tdStyle, textAlign: "center", fontWeight: 600 }}>{s.count}</td>
              </tr>
            ))}
          </Table>
        </div>

        <div style={{
          background: "var(--bg-surface)", borderRadius: "var(--radius-lg)",
          padding: "16px", border: "1px solid var(--border)",
        }}>
          <h2 style={{ fontSize: "14px", color: "var(--text-primary)", marginBottom: "12px" }}>Tareas por prioridad</h2>
          <Table headers={["Prioridad", "Cantidad"]}>
            {byPriority.map((p) => (
              <tr key={p.priority}>
                <td style={tdStyle}>
                  <span style={{ color: p.color, fontWeight: 600, textTransform: "capitalize" }}>{p.priority}</span>
                </td>
                <td style={{ ...tdStyle, textAlign: "center", fontWeight: 600 }}>{p.count}</td>
              </tr>
            ))}
          </Table>
        </div>
      </div>

      <div style={{
        background: "var(--bg-surface)", borderRadius: "var(--radius-lg)",
        padding: "16px", border: "1px solid var(--border)",
      }}>
        <h2 style={{ fontSize: "14px", color: "var(--text-primary)", marginBottom: "12px" }}>Carga por miembro</h2>
        <Table headers={["Miembro", "Tareas asignadas", "Completadas"]}>
          {memberLoad.map((m, i) => (
            <tr key={i}>
              <td style={tdStyle}>{m.name}</td>
              <td style={{ ...tdStyle, textAlign: "center" }}>{m.count}</td>
              <td style={{ ...tdStyle, textAlign: "center", color: "var(--success)" }}>{m.done}</td>
            </tr>
          ))}
          {memberLoad.length === 0 && (
            <tr>
              <td colSpan={3} style={{ ...tdStyle, textAlign: "center", color: "var(--text-muted)" }}>
                No hay miembros en este proyecto
              </td>
            </tr>
          )}
        </Table>
      </div>
    </div>
  );
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ borderBottom: "1px solid var(--border)" }}>
          {headers.map((h) => (
            <th key={h} style={{
              padding: "8px 12px", fontSize: "11px", fontWeight: 600,
              color: "var(--text-muted)", textTransform: "uppercase",
              textAlign: "left", letterSpacing: "0.05em",
            }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

const tdStyle: React.CSSProperties = {
  padding: "10px 12px", fontSize: "13px", color: "var(--text-secondary)",
  borderBottom: "1px solid var(--border)",
};
