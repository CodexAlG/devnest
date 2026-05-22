import { useState } from "react";

interface LogoProps {
  size?: number;
  style?: React.CSSProperties;
}

export default function Logo({ size = 32, style }: LogoProps): React.JSX.Element {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "var(--radius-md)",
          background: "var(--accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: Math.round(size * 0.5),
          color: "#fff",
          ...style,
        }}
      >
        DN
      </div>
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        flexShrink: 0,
        ...style,
      }}
    >
      <img
        src="/images/logodevnest.png"
        alt="DevNest"
        onError={() => setFailed(true)}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </div>
  );
}
