import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function ProtectedRoute(): React.JSX.Element {
  const { session, loading } = useAuthStore();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "var(--bg-base)",
          color: "var(--text-secondary)",
        }}
      >
        Cargando...
      </div>
    );
  }

  return session ? <Outlet /> : <Navigate to="/login" replace />;
}
