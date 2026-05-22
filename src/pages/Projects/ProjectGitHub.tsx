import { useState, useEffect } from "react";
import { useGitHubStore } from "../../store/githubStore";
import { useProjectStore } from "../../store/projectStore";
import type { GitHubPR } from "../../types/entities";

const stateColors: Record<string, string> = {
  open: "var(--success)",
  closed: "var(--text-muted)",
  merged: "var(--accent)",
};

export default function ProjectGitHub(): React.JSX.Element {
  const { activeProject, updateProject } = useProjectStore();
  const { isConnected, repos, prs, loading, connect, disconnect, fetchPRs, fetchRepos } = useGitHubStore();
  const [repoUrl, setRepoUrl] = useState(activeProject?.github_repo_url || "");
  const [tokenInput, setTokenInput] = useState("");
  const [activeTab, setActiveTab] = useState<"link" | "prs">("link");

  useEffect(() => {
    if (isConnected) {
      fetchRepos();
    }
  }, [isConnected]);

  useEffect(() => {
    if (activeProject?.github_repo_url && isConnected) {
      const parts = activeProject.github_repo_url.replace("https://github.com/", "").split("/");
      if (parts.length === 2) {
        fetchPRs(parts[0], parts[1]);
        setActiveTab("prs");
      }
    }
  }, [activeProject?.github_repo_url, isConnected]);

  const handleLinkRepo = async () => {
    if (!activeProject || !repoUrl) return;
    await updateProject(activeProject.id, { github_repo_url: repoUrl });
    const parts = repoUrl.replace("https://github.com/", "").split("/");
    if (parts.length === 2) {
      fetchPRs(parts[0], parts[1]);
      setActiveTab("prs");
    }
  };

  const handleConnect = () => {
    if (tokenInput.trim()) {
      connect(tokenInput.trim());
    }
  };

  if (!activeProject) {
    return <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Selecciona un proyecto</div>;
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ fontSize: "20px", color: "var(--text-primary)" }}>
          {activeProject.name} — GitHub
        </h1>
        {isConnected && (
          <button onClick={disconnect} style={{ padding: "6px 12px", background: "transparent", border: "1px solid var(--danger)", color: "var(--danger)", borderRadius: "var(--radius-sm)", cursor: "pointer", fontSize: "12px" }}>
            Desconectar
          </button>
        )}
      </div>

      {!isConnected ? (
        <div style={{ maxWidth: "400px", margin: "40px auto", textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🐙</div>
          <h2 style={{ color: "var(--text-primary)", marginBottom: "8px" }}>Conectar con GitHub</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "24px", fontSize: "14px" }}>
            Ingresa tu Personal Access Token para vincular repositorios
          </p>
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="ghp_..."
            style={{ width: "100%", padding: "10px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", marginBottom: "12px" }}
          />
          <button onClick={handleConnect} style={{ width: "100%", padding: "10px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", cursor: "pointer", fontWeight: 600 }}>
            Conectar
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: "12px", marginBottom: "20px", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
            <button
              onClick={() => setActiveTab("link")}
              style={{
                padding: "8px 16px",
                background: activeTab === "link" ? "var(--bg-active)" : "transparent",
                color: activeTab === "link" ? "var(--accent)" : "var(--text-secondary)",
                border: "none",
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                fontWeight: activeTab === "link" ? 600 : 400,
              }}
            >
              Vincular Repo
            </button>
            <button
              onClick={() => setActiveTab("prs")}
              disabled={!activeProject.github_repo_url}
              style={{
                padding: "8px 16px",
                background: activeTab === "prs" ? "var(--bg-active)" : "transparent",
                color: activeTab === "prs" ? "var(--accent)" : "var(--text-secondary)",
                border: "none",
                borderRadius: "var(--radius-md)",
                cursor: activeProject.github_repo_url ? "pointer" : "not-allowed",
                fontWeight: activeTab === "prs" ? 600 : 400,
                opacity: activeProject.github_repo_url ? 1 : 0.5,
              }}
            >
              Pull Requests
            </button>
          </div>

          {activeTab === "link" && (
            <div style={{ maxWidth: "500px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                URL del Repositorio
              </label>
              <div style={{ display: "flex", gap: "12px" }}>
                <input
                  type="url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  style={{ flex: 1, padding: "10px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-primary)" }}
                />
                <button onClick={handleLinkRepo} style={{ padding: "10px 20px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", cursor: "pointer", fontWeight: 600 }}>
                  Vincular
                </button>
              </div>
              {activeProject.github_repo_url && (
                <p style={{ marginTop: "12px", fontSize: "13px", color: "var(--success)" }}>
                  ✓ Vinculado: {activeProject.github_repo_url}
                </p>
              )}
            </div>
          )}

          {activeTab === "prs" && (
            <div>
              {loading ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Cargando PRs...</div>
              ) : prs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>No hay pull requests</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {prs.map((pr: GitHubPR) => (
                    <a
                      key={pr.id}
                      href={pr.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px",
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-md)",
                        textDecoration: "none",
                        color: "var(--text-primary)",
                      }}
                    >
                      <span style={{ color: stateColors[pr.state], fontSize: "18px" }}>
                        {pr.state === "merged" ? "⇄" : pr.state === "open" ? "↔" : ""}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "14px", fontWeight: 500 }}>{pr.title}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                          #{pr.number} • {pr.user?.login ?? 'unknown'} • {pr.head.ref} → {pr.base.ref}
                        </div>
                      </div>
                      <span style={{
                        fontSize: "11px",
                        padding: "2px 8px",
                        borderRadius: "var(--radius-sm)",
                        background: stateColors[pr.state] + "20",
                        color: stateColors[pr.state],
                        fontWeight: 600,
                      }}>
                        {pr.state}
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
