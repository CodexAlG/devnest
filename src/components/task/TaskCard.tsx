import { useDraggable, useDroppable } from "@dnd-kit/core";
import type { Task } from "../../types/entities";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
}

const priorityColors: Record<string, string> = {
  low: "var(--text-muted)",
  medium: "var(--info)",
  high: "var(--warning)",
  critical: "var(--danger)",
};

export default function TaskCard({ task, onEdit }: TaskCardProps): React.JSX.Element {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });

  const style: React.CSSProperties = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : {};

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "12px",
        marginBottom: "8px",
        cursor: "grab",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        ...style,
      }}
      onClick={() => onEdit(task)}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.2)")}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
        <span style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 500, lineHeight: 1.4 }}>
          {task.title}
        </span>
        <span
          style={{
            fontSize: "10px",
            padding: "1px 6px",
            borderRadius: "var(--radius-sm)",
            background: priorityColors[task.priority] + "20",
            color: priorityColors[task.priority],
            fontWeight: 600,
            flexShrink: 0,
            marginLeft: "8px",
          }}
        >
          {task.priority}
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {task.assignee && (
            <>
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: "var(--accent-soft)",
                  color: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "9px",
                  fontWeight: 700,
                }}
              >
                {task.assignee.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                {task.assignee.name.split(" ")[0]}
              </span>
            </>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {task.story_points && (
            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>
              {task.story_points} pts
            </span>
          )}
          {task.github_pr_url && (
            <span style={{ fontSize: "12px", color: "var(--info)" }} title="PR vinculado">
              ⎇
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
