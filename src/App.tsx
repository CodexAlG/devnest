import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "./services/supabase";
import { useAuthStore } from "./store/authStore";
import AppShell from "./layouts/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import PlaceholderPage from "./pages/PlaceholderPage";

export default function App(): React.JSX.Element {
  const { setSession } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));

    return () => subscription.unsubscribe();
  }, [setSession]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<PlaceholderPage title="Dashboard" />} />
          <Route path="/proyectos" element={<PlaceholderPage title="Proyectos" />} />
          <Route path="/board" element={<PlaceholderPage title="Board" />} />
          <Route path="/backlog" element={<PlaceholderPage title="Backlog" />} />
          <Route path="/sprints" element={<PlaceholderPage title="Sprints" />} />
          <Route path="/chat" element={<PlaceholderPage title="Chat" />} />
          <Route path="/reportes" element={<PlaceholderPage title="Reportes" />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
