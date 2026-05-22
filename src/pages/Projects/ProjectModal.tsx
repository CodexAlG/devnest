import { useState, useEffect } from "react";
import { supabase } from "../../services/supabase";
import { useProjectStore } from "../../store/projectStore";
import type { AppUser, ProjectMember } from "../../types/entities";

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
  const [members, setMembers] = useState<(ProjectMember & { profile?: AppUser })[]>([]);
  const [availableUsers, setAvailableUsers] = useState<AppUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const { createProject, updateProject, loading } = useProjectStore();

  useEffect(() => {
    if (project) {
      fetchMembers();
    }
    fetchAvailableUsers();
  }, []);

  const fetchMembers = async () => {
    if (!project) return;
    const { data } = await supabase
      .from("project_members")
      .select("*, profile:profiles(*)")
      .eq("project_id", project.id);
    if (data) setMembers(data);
  };

  const fetchAvailableUsers = async () => {
    const { data } = await supabase.from("profiles").select("*");
    if (data) setAvailableUsers(data);
  };

  const addMember = async () => {
    if (!project || !selectedUserId) return;
    const { error } = await supabase.from("project_members").insert({
      project_id: project.id,
      user_id: selectedUserId,
      role_in_project: "member",
    });
    if (!error) {
      setSelectedUserId("");
      fetchMembers();
    }
  };

  const removeMember = async (userId: string) => {
    if (!project) return;
    await supabase
      .from("project_members")
      .delete()
      .eq("project_id", project.id)
      .eq("user_id", userId);
    fetchMembers();
  };

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

  const nonMemberUsers = availableUsers.filter(
    (u) => !members.some((m) => m.user_id === u.id)
  );

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
          width: "520px",
          maxHeight: "90vh",
          overflowY: "auto",
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

          {project && (
            <div style={{ marginBottom: "20px", borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
              <label style={{ ...labelStyle, marginBottom: "12px" }}>Miembros</label>

              {members.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                  {members.map((m) => (
                    <div
                      key={m.user_id}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        background: "var(--bg-base)", padding: "8px 12px",
                        borderRadius: "var(--radius-md)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div
                          style={{
                            width: "28px", height: "28px", borderRadius: "50%",
                            background: "var(--accent)", display: "flex", alignItems: "center",
                            justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#fff",
                          }}
                        >
                          {m.profile?.name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <div style={{ fontSize: "13px", color: "var(--text-primary)" }}>
                            {m.profile?.name || "Usuario"}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                            {m.role_in_project === "lead" ? "Coordinador" : "Miembro"}
                          </div>
                        </div>
                      </div>
                      {m.role_in_project !== "lead" && (
                        <button
                          type="button"
                          onClick={() => removeMember(m.user_id)}
                          style={{
                            background: "transparent", border: "none",
                            color: "var(--text-muted)", cursor: "pointer", fontSize: "12px",
                            padding: "4px 8px", borderRadius: "var(--radius-sm)",
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = "var(--danger)"}
                          onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: "8px" }}>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                >
                  <option value="">Agregar miembro...</option>
                  {nonMemberUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addMember}
                  disabled={!selectedUserId}
                  style={{
                    padding: "10px 16px", background: selectedUserId ? "var(--accent)" : "var(--bg-base)",
                    border: "none", borderRadius: "var(--radius-md)", color: "#fff",
                    cursor: selectedUserId ? "pointer" : "not-allowed", fontWeight: 600, opacity: selectedUserId ? 1 : 0.5,
                  }}
                >
                  +
                </button>
              </div>
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
