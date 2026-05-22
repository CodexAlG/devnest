-- ============================================================
-- Board columns configurables por proyecto
-- ============================================================

CREATE TABLE board_columns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status_key TEXT NOT NULL,
  label TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_board_columns_project_status ON board_columns(project_id, status_key);
CREATE INDEX idx_board_columns_project ON board_columns(project_id);

ALTER TABLE board_columns ENABLE ROW LEVEL SECURITY;

-- Usuarios autenticados pueden ver columnas de proyectos donde son miembros
CREATE POLICY "board_columns_select" ON board_columns
  FOR SELECT
  USING (is_project_member(project_id));

-- Coordinadores pueden insertar/actualizar/eliminar columnas
CREATE POLICY "board_columns_insert" ON board_columns
  FOR INSERT
  WITH CHECK (is_project_coordinator(project_id));

CREATE POLICY "board_columns_update" ON board_columns
  FOR UPDATE
  USING (is_project_coordinator(project_id));

CREATE POLICY "board_columns_delete" ON board_columns
  FOR DELETE
  USING (is_project_coordinator(project_id));
