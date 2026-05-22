import { useParams, useNavigate } from "react-router-dom";
import { useProjectStore } from "../store/projectStore";
import TaskModal from "../components/task/TaskModal";
import { useState } from "react";

const statusLabels: Record<string, string> = {
  backlog: "Backlog", todo: "To Do", in_progress: "In Progress",
  review: "Review", done: "Done", blocked: "Blocked",
};

const priorityColors: Record<string, string> = {
  low: "var(--text-muted)", medium: "var(--info)",
  high: "var(--warning)", critical: "var(--danger)",
};

export default function TaskDetailPage(): React.JSX.Element {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { tasks, sprints } = useProjectStore();
  const [editing, setEditing] = useState(false);

  const task = tasks.find((t) => t.id === taskId);
  const sprint = sprints.find((s) => s.id === task?.sprint_id);

  if (!task) {
    return (
      <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
        <h2 style={{ color: "var(--text-primary)", marginBottom: "8px" }}>Tarea no encontrada</h2>
        <button onClick={() => navigate(-1)} style={backBtnStyle}>Volver</button>
      </div>
    );
  }

  if (editing) {
    return (
      <TaskModal
        task={task}
        onClose={() => setEditing(false)}
        projectId={task.project_id}
      />
    );
  }

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "24px 0" }}>
      <button onClick={() => navigate(-1)} style={backBtnStyle}>
        ← Volver
      </button>

      <div style={{ marginTop: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <h1 style={{ fontSize: "22px", color: "var(--text-primary)", margin: 0, lineHeight: 1.3 }}>{task.title}</h1>
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
          <Badge color="var(--text-secondary)" bg="var(--bg-hover)">{statusLabels[task.status] || task.status}</Badge>
          <Badge color={priorityColors[task.priority]} bg={priorityColors[task.priority] + "20"}>{task.priority}</Badge>
          {task.story_points && <Badge color="var(--accent)" bg="var(--accent-soft)">{task.story_points} pts</Badge>}
        </div>

        {task.description && (
          <div style={{ marginBottom: "24px" }}>
            <Label>Descripción</Label>
            <div style={{
              background: "var(--bg-base)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)", padding: "14px",
              fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.6, whiteSpace: "pre-wrap",
            }}>
              {task.description}
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
          <InfoField label="Asignado" value={task.assignee?.name || "—"} />
          <InfoField label="Reportado por" value={task.reporter?.name || "—"} />
          <InfoField label="Sprint" value={sprint?.name || "Sin sprint"} />
          <InfoField label="Fecha límite" value={task.due_date ? new Date(task.due_date).toLocaleDateString("es") : "—"} />
          <InfoField label="Creado" value={new Date(task.created_at).toLocaleDateString("es")} />
          <InfoField label="Actualizado" value={new Date(task.updated_at).toLocaleDateString("es")} />
        </div>

        {task.github_pr_url && (
          <div style={{ marginBottom: "24px" }}>
            <Label>GitHub PR</Label>
            <a href={task.github_pr_url} target="_blank" rel="noopener noreferrer"
              style={{ color: "var(--accent)", fontSize: "14px", textDecoration: "none" }}>
              {task.github_pr_url}
            </a>
          </div>
        )}

        <button
          onClick={() => setEditing(true)}
          style={{
            padding: "10px 24px", background: "var(--accent)", color: "#fff",
            border: "none", borderRadius: "var(--radius-md)", fontSize: "14px",
            fontWeight: 600, cursor: "pointer",
          }}
        >
          Editar
        </button>
      </div>
    </div>
  );
}

function Badge({ color, bg, children }: { color: string; bg: string; children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: "11px", padding: "3px 10px", borderRadius: "var(--radius-sm)",
      background: bg, color, fontWeight: 600,
    }}>
      {children}
    </span>
  );
}

function Label({ children }: { children: string }) {
  return (
    <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
      {children}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <div style={{ color: "var(--text-primary)", fontSize: "14px" }}>{value}</div>
    </div>
  );
}

const backBtnStyle: React.CSSProperties = {
  background: "none", border: "none", color: "var(--text-muted)",
  fontSize: "14px", cursor: "pointer", padding: "4px 0",
};
