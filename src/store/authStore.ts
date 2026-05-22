import { create } from "zustand";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../services/supabase";
import type { AppUser } from "../types/entities";

interface AuthState {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    role: "coordinator" | "intern"
  ) => Promise<{ success: boolean; emailConfirmationRequired?: boolean } | void>;
  logout: () => Promise<void>;
  clearError: () => void;
  setUser: (user: AppUser | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      console.log("[AUTH] Intentando login...");

      const result = await supabase.auth.signInWithPassword({ email, password });

      console.log("[AUTH] Resultado:", result);

      if (result.error) {
        if (result.error.message.includes('Email not confirmed') || 
            result.error.message.includes('email_not_confirmed')) {
          set({ 
            loading: false, 
            error: 'Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.' 
          });
          return;
        }
        set({ loading: false, error: result.error.message });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", result.data.user.id)
        .single();

      set({
        session: result.data.session,
        user: profile ?? null,
        loading: false,
      });
    } catch (err) {
      console.error("[AUTH] Error:", err);
      set({ loading: false, error: String(err) });
    }
  },

  register: async (
    email: string,
    password: string,
    name: string,
    role: "coordinator" | "intern"
  ) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, role },
        },
      });

      if (error) {
        set({ loading: false, error: error.message });
        return { success: false };
      }

      if (data.user && data.user.identities?.length === 0) {
        set({ loading: false, error: 'Este correo ya está registrado' });
        return { success: false };
      }

      set({ loading: false });
      return { success: true, emailConfirmationRequired: true };

    } catch (err) {
      set({ loading: false, error: String(err) });
      return { success: false };
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, error: null });
  },

  clearError: () => set({ error: null }),
  setUser: (user) => set({ user }),
  setSession: async (session: Session | null): Promise<void> => {
    if (!session) {
      set({ session: null, user: null, loading: false });
      return;
    }

    const currentUser = useAuthStore.getState().user;
    if (currentUser?.id === session.user.id) {
      set({ session });
      return;
    }

    set({ session, loading: true });

    try {
      console.log("[AUTH] Cargando perfil para:", session.user.id);

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      console.log("[AUTH] Perfil obtenido:", profile, error);

      if (error || !profile) {
        console.error("[AUTH] No se encontró perfil:", error);
        set({ loading: false, user: null });
        return;
      }

      set({ user: profile, loading: false });
    } catch (err) {
      console.error("[AUTH] Error cargando perfil:", err);
      set({ loading: false });
    }
  },
  setLoading: (loading) => set({ loading }),
}));

export default useAuthStore;
