import { useState, useEffect } from "react";
import { DndContext, DragEndEvent, closestCorners } from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { useProjectStore } from "../../store/projectStore";
import TaskCard from "../../components/task/TaskCard";
import TaskModal from "../../components/task/TaskModal";
import type { Task, TaskStatus, Sprint } from "../../types/entities";

const columns: { id: TaskStatus; label: string }[] = [
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" },
  { id: "blocked", label: "Blocked" },
];

function DroppableColumn({
  id,
  label,
  tasks,
  onEditTask,
  onAddTask,
}: {
  id: TaskStatus;
  label: string;
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
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
        <button
          onClick={() => onAddTask(id)}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            fontSize: "18px",
            cursor: "pointer",
            lineHeight: 1,
          }}
        >
          +
        </button>
      </div>

      <div style={{ flex: 1 }}>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onEdit={onEditTask} />
        ))}
      </div>
    </div>
  );
}

const statusBadgeColors: Record<string, string> = {
  planning: "var(--text-muted)",
  active: "var(--success)",
  completed: "var(--info)",
};

export default function BoardPage(): React.JSX.Element {
  const { activeProject, tasks, sprints, updateTask } = useProjectStore();
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>("none");
  const [editingTask, setEditingTask] = useState<Task | null | undefined>(undefined);
  const [addingStatus, setAddingStatus] = useState<TaskStatus | null>(null);

  useEffect(() => {
    const activeSprint = sprints.find((s) => s.status === "active");
    if (activeSprint) {
      setSelectedSprintId(activeSprint.id);
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

    if (columns.find((c) => c.id === newStatus)) {
      updateTask(taskId, { status: newStatus });
    }
  };

  const boardTasks =
    selectedSprintId === "none"
      ? tasks.filter((t) => !t.sprint_id)
      : tasks.filter((t) => t.sprint_id === selectedSprintId);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ fontSize: "20px", color: "var(--text-primary)" }}>
          {activeProject.name} — Board
        </h1>

        <select
          value={selectedSprintId ?? "none"}
          onChange={(e) => setSelectedSprintId(e.target.value || "none")}
          style={{
            padding: "8px 12px",
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            color: "var(--text-secondary)",
            fontSize: "13px",
            outline: "none",
            minWidth: "200px",
          }}
        >
          <option value="none">Sin sprint</option>
          {sprints.map((sprint: Sprint) => (
            <option key={sprint.id} value={sprint.id}>
              {sprint.name} — {sprint.status}
            </option>
          ))}
        </select>
      </div>

      <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div style={{ display: "flex", gap: "12px", flex: 1, overflowX: "auto" }}>
          {columns.map((col) => (
            <DroppableColumn
              key={col.id}
              id={col.id}
              label={col.label}
              tasks={boardTasks.filter((t) => t.status === col.id)}
              onEditTask={setEditingTask}
              onAddTask={(status) => {
                setEditingTask(null);
                setAddingStatus(status);
              }}
            />
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
    </div>
  );
}
