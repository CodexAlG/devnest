import { useState, useEffect } from "react";
import { useProjectStore } from "../../store/projectStore";
import { useAuth } from "../../hooks/useAuth";
import type { Task, TaskStatus, TaskPriority } from "../../types/entities";

interface TaskModalProps {
  task?: Task | null;
  onClose: () => void;
  projectId: string;
}

export default function TaskModal({ task, onClose, projectId }: TaskModalProps): React.JSX.Element {
  const { members, sprints, createTask, updateTask, deleteTask, loading, fetchMembers } = useProjectStore();
  const { isCoordinator, isAdmin } = useAuth();
  const canDelete = isCoordinator || isAdmin;

  useEffect(() => {
    if (members.length === 0) {
      fetchMembers(projectId);
    }
  }, [projectId, members.length, fetchMembers]);

  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [status, setStatus] = useState<TaskStatus>(task?.status || "todo");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || "medium");
  const [assignee_id, setAssigneeId] = useState(task?.assignee_id || "");
  const [story_points, setStoryPoints] = useState(task?.story_points?.toString() || "");
  const [sprint_id, setSprintId] = useState(task?.sprint_id || "");
  const [due_date, setDueDate] = useState(task?.due_date || "");
  const [github_pr_url, setGithubPrUrl] = useState(task?.github_pr_url || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (task) {
      await updateTask(task.id, {
        title,
        description,
        status,
        priority,
        assignee_id: assignee_id || null,
        story_points: story_points ? parseInt(story_points) : null,
        sprint_id: sprint_id || null,
        due_date: due_date || null,
        github_pr_url: github_pr_url || null,
      });
    } else {
      await createTask({
        project_id: projectId,
        title,
        description,
        status,
        priority,
        assignee_id: assignee_id || null,
        story_points: story_points ? parseInt(story_points) : null,
        sprint_id: sprint_id || null,
        due_date: due_date || null,
        github_pr_url: github_pr_url || null,
      });
    }
    onClose();
  };

  const handleDelete = async () => {
    if (task && canDelete && confirm("¿Eliminar esta tarea?")) {
      await deleteTask(task.id);
      onClose();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "560px",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "24px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "18px", color: "var(--text-primary)" }}>
            {task ? "Editar Tarea" : "Nueva Tarea"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "20px", cursor: "pointer" }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Título *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required style={inputStyle} />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Descripción</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            <div>
              <label style={labelStyle}>Estado</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} style={inputStyle}>
                <option value="backlog">Backlog</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Prioridad</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} style={inputStyle}>
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            <div>
              <label style={labelStyle}>Asignado</label>
              <select value={assignee_id} onChange={(e) => setAssigneeId(e.target.value)} style={inputStyle}>
                <option value="">Sin asignar</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.profile?.name || m.user_id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Story Points</label>
              <input type="number" min="1" max="21" value={story_points} onChange={(e) => setStoryPoints(e.target.value)} style={inputStyle} placeholder="1-21" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            <div>
              <label style={labelStyle}>Sprint</label>
              <select value={sprint_id} onChange={(e) => setSprintId(e.target.value)} style={inputStyle}>
                <option value="">Sin sprint</option>
                {sprints.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Fecha límite</label>
              <input type="date" value={due_date} onChange={(e) => setDueDate(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>GitHub PR URL</label>
            <input type="url" value={github_pr_url} onChange={(e) => setGithubPrUrl(e.target.value)} style={inputStyle} placeholder="https://github.com/..." />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {task && canDelete ? (
              <button type="button" onClick={handleDelete} style={deleteBtnStyle}>
                Eliminar
              </button>
            ) : (
              <div />
            )}
            <div style={{ display: "flex", gap: "12px" }}>
              <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancelar</button>
              <button type="submit" disabled={loading} style={saveBtnStyle}>
                {loading ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--text-secondary)",
  marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  background: "var(--bg-base)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-md)",
  color: "var(--text-primary)",
  fontSize: "13px",
  outline: "none",
};

const cancelBtnStyle: React.CSSProperties = {
  padding: "8px 16px",
  background: "transparent",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-md)",
  color: "var(--text-secondary)",
  fontSize: "13px",
  cursor: "pointer",
};

const saveBtnStyle: React.CSSProperties = {
  padding: "8px 16px",
  background: "var(--accent)",
  border: "none",
  borderRadius: "var(--radius-md)",
  color: "#fff",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
};

const deleteBtnStyle: React.CSSProperties = {
  padding: "8px 16px",
  background: "transparent",
  border: "1px solid var(--danger)",
  borderRadius: "var(--radius-md)",
  color: "var(--danger)",
  fontSize: "13px",
  cursor: "pointer",
};
