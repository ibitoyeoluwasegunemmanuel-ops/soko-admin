import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

export function Login() {
  const { login, admin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (admin) return <Navigate to="/" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (ok) navigate("/");
    else setError("Invalid email or password");
  }

  const inputStyle = {
    width: "100%", height: 46, padding: "0 14px",
    borderRadius: 12, border: "1px solid var(--border2)",
    background: "var(--bg)", color: "var(--text)",
    fontSize: 14, outline: "none",
    transition: "border-color 0.15s",
  } as React.CSSProperties;

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px",
      position: "relative", overflow: "hidden",
    }}>
      {/* Background accents */}
      <div style={{
        position: "absolute", top: -200, right: -200,
        width: 500, height: 500, borderRadius: "50%",
        background: "rgba(124,58,237,0.08)", filter: "blur(80px)", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: -150, left: -150,
        width: 400, height: 400, borderRadius: "50%",
        background: "rgba(236,72,153,0.06)", filter: "blur(80px)", pointerEvents: "none",
      }} />

      <div style={{ width: "100%", maxWidth: 400, position: "relative" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 18, margin: "0 auto 16px",
            background: "linear-gradient(135deg,#7c3aed,#ec4899)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, fontWeight: 900, color: "#fff",
            boxShadow: "0 20px 40px rgba(124,58,237,0.3)",
          }}>S</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.5px" }}>
            Soko Admin
          </h1>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>
            Sign in to your admin account
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "var(--surface)", borderRadius: 20,
          border: "1px solid var(--border)", padding: 28,
        }}>
          {error && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "12px 14px", borderRadius: 12, marginBottom: 20,
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            }}>
              <AlertCircle size={15} style={{ color: "#ef4444", flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#fca5a5" }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@soko.app"
                required
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "rgba(124,58,237,0.6)")}
                onBlur={e => (e.target.style.borderColor = "var(--border2)")}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  style={{ ...inputStyle, paddingRight: 44 }}
                  onFocus={e => (e.target.style.borderColor = "rgba(124,58,237,0.6)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border2)")}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{
                    position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--muted)", padding: 0, display: "flex",
                  }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", height: 46, borderRadius: 12, border: "none",
                background: loading ? "rgba(124,58,237,0.5)" : "linear-gradient(135deg,#7c3aed,#ec4899)",
                color: "#fff", fontSize: 14, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "opacity 0.15s, transform 0.15s",
                boxShadow: "0 4px 20px rgba(124,58,237,0.25)",
                marginTop: 4,
              }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          {/* Hint */}
          <div style={{
            marginTop: 20, padding: "12px 14px", borderRadius: 10,
            background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)",
          }}>
            <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>Demo credentials</p>
            <p style={{ fontSize: 12, color: "rgba(167,139,250,0.8)", fontFamily: "monospace" }}>
              admin@soko.app / soko2026
            </p>
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: "rgba(240,242,255,0.15)", marginTop: 20 }}>
          Authorised personnel only · Soko Platform v2.0
        </p>
      </div>
    </div>
  );
}
