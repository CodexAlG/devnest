import { useAuthStore } from "../store/authStore";

export function useAuth() {
  const { user, session, loading, error, login, register, logout, clearError } =
    useAuthStore();

  const isAuthenticated = session !== null;
  const isCoordinator =
    user?.role === "coordinator" || user?.role === "admin";
  const isAdmin = user?.role === "admin";

  return {
    user,
    session,
    loading,
    error,
    isAuthenticated,
    isCoordinator,
    isAdmin,
    login,
    register,
    logout,
    clearError,
  };
}

export default useAuth;
