import { Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { useAuth } from "../lib/auth";
import { Search, Bell, ChevronDown } from "lucide-react";

export function Layout() {
  const { admin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!admin) navigate("/login", { replace: true });
  }, [admin, navigate]);

  if (!admin) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 16,
          background: "linear-gradient(135deg,#7c3aed,#ec4899)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, fontWeight: 900, color: "#fff",
        }}>S</div>
        <div style={{
          width: 20, height: 20, borderRadius: "50%",
          border: "2px solid rgba(124,58,237,0.25)",
          borderTopColor: "#7c3aed",
          animation: "spin 0.7s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)" }}>
      <Sidebar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", marginLeft: 260, overflow: "hidden" }}>
        {/* Topbar */}
        <header style={{
          height: 64, flexShrink: 0,
          display: "flex", alignItems: "center", padding: "0 24px", gap: 16,
          background: "var(--surface)", borderBottom: "1px solid var(--border)",
        }}>
          {/* Search */}
          <div style={{ position: "relative", flex: 1, maxWidth: 380 }}>
            <Search size={14} style={{
              position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
              color: "rgba(240,242,255,0.25)", pointerEvents: "none",
            }} />
            <input
              placeholder="Search users, orders, streams..."
              style={{
                width: "100%", paddingLeft: 36, paddingRight: 16, height: 38,
                borderRadius: 10, border: "1px solid var(--border)",
                background: "rgba(255,255,255,0.03)",
                color: "var(--text)", fontSize: 13,
                outline: "none", transition: "border-color 0.15s",
              }}
              onFocus={e => (e.target.style.borderColor = "rgba(124,58,237,0.5)")}
              onBlur={e => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            {/* Bell */}
            <button style={{
              width: 38, height: 38, borderRadius: 10,
              border: "1px solid var(--border)", background: "rgba(255,255,255,0.03)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", position: "relative",
            }}>
              <Bell size={15} style={{ color: "rgba(240,242,255,0.4)" }} />
              <span style={{
                position: "absolute", top: 8, right: 8,
                width: 7, height: 7, borderRadius: "50%",
                background: "#ef4444", border: "2px solid var(--surface)",
              }} />
            </button>

            {/* User pill */}
            <button style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "6px 12px 6px 6px", borderRadius: 10,
              border: "1px solid var(--border)", background: "rgba(255,255,255,0.03)",
              cursor: "pointer",
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "linear-gradient(135deg,#7c3aed,#ec4899)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 800, color: "#fff", flexShrink: 0,
              }}>
                {admin.name[0]}
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(240,242,255,0.65)" }}>
                {admin.name}
              </span>
              <ChevronDown size={13} style={{ color: "rgba(240,242,255,0.3)" }} />
            </button>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: "auto" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
