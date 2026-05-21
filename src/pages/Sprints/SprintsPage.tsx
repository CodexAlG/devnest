import { useState } from "react";
import { useProjectStore } from "../../store/projectStore";
import { useAuth } from "../../hooks/useAuth";
import type { Sprint, SprintStatus } from "../../types/entities";

const statusColors: Record<string, string> = {
  planning: "var(--text-muted)",
  active: "var(--success)",
  completed: "var(--info)",
};

export default function SprintsPage(): React.JSX.Element {
  const { activeProject, sprints, tasks, loading } = useProjectStore();
  const { isCoordinator, isAdmin } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [sprintName, setSprintName] = useState("");
  const [sprintGoal, setSprintGoal] = useState("");
  const [sprintStart, setSprintStart] = useState("");
  const [sprintEnd, setSprintEnd] = useState("");

  if (!activeProject) {
    return (
      <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏃</div>
        <h2 style={{ color: "var(--text-primary)", marginBottom: "8px" }}>Selecciona un proyecto</h2>
        <p>Ve a la sección Proyectos y abre uno para ver sus sprints</p>
      </div>
    );
  }

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sprintName.trim()) return;

    const { supabase } = await import("../../services/supabase");
    const { error } = await supabase.from("sprints").insert({
      project_id: activeProject.id,
      name: sprintName,
      goal: sprintGoal || null,
      start_date: sprintStart || null,
      end_date: sprintEnd || null,
      status: "planning",
    });

    if (!error) {
      setShowModal(false);
      setSprintName("");
      setSprintGoal("");
      setSprintStart("");
      setSprintEnd("");
      useProjectStore.getState().fetchSprints(activeProject.id);
    }
  };

  const handleActivate = async (sprint: Sprint) => {
    const { supabase } = await import("../../services/supabase");
    await supabase.from("sprints").update({ status: "active" }).eq("id", sprint.id);
    useProjectStore.getState().fetchSprints(activeProject.id);
  };

  const handleClose = async (sprint: Sprint) => {
    const { supabase } = await import("../../services/supabase");
    await supabase.from("sprints").update({ status: "completed" }).eq("id", sprint.id);
    useProjectStore.getState().fetchSprints(activeProject.id);
  };

  const getTaskCount = (sprintId: string) => tasks.filter((t) => t.sprint_id === sprintId).length;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ fontSize: "20px", color: "var(--text-primary)" }}>
          {activeProject.name} — Sprints
        </h1>
        {(isCoordinator || isAdmin) && (
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
            + Nuevo Sprint
          </button>
        )}
      </div>

      {sprints.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
          No hay sprints creados
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {sprints.map((sprint) => (
            <div
              key={sprint.id}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "20px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <h3 style={{ fontSize: "16px", color: "var(--text-primary)", fontWeight: 600 }}>{sprint.name}</h3>
                <span style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "var(--radius-sm)",
                  background: statusColors[sprint.status] + "20",
                  color: statusColors[sprint.status],
                  fontWeight: 600,
                }}>
                  {sprint.status}
                </span>
              </div>

              {sprint.goal && (
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "12px" }}>{sprint.goal}</p>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  {getTaskCount(sprint.id)} tareas
                </span>
                {sprint.start_date && sprint.end_date && (
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    {new Date(sprint.start_date).toLocaleDateString("es")} — {new Date(sprint.end_date).toLocaleDateString("es")}
                  </span>
                )}
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                {sprint.status === "planning" && (isCoordinator || isAdmin) && (
                  <button onClick={() => handleActivate(sprint)} style={actionBtnStyle}>
                    Activar
                  </button>
                )}
                {sprint.status === "active" && (isCoordinator || isAdmin) && (
                  <button onClick={() => handleClose(sprint)} style={actionBtnStyle}>
                    Cerrar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
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
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              width: "400px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "24px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "18px", color: "var(--text-primary)", marginBottom: "20px" }}>Nuevo Sprint</h2>
            <form onSubmit={handleCreateSprint}>
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Nombre *</label>
                <input type="text" value={sprintName} onChange={(e) => setSprintName(e.target.value)} required style={inputStyle} />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Objetivo</label>
                <textarea value={sprintGoal} onChange={(e) => setSprintGoal(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                <div>
                  <label style={labelStyle}>Inicio</label>
                  <input type="date" value={sprintStart} onChange={(e) => setSprintStart(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Fin</label>
                  <input type="date" value={sprintEnd} onChange={(e) => setSprintEnd(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowModal(false)} style={cancelBtnStyle}>Cancelar</button>
                <button type="submit" style={saveBtnStyle}>Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}
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

const actionBtnStyle: React.CSSProperties = {
  padding: "6px 12px",
  background: "var(--accent-soft)",
  border: "1px solid var(--accent)",
  borderRadius: "var(--radius-sm)",
  color: "var(--accent)",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
};
