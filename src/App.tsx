import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "./services/supabase";
import { useAuthStore } from "./store/authStore";
import AppShell from "./layouts/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import ProjectsPage from "./pages/Projects/ProjectsPage";
import BoardPage from "./pages/Board/BoardPage";
import BacklogPage from "./pages/Backlog/BacklogPage";
import SprintsPage from "./pages/Sprints/SprintsPage";
import ChatPage from "./pages/Chat/ChatPage";
import ProjectGitHub from "./pages/Projects/ProjectGitHub";

export default function App(): React.JSX.Element {
  const { setSession } = useAuthStore();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
      })
      .finally(() => setInitializing(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [setSession]);

  if (initializing) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "var(--bg-base)",
          color: "var(--text-muted)",
          fontFamily: "var(--font)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "24px",
              color: "var(--accent)",
              fontWeight: "bold",
              marginBottom: "8px",
            }}
          >
            DN
          </div>
          <div style={{ fontSize: "13px" }}>Iniciando DevNest...</div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<PlaceholderPage title="Dashboard" />} />
          <Route path="/proyectos" element={<ProjectsPage />} />
          <Route path="/board" element={<BoardPage />} />
          <Route path="/backlog" element={<BacklogPage />} />
          <Route path="/sprints" element={<SprintsPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/reportes" element={<PlaceholderPage title="Reportes" />} />
          <Route path="/github" element={<ProjectGitHub />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
