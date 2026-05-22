import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DndContext, DragEndEvent, closestCorners } from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { useProjectStore } from "../../store/projectStore";
import TaskCard from "../../components/task/TaskCard";
import TaskModal from "../../components/task/TaskModal";
import type { Task, TaskStatus, Sprint, BoardColumn } from "../../types/entities";

function DroppableColumn({
  id,
  label,
  tasks,
  onEditTask,
  onAddTask,
  onEditColumn,
  onDeleteColumn,
}: {
  id: TaskStatus;
  label: string;
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
  onEditColumn: () => void;
  onDeleteColumn: () => void;
}) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        flex: 1,
        minWidth: "220px",
        background: "var(--bg-sidebar)",
        borderRadius: "var(--radius-lg)",
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        minHeight: "400px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{label}</span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", background: "var(--bg-hover)", padding: "1px 6px", borderRadius: "var(--radius-sm)" }}>
            {tasks.length}
          </span>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          <button
            onClick={onEditColumn}
            title="Editar columna"
            style={{
              background: "none", border: "none", color: "var(--text-muted)",
              fontSize: "13px", cursor: "pointer", lineHeight: 1, padding: "2px 4px",
            }}
          >
            &#9998;
          </button>
          <button
            onClick={onDeleteColumn}
            title="Eliminar columna"
            style={{
              background: "none", border: "none", color: "var(--danger)",
              fontSize: "13px", cursor: "pointer", lineHeight: 1, padding: "2px 4px",
            }}
          >
            &#10005;
          </button>
          <button
            onClick={() => onAddTask(id)}
            style={{
              background: "none", border: "none", color: "var(--text-muted)",
              fontSize: "18px", cursor: "pointer", lineHeight: 1,
            }}
          >
            +
          </button>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onEdit={onEditTask} />
        ))}
      </div>
    </div>
  );
}

const ALL_STATUSES = ["todo", "in_progress", "review", "done", "blocked"] as const;

export default function BoardPage(): React.JSX.Element {
  const navigate = useNavigate();
  const {
    activeProject, tasks, sprints, members, boardColumns,
    updateTask, upsertBoardColumn, deleteBoardColumn, reorderBoardColumns,
  } = useProjectStore();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSprints, setSelectedSprints] = useState<Set<string>>(new Set());
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [editingTask, setEditingTask] = useState<Task | null | undefined>(undefined);
  const [addingStatus, setAddingStatus] = useState<TaskStatus | null>(null);
  const [editingColumn, setEditingColumn] = useState<{ id: string; status_key: string; label: string } | null>(null);
  const [showAddColumn, setShowAddColumn] = useState(false);

  useEffect(() => {
    const activeSprint = sprints.find((s) => s.status === "active");
    if (activeSprint) {
      setSelectedSprints(new Set([activeSprint.id]));
    }
  }, [sprints]);

  if (!activeProject) {
    return (
      <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
        <h2 style={{ color: "var(--text-primary)", marginBottom: "8px" }}>Selecciona un proyecto</h2>
        <p>Ve a la sección Proyectos y abre uno para ver su board</p>
      </div>
    );
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    if (boardColumns.find((c) => c.status_key === newStatus)) {
      updateTask(taskId, { status: newStatus });
    }
  };

  const toggleSprint = (id: string) => {
    setSelectedSprints((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const boardTasks = tasks.filter((t) => {
    const sprintMatch = selectedSprints.size === 0 || (
      (selectedSprints.has("__none__") && !t.sprint_id) ||
      (!!t.sprint_id && selectedSprints.has(t.sprint_id))
    );
    const memberMatch = selectedMembers.size === 0 || (!!t.assignee_id && selectedMembers.has(t.assignee_id));
    return sprintMatch && memberMatch;
  });

  const availableStatuses = ALL_STATUSES.filter(
    (s) => !boardColumns.find((c) => c.status_key === s)
  );

  const handleDeleteColumn = (col: BoardColumn) => {
    if (boardColumns.length <= 1) return;
    const tasksInCol = boardTasks.filter((t) => t.status === col.status_key);
    if (tasksInCol.length > 0 && !confirm(`Hay ${tasksInCol.length} tarea(s) en "${col.label}". ¿Moverlas a backlog y eliminar la columna?`)) {
      return;
    }
    tasksInCol.forEach((t) => updateTask(t.id, { status: "backlog" }));
    deleteBoardColumn(col.id);
  };

  const handleMoveColumn = (index: number, direction: -1 | 1) => {
    const cols = [...boardColumns];
    const target = index + direction;
    if (target < 0 || target >= cols.length) return;
    [cols[index], cols[target]] = [cols[target], cols[index]];
    reorderBoardColumns(cols);
  };

  const selectedNames: string[] = [];
  const noSprintSelected = selectedSprints.has("__none__");
  sprints.forEach((s) => { if (selectedSprints.has(s.id)) selectedNames.push(s.name); });
  if (noSprintSelected) selectedNames.push("Sin sprint");
  members.forEach((m) => { if (m.profile && selectedMembers.has(m.user_id)) selectedNames.push(m.profile.name); });

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <h1 style={{ fontSize: "20px", color: "var(--text-primary)" }}>
            {activeProject.name} — Board
          </h1>
          {(selectedSprints.size > 0 || selectedMembers.size > 0) && (
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {selectedNames.map((name) => (
                <span key={name} style={{
                  fontSize: "11px", padding: "2px 8px", borderRadius: "var(--radius-sm)",
                  background: "var(--accent-soft)", color: "var(--accent)", fontWeight: 600,
                  whiteSpace: "nowrap",
                }}>
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setShowFilters(true)}
            style={{
              padding: "8px 14px", background: (selectedSprints.size > 0 || selectedMembers.size > 0) ? "var(--accent)" : "var(--bg-surface)",
              color: (selectedSprints.size > 0 || selectedMembers.size > 0) ? "#fff" : "var(--text-secondary)",
              border: "1px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "13px",
              fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            Filtro {(selectedSprints.size > 0 || selectedMembers.size > 0) && `(${selectedSprints.size + selectedMembers.size})`}
          </button>
          <button
            onClick={() => setShowAddColumn(true)}
            style={{
              padding: "8px 14px", background: "var(--accent)", color: "#fff",
              border: "none", borderRadius: "var(--radius-md)", fontSize: "13px",
              fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            + Columna
          </button>
        </div>
      </div>

      <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div style={{ display: "flex", gap: "12px", flex: 1, overflowX: "auto", paddingBottom: "8px" }}>
          {boardColumns.map((col, index) => (
            <div key={col.id} style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: "220px" }}>
              <div style={{ display: "flex", justifyContent: "center", gap: "4px", marginBottom: "4px" }}>
                <button
                  onClick={() => handleMoveColumn(index, -1)}
                  disabled={index === 0}
                  style={{
                    background: "none", border: "none", color: index === 0 ? "var(--border)" : "var(--text-muted)",
                    cursor: index === 0 ? "default" : "pointer", fontSize: "16px", lineHeight: 1, padding: "2px",
                  }}
                >
                  &#9664;
                </button>
                <button
                  onClick={() => handleMoveColumn(index, 1)}
                  disabled={index === boardColumns.length - 1}
                  style={{
                    background: "none", border: "none", color: index === boardColumns.length - 1 ? "var(--border)" : "var(--text-muted)",
                    cursor: index === boardColumns.length - 1 ? "default" : "pointer", fontSize: "16px", lineHeight: 1, padding: "2px",
                  }}
                >
                  &#9654;
                </button>
              </div>
              <DroppableColumn
                id={col.status_key as TaskStatus}
                label={col.label}
                tasks={boardTasks.filter((t) => t.status === col.status_key)}
                onEditTask={(task) => navigate(`/board/task/${task.id}`)}
                onAddTask={(status) => { setEditingTask(null); setAddingStatus(status); }}
                onEditColumn={() => setEditingColumn({ id: col.id, status_key: col.status_key, label: col.label })}
                onDeleteColumn={() => handleDeleteColumn(col)}
              />
            </div>
          ))}
        </div>
      </DndContext>

      {(editingTask !== undefined || addingStatus !== null) && (
        <TaskModal
          task={editingTask}
          onClose={() => { setEditingTask(undefined); setAddingStatus(null); }}
          projectId={activeProject.id}
        />
      )}

      {showFilters && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}
          onClick={() => setShowFilters(false)}
        >
          <FilterPanel
            sprints={sprints}
            members={members}
            selectedSprints={selectedSprints}
            selectedMembers={selectedMembers}
            onToggleSprint={toggleSprint}
            onToggleMember={toggleMember}
            onDone={() => setShowFilters(false)}
          />
        </div>
      )}

      {editingColumn && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}
          onClick={() => setEditingColumn(null)}
        >
          <div
            style={{
              background: "var(--bg-surface)", borderRadius: "var(--radius-lg)",
              padding: "24px", width: "360px", border: "1px solid var(--border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: "var(--text-primary)", marginBottom: "16px", fontSize: "16px" }}>Editar columna</h3>
            <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Nombre</label>
            <input
              value={editingColumn.label}
              onChange={(e) => setEditingColumn({ ...editingColumn, label: e.target.value })}
              style={{
                width: "100%", padding: "8px 12px", background: "var(--bg-base)",
                border: "1px solid var(--border)", borderRadius: "var(--radius-md)",
                color: "var(--text-primary)", fontSize: "14px", outline: "none",
                boxSizing: "border-box", marginBottom: "16px",
              }}
            />
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setEditingColumn(null)}
                style={{
                  padding: "8px 16px", background: "var(--bg-hover)", color: "var(--text-secondary)",
                  border: "none", borderRadius: "var(--radius-md)", fontSize: "13px", cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await upsertBoardColumn({ id: editingColumn.id, status_key: editingColumn.status_key, label: editingColumn.label, position: 0 });
                  setEditingColumn(null);
                }}
                style={{
                  padding: "8px 16px", background: "var(--accent)", color: "#fff",
                  border: "none", borderRadius: "var(--radius-md)", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddColumn && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}
          onClick={() => setShowAddColumn(false)}
        >
          <AddColumnModal
            availableStatuses={availableStatuses}
            onClose={() => setShowAddColumn(false)}
            onAdd={async (status_key, label) => {
              await upsertBoardColumn({
                status_key, label, position: boardColumns.length,
              });
              setShowAddColumn(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

function FilterPanel({
  sprints,
  members,
  selectedSprints,
  selectedMembers,
  onToggleSprint,
  onToggleMember,
  onDone,
}: {
  sprints: Sprint[];
  members: { user_id: string; profile?: { id: string; name: string } | null }[];
  selectedSprints: Set<string>;
  selectedMembers: Set<string>;
  onToggleSprint: (id: string) => void;
  onToggleMember: (id: string) => void;
  onDone: () => void;
}) {
  const [openSprints, setOpenSprints] = useState(true);
  const [openMembers, setOpenMembers] = useState(true);

  const selectedTags: { label: string; onRemove: () => void }[] = [];
  if (selectedSprints.has("__none__")) selectedTags.push({ label: "Sin sprint", onRemove: () => onToggleSprint("__none__") });
  sprints.forEach((s) => { if (selectedSprints.has(s.id)) selectedTags.push({ label: s.name, onRemove: () => onToggleSprint(s.id) }); });
  members.forEach((m) => { if (m.profile && selectedMembers.has(m.user_id)) selectedTags.push({ label: m.profile.name, onRemove: () => onToggleMember(m.user_id) }); });

  return (
    <div
      style={{
        background: "var(--bg-surface)", borderRadius: "var(--radius-lg)",
        width: "360px", border: "1px solid var(--border)",
        display: "flex", flexDirection: "column", maxHeight: "80vh",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
        <h3 style={{ color: "var(--text-primary)", fontSize: "16px", margin: 0 }}>Filtro</h3>
      </div>

      {selectedTags.length > 0 && (
        <div style={{ padding: "10px 20px", borderBottom: "1px solid var(--border)", display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {selectedTags.map((tag) => (
            <span key={tag.label} style={{
              display: "inline-flex", alignItems: "center", gap: "4px",
              fontSize: "12px", padding: "3px 8px", borderRadius: "var(--radius-sm)",
              background: "var(--accent-soft)", color: "var(--accent)", fontWeight: 600,
            }}>
              {tag.label}
              <span
                onClick={tag.onRemove}
                style={{ cursor: "pointer", fontSize: "14px", lineHeight: 1, marginLeft: "2px" }}
              >
                &times;
              </span>
            </span>
          ))}
        </div>
      )}

      <div style={{ overflow: "auto", flex: 1, padding: "8px 0" }}>
        <SectionHeader label="Sprints" open={openSprints} onToggle={() => setOpenSprints(!openSprints)} />
        {openSprints && (
          <div style={{ padding: "0 20px 8px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 0", cursor: "pointer", fontSize: "14px", color: "var(--text-secondary)" }}>
              <input
                type="checkbox"
                checked={selectedSprints.has("__none__")}
                onChange={() => onToggleSprint("__none__")}
                style={{ accentColor: "var(--accent)" }}
              />
              Sin sprint
            </label>
            {sprints.map((s) => (
              <label key={s.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 0", cursor: "pointer", fontSize: "14px", color: "var(--text-secondary)" }}>
                <input
                  type="checkbox"
                  checked={selectedSprints.has(s.id)}
                  onChange={() => onToggleSprint(s.id)}
                  style={{ accentColor: "var(--accent)" }}
                />
                {s.name}
                <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "auto" }}>{s.status}</span>
              </label>
            ))}
          </div>
        )}

        <SectionHeader label="Miembros" open={openMembers} onToggle={() => setOpenMembers(!openMembers)} />
        {openMembers && (
          <div style={{ padding: "0 20px 8px" }}>
            {members.map((m) => (
              m.profile && (
                <label key={m.user_id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 0", cursor: "pointer", fontSize: "14px", color: "var(--text-secondary)" }}>
                  <input
                    type="checkbox"
                    checked={selectedMembers.has(m.user_id)}
                    onChange={() => onToggleMember(m.user_id)}
                    style={{ accentColor: "var(--accent)" }}
                  />
                  {m.profile.name}
                </label>
              )
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={onDone}
          style={{
            padding: "8px 24px", background: "var(--accent)", color: "#fff",
            border: "none", borderRadius: "var(--radius-md)", fontSize: "14px",
            fontWeight: 600, cursor: "pointer",
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}

function SectionHeader({ label, open, onToggle }: { label: string; open: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      style={{
        display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px",
        cursor: "pointer", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)",
        userSelect: "none",
      }}
    >
      <span style={{ fontSize: "10px", transition: "transform 0.15s", transform: open ? "rotate(90deg)" : "rotate(0deg)" }}>
        &#9654;
      </span>
      {label}
    </div>
  );
}

function AddColumnModal({
  availableStatuses,
  onClose,
  onAdd,
}: {
  availableStatuses: readonly string[];
  onClose: () => void;
  onAdd: (status_key: string, label: string) => Promise<void>;
}) {
  const [statusKey, setStatusKey] = useState(availableStatuses[0] || "");
  const [label, setLabel] = useState("");

  useEffect(() => {
    const labels: Record<string, string> = {
      todo: "To Do", in_progress: "In Progress", review: "Review",
      done: "Done", blocked: "Blocked",
    };
    if (statusKey && labels[statusKey]) setLabel(labels[statusKey]);
  }, [statusKey]);

  return (
    <div
      style={{
        background: "var(--bg-surface)", borderRadius: "var(--radius-lg)",
        padding: "24px", width: "360px", border: "1px solid var(--border)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <h3 style={{ color: "var(--text-primary)", marginBottom: "16px", fontSize: "16px" }}>Agregar columna</h3>

      <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Estado</label>
      <select
        value={statusKey}
        onChange={(e) => setStatusKey(e.target.value)}
        style={{
          width: "100%", padding: "8px 12px", background: "var(--bg-base)",
          border: "1px solid var(--border)", borderRadius: "var(--radius-md)",
          color: "var(--text-primary)", fontSize: "14px", outline: "none",
          marginBottom: "16px",
        }}
      >
        {availableStatuses.length === 0 && <option value="">No hay más estados disponibles</option>}
        {availableStatuses.map((s) => (
          <option key={s} value={s}>{s.replace("_", " ")}</option>
        ))}
      </select>

      <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Nombre visible</label>
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        style={{
          width: "100%", padding: "8px 12px", background: "var(--bg-base)",
          border: "1px solid var(--border)", borderRadius: "var(--radius-md)",
          color: "var(--text-primary)", fontSize: "14px", outline: "none",
          boxSizing: "border-box", marginBottom: "16px",
        }}
      />

      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        <button
          onClick={onClose}
          style={{
            padding: "8px 16px", background: "var(--bg-hover)", color: "var(--text-secondary)",
            border: "none", borderRadius: "var(--radius-md)", fontSize: "13px", cursor: "pointer",
          }}
        >
          Cancelar
        </button>
        <button
          onClick={() => onAdd(statusKey, label)}
          disabled={!statusKey || !label}
          style={{
            padding: "8px 16px", background: statusKey && label ? "var(--accent)" : "var(--bg-hover)",
            color: statusKey && label ? "#fff" : "var(--text-muted)",
            border: "none", borderRadius: "var(--radius-md)", fontSize: "13px",
            fontWeight: 600, cursor: statusKey && label ? "pointer" : "default",
          }}
        >
          Agregar
        </button>
      </div>
    </div>
  );
}
