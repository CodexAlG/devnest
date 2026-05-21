import { useState, useEffect, useRef } from "react";
import { useProjectStore } from "../../store/projectStore";
import { useChatStore } from "../../store/chatStore";
import { useAuthStore } from "../../store/authStore";
import { useRealtimeChannel } from "../../hooks/useRealtime";
import ChannelSidebar from "../../components/chat/ChannelSidebar";
import MessageBubble from "../../components/chat/MessageBubble";
import type { Channel } from "../../types/entities";

export default function ChatPage(): React.JSX.Element {
  const { activeProject } = useProjectStore();
  const { user } = useAuthStore();
  const { channels, activeChannel, messages, loadingMessages, fetchChannels, setActiveChannel, sendMessage, createProjectChannel } = useChatStore();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isCoordinator = user?.role === "coordinator" || user?.role === "admin";

  useEffect(() => {
    if (activeProject) {
      fetchChannels(activeProject.id);
    } else {
      fetchChannels();
    }
  }, [activeProject]);

  useRealtimeChannel(activeChannel?.id || null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !activeChannel) return;
    await sendMessage(activeChannel.id, input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCreateChannel = async () => {
    if (!activeProject) return;
    const name = prompt("Nombre del canal:");
    if (name) {
      await createProjectChannel(activeProject.id, name);
    }
  };

  return (
    <div style={{ display: "flex", height: "100%", margin: "-24px", overflow: "hidden" }}>
      <ChannelSidebar
        channels={channels}
        activeChannel={activeChannel}
        onSelect={setActiveChannel}
        onCreateChannel={handleCreateChannel}
        canCreate={isCoordinator}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--bg-base)" }}>
        {activeChannel ? (
          <>
            <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px", color: "var(--text-muted)" }}>#</span>
              <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>{activeChannel.name}</span>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
              {loadingMessages && messages.length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "40px" }}>Cargando mensajes...</div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "40px" }}>
                  No hay mensajes aún. ¡Sé el primero!
                </div>
              ) : (
                messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} isOwn={msg.sender_id === user?.id} />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: "12px", alignItems: "flex-end" }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Mensaje en #${activeChannel.name}...`}
                style={{
                  flex: 1,
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-primary)",
                  padding: "10px 12px",
                  fontSize: "14px",
                  outline: "none",
                  resize: "none",
                  maxHeight: "120px",
                  minHeight: "40px",
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                style={{
                  padding: "10px 16px",
                  background: input.trim() ? "var(--accent)" : "var(--bg-hover)",
                  color: input.trim() ? "#fff" : "var(--text-muted)",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  fontSize: "16px",
                  cursor: input.trim() ? "pointer" : "not-allowed",
                }}
              >
                →
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
            Selecciona un canal para comenzar
          </div>
        )}
      </div>
    </div>
  );
}
