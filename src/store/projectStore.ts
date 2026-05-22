import { create } from "zustand";
import { supabase } from "../services/supabase";
import type {
  Project,
  Task,
  Sprint,
  ProjectMember,
  BoardColumn,
  TaskStatus,
  TaskPriority,
} from "../types/entities";

interface ProjectState {
  projects: Project[];
  activeProject: Project | null;
  tasks: Task[];
  sprints: Sprint[];
  members: ProjectMember[];
  boardColumns: BoardColumn[];
  loading: boolean;
  error: string | null;

  fetchProjects: () => Promise<void>;
  fetchTasks: (projectId: string) => Promise<void>;
  fetchSprints: (projectId: string) => Promise<void>;
  fetchMembers: (projectId: string) => Promise<void>;
  fetchBoardColumns: (projectId: string) => Promise<void>;
  upsertBoardColumn: (col: { id?: string; status_key: string; label: string; position: number }) => Promise<void>;
  deleteBoardColumn: (id: string) => Promise<void>;
  reorderBoardColumns: (columns: BoardColumn[]) => Promise<void>;
  createProject: (data: {
    name: string;
    description?: string;
    github_repo_url?: string;
  }) => Promise<void>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
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
  boardColumns: [],
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

  fetchBoardColumns: async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from("board_columns")
        .select("*")
        .eq("project_id", projectId)
        .order("position", { ascending: true });
      if (error) throw error;

      if (data && data.length > 0) {
        set({ boardColumns: data });
      } else {
        const defaults: { status_key: string; label: string }[] = [
          { status_key: "todo", label: "To Do" },
          { status_key: "in_progress", label: "In Progress" },
          { status_key: "review", label: "Review" },
          { status_key: "done", label: "Done" },
          { status_key: "blocked", label: "Blocked" },
        ];
        const inserts = defaults.map((d, i) => ({
          project_id: projectId,
          status_key: d.status_key,
          label: d.label,
          position: i,
        }));
        const { data: inserted } = await supabase
          .from("board_columns")
          .insert(inserts)
          .select()
          .order("position", { ascending: true });
        set({ boardColumns: inserted || [] });
      }
    } catch (err) {
      console.error("Error fetching board columns:", err);
    }
  },

  upsertBoardColumn: async (col) => {
    const { activeProject } = get();
    if (!activeProject) return;
    try {
      if (col.id) {
        const { error } = await supabase
          .from("board_columns")
          .update({ label: col.label, position: col.position })
          .eq("id", col.id);
        if (error) throw error;
        set((state) => ({
          boardColumns: state.boardColumns.map((c) =>
            c.id === col.id ? { ...c, label: col.label, position: col.position } : c
          ),
        }));
      } else {
        const { data, error } = await supabase
          .from("board_columns")
          .insert({
            project_id: activeProject.id,
            status_key: col.status_key,
            label: col.label,
            position: col.position,
          })
          .select()
          .single();
        if (error) throw error;
        set((state) => ({
          boardColumns: [...state.boardColumns, data],
        }));
      }
    } catch (err) {
      console.error("Error upserting board column:", err);
    }
  },

  deleteBoardColumn: async (id) => {
    try {
      const { error } = await supabase.from("board_columns").delete().eq("id", id);
      if (error) throw error;
      set((state) => ({
        boardColumns: state.boardColumns.filter((c) => c.id !== id),
      }));
    } catch (err) {
      console.error("Error deleting board column:", err);
    }
  },

  reorderBoardColumns: async (columns) => {
    try {
      const updates = columns.map((c, i) => ({
        id: c.id,
        position: i,
        label: c.label,
        project_id: c.project_id,
        status_key: c.status_key,
      }));
      const { error } = await supabase.from("board_columns").upsert(updates);
      if (error) throw error;
      set({ boardColumns: columns.map((c, i) => ({ ...c, position: i })) });
    } catch (err) {
      console.error("Error reordering board columns:", err);
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

      await supabase.from("channels").insert({
        project_id: project.id,
        name: project.name.toLowerCase().replace(/\s+/g, "-"),
        type: "project",
        created_by: user.user.id,
      });

      const defaultColumns = [
        { status_key: "todo", label: "To Do", position: 0 },
        { status_key: "in_progress", label: "In Progress", position: 1 },
        { status_key: "review", label: "Review", position: 2 },
        { status_key: "done", label: "Done", position: 3 },
        { status_key: "blocked", label: "Blocked", position: 4 },
      ];
      await supabase.from("board_columns").insert(
        defaultColumns.map((c) => ({ ...c, project_id: project.id }))
      );

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

  deleteProject: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        activeProject: state.activeProject?.id === id ? null : state.activeProject,
        loading: false,
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Error al eliminar proyecto",
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
        .select("*, assignee:profiles!tasks_assignee_id_fkey(id, name, email, role), reporter:profiles!tasks_reporter_id_fkey(id, name, email, role)")
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

      const { data: fresh } = await supabase
        .from("tasks")
        .select("*, assignee:profiles!tasks_assignee_id_fkey(id, name, email, role), reporter:profiles!tasks_reporter_id_fkey(id, name, email, role)")
        .eq("id", id)
        .single();

      set((state) => ({
        tasks: fresh
          ? state.tasks.map((t) => (t.id === id ? fresh : t))
          : state.tasks.map((t) =>
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
        get().fetchBoardColumns(project.id),
      ]);
    } else {
      set({ tasks: [], sprints: [], members: [], boardColumns: [], loading: false });
    }
  },

  setLoading: (loading) => set({ loading }),
  clearError: () => set({ error: null }),
}));

export default useProjectStore;
