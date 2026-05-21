import { create } from "zustand";
import { supabase } from "../services/supabase";
import type {
  Project,
  Task,
  Sprint,
  ProjectMember,
  TaskStatus,
  TaskPriority,
} from "../types/entities";

interface ProjectState {
  projects: Project[];
  activeProject: Project | null;
  tasks: Task[];
  sprints: Sprint[];
  members: ProjectMember[];
  loading: boolean;
  error: string | null;

  fetchProjects: () => Promise<void>;
  fetchTasks: (projectId: string) => Promise<void>;
  fetchSprints: (projectId: string) => Promise<void>;
  fetchMembers: (projectId: string) => Promise<void>;
  createProject: (data: {
    name: string;
    description?: string;
    github_repo_url?: string;
  }) => Promise<void>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  createTask: (data: {
    project_id: string;
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assignee_id?: string | null;
    story_points?: number | null;
    sprint_id?: string | null;
    due_date?: string | null;
    github_pr_url?: string | null;
  }) => Promise<void>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setActiveProject: (project: Project | null) => Promise<void>;
  setLoading: (loading: boolean) => void;
  clearError: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  activeProject: null,
  tasks: [],
  sprints: [],
  members: [],
  loading: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      console.log("[PROJECTS] Fetching...");

      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          project_members(count)
        `)
        .order("created_at", { ascending: false });

      console.log("[PROJECTS] Result:", { data, error });

      if (error) {
        console.error("[PROJECTS] Error:", error);
        set({ loading: false, error: error.message, projects: [] });
        return;
      }

      const projects = (data || []).map((p: any) => ({
        ...p,
        member_count: p.project_members?.[0]?.count ?? 0,
      }));

      set({ projects, loading: false });
    } catch (err) {
      console.error("[PROJECTS] Exception:", err);
      set({ loading: false, error: String(err), projects: [] });
    }
  },

  fetchTasks: async (projectId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          assignee:profiles!tasks_assignee_id_fkey(id, name, email, role),
          reporter:profiles!tasks_reporter_id_fkey(id, name, email, role)
        `)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ tasks: data || [], loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Error al cargar tareas",
        loading: false,
      });
    }
  },

  fetchSprints: async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from("sprints")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ sprints: data || [] });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Error al cargar sprints",
      });
    }
  },

  fetchMembers: async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from("project_members")
        .select("*, profile:profiles(*)")
        .eq("project_id", projectId);

      if (error) throw error;
      set({ members: data || [] });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Error al cargar miembros",
      });
    }
  },

  createProject: async (data) => {
    set({ loading: true, error: null });
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("No hay sesión activa");

      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          name: data.name,
          description: data.description,
          github_repo_url: data.github_repo_url,
          coordinator_id: user.user.id,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from("project_members").insert({
        project_id: project.id,
        user_id: user.user.id,
        role_in_project: "lead",
      });

      set((state) => ({
        projects: [project, ...state.projects],
        loading: false,
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Error al crear proyecto",
        loading: false,
      });
    }
  },

  updateProject: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from("projects")
        .update(data)
        .eq("id", id);

      if (error) throw error;

      set((state) => ({
        projects: state.projects.map((p) =>
          p.id === id ? { ...p, ...data } : p
        ),
        activeProject:
          state.activeProject?.id === id
            ? { ...state.activeProject, ...data }
            : state.activeProject,
        loading: false,
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Error al actualizar proyecto",
        loading: false,
      });
    }
  },

  createTask: async (data) => {
    set({ loading: true, error: null });
    try {
      const { data: user } = await supabase.auth.getUser();

      const { data: task, error } = await supabase
        .from("tasks")
        .insert({
          ...data,
          reporter_id: user.user?.id,
          status: data.status || "backlog",
          priority: data.priority || "medium",
        })
        .select()
        .single();

      if (error) throw error;
      set((state) => ({ tasks: [task, ...state.tasks], loading: false }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Error al crear tarea",
        loading: false,
      });
    }
  },

  updateTask: async (id, data) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id ? { ...t, ...data, updated_at: new Date().toISOString() } : t
        ),
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Error al actualizar tarea",
      });
    }
  },

  deleteTask: async (id) => {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Error al eliminar tarea",
      });
    }
  },

  setActiveProject: async (project) => {
    set({ activeProject: project, loading: true });
    if (project) {
      await Promise.all([
        get().fetchTasks(project.id),
        get().fetchSprints(project.id),
        get().fetchMembers(project.id),
      ]);
    } else {
      set({ tasks: [], sprints: [], members: [], loading: false });
    }
  },

  setLoading: (loading) => set({ loading }),
  clearError: () => set({ error: null }),
}));

export default useProjectStore;
