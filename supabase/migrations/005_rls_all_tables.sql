-- ============================================================
-- Row Level Security (RLS) para todas las tablas de DevNest
-- Corrige recursión infinita en project_members
-- ============================================================

-- ============================================================
-- Funciones auxiliares SECURITY DEFINER (rompen ciclos RLS)
-- ============================================================

-- Verifica si el usuario es miembro de un proyecto (bypass RLS)
CREATE OR REPLACE FUNCTION public.is_project_member(pid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = $1 AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Verifica si el usuario es coordinador de un proyecto (bypass RLS)
CREATE OR REPLACE FUNCTION public.is_project_coordinator(pid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = $1 AND coordinator_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Verifica si el usuario es admin (bypass RLS en profiles)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Verifica si el usuario es coordinador (bypass RLS en profiles)
CREATE OR REPLACE FUNCTION public.is_coordinator()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'coordinator'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 1. PROFILES
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuario ve su propio perfil" ON profiles;
CREATE POLICY "Usuario ve su propio perfil"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuario edita su propio perfil" ON profiles;
CREATE POLICY "Usuario edita su propio perfil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Coordinador ve todos los perfiles" ON profiles;
CREATE POLICY "Coordinador ve todos los perfiles"
  ON profiles FOR SELECT
  USING (public.is_coordinator() OR public.is_admin());

DROP POLICY IF EXISTS "Admin puede editar cualquier perfil" ON profiles;
CREATE POLICY "Admin puede editar cualquier perfil"
  ON profiles FOR UPDATE
  USING (public.is_admin());

-- ============================================================
-- 2. PROJECTS
-- ============================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Miembros del proyecto pueden ver" ON projects;
CREATE POLICY "Miembros del proyecto pueden ver"
  ON projects FOR SELECT
  USING (
    coordinator_id = auth.uid()
    OR public.is_project_member(id)
    OR public.is_coordinator()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Usuarios autenticados pueden crear proyectos" ON projects;
CREATE POLICY "Usuarios autenticados pueden crear proyectos"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = coordinator_id);

DROP POLICY IF EXISTS "Coordinador o admin pueden actualizar proyecto" ON projects;
CREATE POLICY "Coordinador o admin pueden actualizar proyecto"
  ON projects FOR UPDATE
  USING (
    coordinator_id = auth.uid()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Solo admin puede eliminar proyectos" ON projects;
CREATE POLICY "Solo admin puede eliminar proyectos"
  ON projects FOR DELETE
  USING (public.is_admin());

-- ============================================================
-- 3. PROJECT MEMBERS
-- ============================================================
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Miembros ven miembros de su proyecto" ON project_members;
CREATE POLICY "Miembros ven miembros de su proyecto"
  ON project_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_project_coordinator(project_id)
    OR public.is_coordinator()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Coordinador del proyecto gestiona miembros" ON project_members;
CREATE POLICY "Coordinador del proyecto gestiona miembros"
  ON project_members FOR INSERT
  WITH CHECK (
    public.is_project_coordinator(project_id)
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Coordinador del proyecto actualiza miembros" ON project_members;
CREATE POLICY "Coordinador del proyecto actualiza miembros"
  ON project_members FOR UPDATE
  USING (
    public.is_project_coordinator(project_id)
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Coordinador del proyecto elimina miembros" ON project_members;
CREATE POLICY "Coordinador del proyecto elimina miembros"
  ON project_members FOR DELETE
  USING (
    public.is_project_coordinator(project_id)
    OR public.is_admin()
  );

-- ============================================================
-- 4. SPRINTS
-- ============================================================
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Miembros del proyecto ven sprints" ON sprints;
CREATE POLICY "Miembros del proyecto ven sprints"
  ON sprints FOR SELECT
  USING (
    public.is_project_member(project_id)
    OR public.is_project_coordinator(project_id)
    OR public.is_coordinator()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Coordinador del proyecto gestiona sprints" ON sprints;
CREATE POLICY "Coordinador del proyecto gestiona sprints"
  ON sprints FOR INSERT
  WITH CHECK (
    public.is_project_coordinator(project_id)
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Coordinador del proyecto actualiza sprints" ON sprints;
CREATE POLICY "Coordinador del proyecto actualiza sprints"
  ON sprints FOR UPDATE
  USING (
    public.is_project_coordinator(project_id)
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Coordinador del proyecto elimina sprints" ON sprints;
CREATE POLICY "Coordinador del proyecto elimina sprints"
  ON sprints FOR DELETE
  USING (
    public.is_project_coordinator(project_id)
    OR public.is_admin()
  );

-- ============================================================
-- 5. TASKS
-- ============================================================
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Miembros del proyecto ven tareas" ON tasks;
CREATE POLICY "Miembros del proyecto ven tareas"
  ON tasks FOR SELECT
  USING (
    public.is_project_member(project_id)
    OR public.is_project_coordinator(project_id)
    OR public.is_coordinator()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Miembros del proyecto pueden crear tareas" ON tasks;
CREATE POLICY "Miembros del proyecto pueden crear tareas"
  ON tasks FOR INSERT
  WITH CHECK (
    public.is_project_member(project_id)
    OR public.is_project_coordinator(project_id)
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Miembros del proyecto actualizan tareas" ON tasks;
CREATE POLICY "Miembros del proyecto actualizan tareas"
  ON tasks FOR UPDATE
  USING (
    public.is_project_member(project_id)
    OR public.is_project_coordinator(project_id)
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Coordinador o admin eliminan tareas" ON tasks;
CREATE POLICY "Coordinador o admin eliminan tareas"
  ON tasks FOR DELETE
  USING (
    public.is_project_coordinator(project_id)
    OR public.is_admin()
  );

-- ============================================================
-- 6. CHANNELS
-- ============================================================
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Miembros ven canales" ON channels;
CREATE POLICY "Miembros ven canales"
  ON channels FOR SELECT
  USING (
    project_id IS NULL
    OR public.is_project_member(project_id)
    OR public.is_project_coordinator(project_id)
    OR public.is_coordinator()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Usuarios autenticados crean canales" ON channels;
CREATE POLICY "Usuarios autenticados crean canales"
  ON channels FOR INSERT
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Creador o admin actualizan canales" ON channels;
CREATE POLICY "Creador o admin actualizan canales"
  ON channels FOR UPDATE
  USING (
    created_by = auth.uid()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Creador o admin eliminan canales" ON channels;
CREATE POLICY "Creador o admin eliminan canales"
  ON channels FOR DELETE
  USING (
    created_by = auth.uid()
    OR public.is_admin()
  );

-- ============================================================
-- 7. MESSAGES
-- ============================================================
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Miembros ven mensajes del canal" ON messages;
CREATE POLICY "Miembros ven mensajes del canal"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM channels
      WHERE id = channel_id
      AND (
        project_id IS NULL
        OR public.is_project_member(project_id)
        OR public.is_project_coordinator(project_id)
        OR public.is_admin()
      )
    )
  );

DROP POLICY IF EXISTS "Usuarios autenticados envian mensajes" ON messages;
CREATE POLICY "Usuarios autenticados envian mensajes"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM channels
      WHERE id = channel_id
      AND (
        project_id IS NULL
        OR public.is_project_member(project_id)
        OR public.is_project_coordinator(project_id)
      )
    )
  );

DROP POLICY IF EXISTS "Sender edita su mensaje" ON messages;
CREATE POLICY "Sender edita su mensaje"
  ON messages FOR UPDATE
  USING (sender_id = auth.uid());

DROP POLICY IF EXISTS "Sender o admin eliminan mensajes" ON messages;
CREATE POLICY "Sender o admin eliminan mensajes"
  ON messages FOR DELETE
  USING (
    sender_id = auth.uid()
    OR public.is_admin()
  );
