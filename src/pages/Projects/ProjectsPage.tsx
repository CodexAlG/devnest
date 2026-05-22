import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjectStore } from "../../store/projectStore";
import { useAuthStore } from "../../store/authStore";
import ProjectModal from "./ProjectModal";
import type { Project } from "../../types/entities";

const statusColors: Record<string, string> = {
  active: "var(--success)",
  paused: "var(--warning)",
  completed: "var(--info)",
  archived: "var(--text-muted)",
};

export default function ProjectsPage(): React.JSX.Element {
  const { projects, fetchProjects, loading, deleteProject } = useProjectStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const canCreate = user?.role === "coordinator" || user?.role === "admin";
  const canManage = (project: Project) =>
    user?.role === "admin" || user?.id === project.coordinator_id;

  const handleOpen = (project: Project) => {
    useProjectStore.getState().setActiveProject(project);
    navigate("/board");
  };

  return (
    <div style={{ height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", color: "var(--text-primary)" }}>Proyectos</h1>
        {canCreate && (
          <button
            onClick={() => { setEditingProject(null); setShowModal(true); }}
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
            + Nuevo Proyecto
          </button>
        )}
      </div>

      {!loading && projects.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "16px" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "16px" }}>
            No hay proyectos aún
          </p>
          {canCreate && (
            <button
              onClick={() => setShowModal(true)}
              style={{
                background: "var(--accent)",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              + Nuevo Proyecto
            </button>
          )}
        </div>
      ) : projects.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          {projects.map((project) => (
            <div
              key={project.id}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "20px",
                cursor: "pointer",
                transition: "border-color 0.2s",
              }}
              onClick={() => handleOpen(project)}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <h3 style={{ fontSize: "16px", color: "var(--text-primary)", fontWeight: 600 }}>
                  {project.name}
                </h3>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {canManage(project) && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingProject(project); setShowModal(true); }}
                        title="Editar"
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          fontSize: "14px",
                          padding: "2px 6px",
                          borderRadius: "var(--radius-sm)",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "var(--accent)"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}
                      >
                        ✎
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeletingId(project.id); }}
                        title="Eliminar"
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          fontSize: "14px",
                          padding: "2px 6px",
                          borderRadius: "var(--radius-sm)",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "var(--danger)"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}
                      >
                        ✕
                      </button>
                    </>
                  )}
                  <span
                    style={{
                      fontSize: "11px",
                      padding: "2px 8px",
                      borderRadius: "var(--radius-sm)",
                      background: statusColors[project.status] + "20",
                      color: statusColors[project.status],
                      fontWeight: 600,
                    }}
                  >
                    {project.status}
                  </span>
                </div>
              </div>

              {project.description && (
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px", lineHeight: 1.5 }}>
                  {project.description}
                </p>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  {project.member_count || 0} miembros
                </span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  {new Date(project.created_at).toLocaleDateString("es")}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
          Cargando proyectos...
        </div>
      )}

      {showModal && (
        <ProjectModal
          project={editingProject}
          onClose={() => { setShowModal(false); setEditingProject(null); }}
        />
      )}

      {deletingId && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          }}
          onClick={() => setDeletingId(null)}
        >
          <div
            style={{
              width: "360px", background: "var(--bg-surface)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)", padding: "24px", textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>🗑</div>
            <h3 style={{ color: "var(--text-primary)", marginBottom: "8px" }}>Eliminar proyecto</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "24px" }}>
              ¿Estás seguro? Se eliminarán todas las tareas, sprints y datos asociados.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={() => setDeletingId(null)}
                style={{
                  padding: "10px 20px", background: "transparent", border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)", color: "var(--text-secondary)", cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await deleteProject(deletingId);
                  setDeletingId(null);
                }}
                style={{
                  padding: "10px 20px", background: "var(--danger)", border: "none",
                  borderRadius: "var(--radius-md)", color: "#fff", cursor: "pointer", fontWeight: 600,
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
