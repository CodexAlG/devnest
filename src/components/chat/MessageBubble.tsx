import ReactMarkdown from "react-markdown";
import type { Message, AppUser } from "../../types/entities";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

const roleColors: Record<string, string> = {
  admin: "var(--danger)",
  coordinator: "var(--accent)",
  intern: "var(--success)",
};

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const time = date.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
  return isToday ? time : `${date.toLocaleDateString("es", { day: "numeric", month: "short" })} ${time}`;
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps): React.JSX.Element {
  const initials = message.sender?.name
    ? message.sender.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const senderColor = message.sender?.role ? roleColors[message.sender.role] : "var(--text-muted)";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isOwn ? "row-reverse" : "row",
        gap: "10px",
        marginBottom: "12px",
        alignItems: "flex-start",
      }}
    >
      {message.is_ai_response ? (
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "var(--accent-soft)",
            border: "2px solid var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "10px",
            fontWeight: 700,
            color: "var(--accent)",
            flexShrink: 0,
          }}
        >
          IA
        </div>
      ) : (
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: senderColor + "20",
            color: senderColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
      )}

      <div
        style={{
          maxWidth: "70%",
          background: message.is_ai_response
            ? "var(--accent-soft)"
            : isOwn
            ? "var(--bg-active)"
            : "var(--bg-surface)",
          border: message.is_ai_response ? "none" : "1px solid var(--border)",
          borderLeft: message.is_ai_response ? "2px solid var(--accent)" : "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          padding: "10px 14px",
        }}
      >
        {!message.is_ai_response && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
              {message.sender?.name || "Usuario"}
            </span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              {formatTimestamp(message.created_at)}
            </span>
          </div>
        )}
        <div
          style={{
            fontSize: "14px",
            color: "var(--text-primary)",
            lineHeight: 1.5,
          }}
        >
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
