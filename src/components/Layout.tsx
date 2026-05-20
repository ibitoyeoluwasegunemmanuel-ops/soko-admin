import { Outlet, useNavigate, Navigate } from "react-router-dom";
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
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#08080f" }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black text-white"
          style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)" }}>S</div>
        <div className="w-5 h-5 rounded-full border-2 border-purple-500/30 border-t-purple-400 animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#08080f" }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden" style={{ marginLeft: 240 }}>
        {/* Topbar */}
        <header className="flex-shrink-0 h-[60px] flex items-center px-6 gap-4"
          style={{ background: "#0d0d18", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          {/* Search */}
          <div className="relative flex-1 max-w-[360px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" style={{ width: 14, height: 14 }} />
            <input
              placeholder="Search users, orders, streams..."
              className="w-full pl-9 pr-4 py-2 text-[13px] text-white/70 placeholder-white/20 rounded-xl focus:outline-none transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
              onFocus={e => (e.target.style.borderColor = "rgba(124,58,237,0.4)")}
              onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.07)")}
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Notification bell */}
            <button className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/[0.06]"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <Bell style={{ width: 15, height: 15, color: "rgba(255,255,255,0.45)" }} />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-[#0d0d18]" />
            </button>

            {/* Admin pill */}
            <button className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl transition-all hover:bg-white/[0.06]"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)" }}>
                {admin.name[0]}
              </div>
              <span className="text-[12px] font-medium text-white/60 hidden sm:block">{admin.name}</span>
              <ChevronDown style={{ width: 12, height: 12, color: "rgba(255,255,255,0.3)" }} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
