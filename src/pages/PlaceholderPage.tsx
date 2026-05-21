export default function PlaceholderPage({ title }: { title: string }): React.JSX.Element {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: "12px",
      }}
    >
      <h1 style={{ fontSize: "2rem", color: "var(--text-primary)" }}>{title}</h1>
      <p style={{ color: "var(--text-muted)" }}>Próximamente</p>
    </div>
  );
}
