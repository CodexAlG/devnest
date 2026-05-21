import type { Channel } from "../../types/entities";

interface ChannelSidebarProps {
  channels: Channel[];
  activeChannel: Channel | null;
  onSelect: (channel: Channel) => void;
  onCreateChannel: () => void;
  canCreate: boolean;
}

export default function ChannelSidebar({
  channels,
  activeChannel,
  onSelect,
  onCreateChannel,
  canCreate,
}: ChannelSidebarProps): React.JSX.Element {
  const generalChannel = channels.find((c) => c.type === "general");
  const projectChannels = channels.filter((c) => c.type === "project");

  return (
    <div
      style={{
        width: "200px",
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      {/* General */}
      <div style={{ padding: "12px 8px 4px" }}>
        <p style={sectionTitleStyle}>ÁREA</p>
        {generalChannel && (
          <button
            onClick={() => onSelect(generalChannel)}
            style={{
              ...channelBtnStyle,
              background: activeChannel?.id === generalChannel.id ? "var(--bg-active)" : "transparent",
              color: activeChannel?.id === generalChannel.id ? "var(--accent)" : "var(--text-secondary)",
              fontWeight: activeChannel?.id === generalChannel.id ? 600 : 400,
            }}
          >
            # {generalChannel.name}
          </button>
        )}
      </div>

      {/* Projects */}
      <div style={{ padding: "12px 8px 4px", flex: 1, overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px 4px" }}>
          <p style={{ ...sectionTitleStyle, margin: 0 }}>PROYECTOS</p>
          {canCreate && (
            <button onClick={onCreateChannel} style={addBtnStyle}>+</button>
          )}
        </div>
        {projectChannels.map((channel) => (
          <button
            key={channel.id}
            onClick={() => onSelect(channel)}
            style={{
              ...channelBtnStyle,
              background: activeChannel?.id === channel.id ? "var(--bg-active)" : "transparent",
              color: activeChannel?.id === channel.id ? "var(--accent)" : "var(--text-secondary)",
              fontWeight: activeChannel?.id === channel.id ? 600 : 400,
            }}
          >
            # {channel.name}
          </button>
        ))}
      </div>
    </div>
  );
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  color: "var(--text-muted)",
  letterSpacing: "0.08em",
  marginBottom: "4px",
};

const channelBtnStyle: React.CSSProperties = {
  width: "100%",
  textAlign: "left",
  padding: "6px 8px",
  borderRadius: "var(--radius-md)",
  border: "none",
  cursor: "pointer",
  fontSize: "13px",
  marginBottom: "2px",
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

const addBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--text-muted)",
  cursor: "pointer",
  fontSize: "16px",
  lineHeight: 1,
  padding: "0 4px",
};
