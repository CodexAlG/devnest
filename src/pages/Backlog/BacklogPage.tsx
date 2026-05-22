import { useState, useEffect } from "react";
import { useProjectStore } from "../../store/projectStore";
import TaskModal from "../../components/task/TaskModal";
import type { Task, TaskPriority } from "../../types/entities";

const priorityOrder: Record<TaskPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };

const priorityColors: Record<string, string> = {
  low: "var(--text-muted)",
  medium: "var(--info)",
  high: "var(--warning)",
  critical: "var(--danger)",
};

export default function BacklogPage(): React.JSX.Element {
  const { activeProject, tasks, updateTask, sprints, fetchTasks, fetchSprints, fetchBoardColumns } = useProjectStore();
  const [showModal, setShowModal] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");

  useEffect(() => {
    if (activeProject && tasks.length === 0) {
      fetchTasks(activeProject.id);
      fetchSprints(activeProject.id);
      fetchBoardColumns(activeProject.id);
    }
  }, [activeProject?.id]);

  if (!activeProject) {
    return (
      <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}></div>
        <h2 style={{ color: "var(--text-primary)", marginBottom: "8px" }}>Selecciona un proyecto</h2>
        <p>Ve a la sección Proyectos y abre uno para ver su backlog</p>
      </div>
    );
  }

  const backlogTasks = tasks
    .filter((t) => t.sprint_id === null || t.sprint_id === undefined)
    .filter((t) => filterPriority === "all" || t.priority === filterPriority)
    .filter((t) => filterAssignee === "all" || t.assignee_id === filterAssignee)
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  const uniqueAssignees = Array.from(new Map(tasks.map((t) => [t.assignee_id, t.assignee])).values());

  const handleMoveToSprint = async (task: Task, sprintId: string) => {
    await updateTask(task.id, { sprint_id: sprintId || null, status: "todo" });
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ fontSize: "20px", color: "var(--text-primary)" }}>
          {activeProject.name} — Backlog
        </h1>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: "8px 16px",
            background: "var(--accent)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius-md)",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          + Nueva Tarea
        </button>
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          style={filterStyle}
        >
          <option value="all">Todas las prioridades</option>
          <option value="critical">Crítica</option>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baja</option>
        </select>
        <select
          value={filterAssignee}
          onChange={(e) => setFilterAssignee(e.target.value)}
          style={filterStyle}
        >
          <option value="all">Todos los asignados</option>
          {uniqueAssignees.map((a) => (
            a && <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      {backlogTasks.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
          No hay tareas en el backlog
        </div>
      ) : (
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th style={thStyle}>Prioridad</th>
                <th style={{ ...thStyle, textAlign: "left" }}>Título</th>
                <th style={thStyle}>Asignado</th>
                <th style={thStyle}>Pts</th>
                <th style={thStyle}>Fecha límite</th>
                <th style={thStyle}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {backlogTasks.map((task) => (
                <tr key={task.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={tdStyle}>
                    <span style={{
                      fontSize: "11px",
                      padding: "2px 8px",
                      borderRadius: "var(--radius-sm)",
                      background: priorityColors[task.priority] + "20",
                      color: priorityColors[task.priority],
                      fontWeight: 600,
                    }}>
                      {task.priority}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: "left", color: "var(--text-primary)", fontWeight: 500 }}>
                    {task.title}
                  </td>
                  <td style={tdStyle}>
                    {task.assignee ? (
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                        {task.assignee.name.split(" ")[0]}
                      </span>
                    ) : (
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    {task.story_points ? (
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{task.story_points}</span>
                    ) : (
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    {task.due_date ? (
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                        {new Date(task.due_date).toLocaleDateString("es")}
                      </span>
                    ) : (
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <select
                      onChange={(e) => handleMoveToSprint(task, e.target.value)}
                      defaultValue=""
                      style={{
                        padding: "4px 8px",
                        background: "var(--bg-base)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-sm)",
                        color: "var(--text-secondary)",
                        fontSize: "11px",
                      }}
                    >
                      <option value="" disabled>Mover a sprint</option>
                      {sprints.filter((s) => s.status === "planning" || s.status === "active").map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <TaskModal
          task={null}
          onClose={() => setShowModal(false)}
          projectId={activeProject.id}
        />
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: "11px",
  fontWeight: 600,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  textAlign: "center",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: "13px",
  textAlign: "center",
};

const filterStyle: React.CSSProperties = {
  padding: "8px 12px",
  background: "var(--bg-surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-md)",
  color: "var(--text-secondary)",
  fontSize: "13px",
  outline: "none",
};
