import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { supabase } from "./services/supabase";
import { useAuthStore } from "./store/authStore";
import Logo from "./components/Logo";
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
import TaskDetailPage from "./pages/TaskDetailPage";
import DashboardPage from "./pages/DashboardPage";
import ReportesPage from "./pages/ReportesPage";

export default function App(): React.JSX.Element {
  const { setSession } = useAuthStore();
  const [initializing, setInitializing] = useState(true);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    let subscription: { unsubscribe: () => void } | null = null;

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session).finally(() => setInitializing(false));
      });

    const { data } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AUTH EVENT]', event);

        if (
          event === 'SIGNED_IN' ||
          event === 'SIGNED_OUT' ||
          event === 'USER_UPDATED'
        ) {
          await setSession(session);
        }
      }
    );
    subscription = data.subscription;

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

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
          <Logo size={48} style={{ margin: "0 auto 12px" }} />
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
          <Route index element={<DashboardPage />} />
          <Route path="/proyectos" element={<ProjectsPage />} />
          <Route path="/board" element={<BoardPage />} />
          <Route path="/board/task/:taskId" element={<TaskDetailPage />} />
          <Route path="/backlog" element={<BacklogPage />} />
          <Route path="/backlog/task/:taskId" element={<TaskDetailPage />} />
          <Route path="/sprints" element={<SprintsPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/reportes" element={<ReportesPage />} />
          <Route path="/github" element={<ProjectGitHub />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
