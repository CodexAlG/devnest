import { useState } from "react";
import { useProjectStore } from "../../store/projectStore";

interface ProjectModalProps {
  project?: {
    id: string;
    name: string;
    description?: string;
    github_repo_url?: string;
    status?: string;
  } | null;
  onClose: () => void;
}

export default function ProjectModal({ project, onClose }: ProjectModalProps): React.JSX.Element {
  const [name, setName] = useState(project?.name || "");
  const [description, setDescription] = useState(project?.description || "");
  const [github_repo_url, setGithubUrl] = useState(project?.github_repo_url || "");
  const [status, setStatus] = useState(project?.status || "active");
  const { createProject, updateProject, loading } = useProjectStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (project) {
      await updateProject(project.id, { name, description, github_repo_url, status: status as any });
    } else {
      await createProject({ name, description, github_repo_url });
    }
    onClose();
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
          width: "480px",
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "24px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: "18px", color: "var(--text-primary)", marginBottom: "20px" }}>
          {project ? "Editar Proyecto" : "Nuevo Proyecto"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Nombre *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={inputStyle}
              placeholder="Nombre del proyecto"
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
              placeholder="Descripción del proyecto"
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>GitHub Repo URL</label>
            <input
              type="url"
              value={github_repo_url}
              onChange={(e) => setGithubUrl(e.target.value)}
              style={inputStyle}
              placeholder="https://github.com/user/repo"
            />
          </div>

          {project && (
            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Estado</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
                <option value="active">Activo</option>
                <option value="paused">Pausado</option>
                <option value="completed">Completado</option>
                <option value="archived">Archivado</option>
              </select>
            </div>
          )}

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} style={saveBtnStyle}>
              {loading ? "Guardando..." : "Guardar"}
            </button>
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
  padding: "10px 12px",
  background: "var(--bg-base)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-md)",
  color: "var(--text-primary)",
  fontSize: "14px",
  outline: "none",
};

const cancelBtnStyle: React.CSSProperties = {
  padding: "10px 20px",
  background: "transparent",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-md)",
  color: "var(--text-secondary)",
  fontSize: "14px",
  cursor: "pointer",
};

const saveBtnStyle: React.CSSProperties = {
  padding: "10px 20px",
  background: "var(--accent)",
  border: "none",
  borderRadius: "var(--radius-md)",
  color: "#fff",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
};
