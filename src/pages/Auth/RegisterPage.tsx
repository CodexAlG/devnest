import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../services/supabase";

export default function RegisterPage(): React.JSX.Element {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"coordinator" | "intern">("intern");
  const [passwordError, setPasswordError] = useState("");
  const [registered, setRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const { register, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleResend = async () => {
    await supabase.auth.resend({
      type: 'signup',
      email: registeredEmail
    })
    setResendCooldown(60)
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setPasswordError("");

    if (password !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden");
      return;
    }

    const result = await register(email, password, name, role);
    if (result?.success) {
      setRegisteredEmail(email);
      setRegistered(true);
    }
  };

  if (registered) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font)'
      }}>
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '40px', width: '400px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>
            Revisa tu correo
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Enviamos un enlace de confirmación a:
          </p>
          <p style={{ 
            color: 'var(--accent)', fontWeight: '600', marginBottom: '24px' 
          }}>
            {registeredEmail}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
            Haz clic en el enlace del correo para activar tu cuenta.
            Después podrás iniciar sesión normalmente.
          </p>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'var(--accent)', color: 'white', border: 'none',
              padding: '10px 24px', borderRadius: 'var(--radius-md)',
              cursor: 'pointer', fontSize: '14px', width: '100%',
              marginBottom: '12px'
            }}>
            Ir al Login
          </button>
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0}
            style={{
              background: 'transparent', 
              color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--accent)',
              border: '1px solid var(--border)',
              padding: '10px 24px', borderRadius: 'var(--radius-md)',
              cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
              fontSize: '14px', width: '100%'
            }}>
            {resendCooldown > 0 
              ? `Reenviar en ${resendCooldown}s` 
              : 'Reenviar correo'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "var(--bg-base)",
      }}
    >
      <div
        style={{
          width: "400px",
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "32px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "var(--radius-md)",
              background: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "18px",
              color: "#fff",
              margin: "0 auto 12px",
            }}
          >
            DN
          </div>
          <h1 style={{ fontSize: "20px", color: "var(--text-primary)", fontWeight: 700 }}>
            Crear cuenta
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
            Área de Software
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: "6px",
              }}
            >
              Nombre completo
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "var(--bg-base)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-primary)",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: "6px",
              }}
            >
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "var(--bg-base)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-primary)",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: "6px",
              }}
            >
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "var(--bg-base)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-primary)",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: "6px",
              }}
            >
              Confirmar contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "var(--bg-base)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-primary)",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: "6px",
              }}
            >
              Rol
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "coordinator" | "intern")}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "var(--bg-base)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-primary)",
                fontSize: "14px",
                outline: "none",
              }}
            >
              <option value="intern">Practicante</option>
              <option value="coordinator">Coordinador</option>
            </select>
          </div>

          {passwordError && (
            <p
              style={{
                color: "var(--danger)",
                fontSize: "12px",
                marginBottom: "16px",
                textAlign: "center",
              }}
            >
              {passwordError}
            </p>
          )}

          {error && (
            <p
              style={{
                color: "var(--danger)",
                fontSize: "12px",
                marginBottom: "16px",
                textAlign: "center",
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px",
              background: loading ? "var(--accent-hover)" : "var(--accent)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--radius-md)",
              fontSize: "14px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: "20px",
            fontSize: "13px",
            color: "var(--text-muted)",
          }}
        >
          ¿Ya tienes cuenta?{" "}
          <Link
            to="/login"
            style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
