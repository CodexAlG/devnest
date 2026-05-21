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
  ) => Promise<void>;
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .maybeSingle();

      if (!profile) {
        throw new Error("Perfil no encontrado. Contactá al administrador.");
      }

      set({
        user: profile as AppUser,
        session: data.session,
        loading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Error al iniciar sesión",
        loading: false,
      });
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
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, role },
        },
      });
      if (error) throw error;
      set({ loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Error al registrarse",
        loading: false,
      });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, error: null });
  },

  clearError: () => set({ error: null }),
  setUser: (user) => set({ user }),
  setSession: async (session) => {
    set({ session });
    if (session?.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();
      if (profile) {
        set({ user: profile as AppUser });
      } else {
        set({ user: null, error: "Perfil no encontrado" });
      }
    } else {
      set({ user: null });
    }
    set({ loading: false });
  },
  setLoading: (loading) => set({ loading }),
}));

export default useAuthStore;
