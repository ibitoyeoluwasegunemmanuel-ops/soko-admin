import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Eye, EyeOff, AlertCircle, Lock, ShieldCheck } from "lucide-react";

export function Login() {
  const { login, admin, mustChangePassword, changePassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  // Change password state
  const [newPw, setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [changingPw, setChangingPw] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (admin && !mustChangePassword) return <Navigate to="/" replace />;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (!res.ok) { setError("Invalid email or password."); return; }
    if (!res.mustChange) navigate("/");
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (newPw !== confirmPw) { setError("Passwords do not match."); return; }
    setChangingPw(true); setError("");
    await changePassword(newPw);
    setChangingPw(false);
    navigate("/");
  }

  const inputSt = {
    width: "100%", height: 46, padding: "0 44px 0 14px",
    borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)",
    background: "var(--bg)", color: "var(--text)", fontSize: 14, outline: "none",
    transition: "border-color 0.15s",
  } as React.CSSProperties;

  // ── Change Password screen ─────────────────────────────────────────────────
  if (mustChangePassword && admin) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -200, right: -200, width: 500, height: 500, borderRadius: "50%", background: "rgba(124,58,237,0.08)", filter: "blur(80px)", pointerEvents: "none" }} />
        <div style={{ width: "100%", maxWidth: 420, position: "relative" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, margin: "0 auto 16px", background: "linear-gradient(135deg,#7c3aed,#ec4899)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 20px 40px rgba(124,58,237,0.3)" }}>
              <ShieldCheck size={26} style={{ color: "#fff" }} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.5px" }}>Set Your Password</h1>
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 8 }}>
              Welcome, <strong style={{ color: "var(--text)" }}>{admin.name}</strong>. You must create a new password before continuing.
            </p>
          </div>

          <div style={{ background: "var(--surface)", borderRadius: 20, border: "1px solid var(--border)", padding: 28 }}>
            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 12, marginBottom: 20, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <AlertCircle size={15} style={{ color: "#ef4444", flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "#fca5a5" }}>{error}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>New Password</label>
                <div style={{ position: "relative" }}>
                  <input type={showNew ? "text" : "password"} value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min. 8 characters" required style={inputSt}
                    onFocus={e => (e.target.style.borderColor = "rgba(124,58,237,0.6)")}
                    onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.12)")} />
                  <button type="button" onClick={() => setShowNew(v => !v)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 0, display: "flex" }}>
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>Confirm Password</label>
                <div style={{ position: "relative" }}>
                  <input type={showConfirm ? "text" : "password"} value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Re-enter password" required style={inputSt}
                    onFocus={e => (e.target.style.borderColor = "rgba(124,58,237,0.6)")}
                    onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.12)")} />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 0, display: "flex" }}>
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {newPw && confirmPw && newPw !== confirmPw && (
                  <p style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>Passwords do not match</p>
                )}
              </div>

              {/* Strength indicator */}
              {newPw && (
                <div>
                  <div style={{ height: 4, borderRadius: 99, background: "var(--bg)", overflow: "hidden", marginBottom: 4 }}>
                    <div style={{ height: "100%", borderRadius: 99, transition: "width 0.3s, background 0.3s", width: newPw.length >= 12 ? "100%" : newPw.length >= 8 ? "66%" : "33%", background: newPw.length >= 12 ? "#10b981" : newPw.length >= 8 ? "#f59e0b" : "#ef4444" }} />
                  </div>
                  <p style={{ fontSize: 11, color: "var(--muted)" }}>{newPw.length >= 12 ? "Strong" : newPw.length >= 8 ? "Good" : "Too short"}</p>
                </div>
              )}

              <button type="submit" disabled={changingPw || newPw !== confirmPw || newPw.length < 8} style={{ height: 46, borderRadius: 12, border: "none", background: "linear-gradient(135deg,#7c3aed,#ec4899)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: (changingPw || newPw !== confirmPw || newPw.length < 8) ? 0.5 : 1 }}>
                {changingPw ? "Setting Password…" : "Set Password & Enter Dashboard"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Login screen ──────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -200, right: -200, width: 500, height: 500, borderRadius: "50%", background: "rgba(124,58,237,0.08)", filter: "blur(80px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -150, left: -150, width: 400, height: 400, borderRadius: "50%", background: "rgba(236,72,153,0.06)", filter: "blur(80px)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 400, position: "relative" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, margin: "0 auto 16px", background: "linear-gradient(135deg,#7c3aed,#ec4899)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 900, color: "#fff", boxShadow: "0 20px 40px rgba(124,58,237,0.3)" }}>S</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.5px" }}>Soko Admin</h1>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>Sign in to your account</p>
        </div>

        <div style={{ background: "var(--surface)", borderRadius: 20, border: "1px solid var(--border)", padding: 28 }}>
          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 12, marginBottom: 20, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <AlertCircle size={15} style={{ color: "#ef4444", flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#fca5a5" }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@soko.app" required style={{ ...inputSt, padding: "0 14px" }}
                onFocus={e => (e.target.style.borderColor = "rgba(124,58,237,0.6)")}
                onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.12)")} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>Password</label>
              <div style={{ position: "relative" }}>
                <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required style={inputSt}
                  onFocus={e => (e.target.style.borderColor = "rgba(124,58,237,0.6)")}
                  onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.12)")} />
                <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 0, display: "flex" }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} style={{ height: 46, borderRadius: 12, border: "none", background: "linear-gradient(135deg,#7c3aed,#ec4899)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: loading ? 0.6 : 1, boxShadow: "0 4px 20px rgba(124,58,237,0.25)", marginTop: 4 }}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div style={{ marginTop: 20, padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
            <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>Demo credentials</p>
            <p style={{ fontSize: 12, color: "rgba(167,139,250,0.8)", fontFamily: "monospace" }}>admin@soko.app / soko2026</p>
          </div>
        </div>
        <p style={{ textAlign: "center", fontSize: 11, color: "rgba(240,242,255,0.15)", marginTop: 20 }}>Authorised personnel only · Soko Platform v2.0</p>
      </div>
    </div>
  );
}
