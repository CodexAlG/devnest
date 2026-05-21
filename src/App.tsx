import { Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./services/supabase";

export default function App(): React.JSX.Element {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#1E1E2E",
          color: "#7C6AF7",
          fontSize: "18px",
          fontFamily: "sans-serif",
        }}
      >
        DevNest — Conectando...
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#1E1E2E",
        color: "#E0E0FF",
        fontSize: "18px",
        fontFamily: "sans-serif",
      }}
    >
      ✅ App cargada correctamente — Supabase conectado
    </div>
  );
}
