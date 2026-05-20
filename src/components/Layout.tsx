import { Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { useAuth } from "../lib/auth";
import { Search, Bell } from "lucide-react";

export function Layout() {
  const { admin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!admin) navigate("/login");
  }, [admin]);

  if (!admin) return null;

  return (
    <div className="flex h-screen bg-[#0a0a0f] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-56 overflow-hidden">
        {/* Topbar */}
        <header className="flex-shrink-0 h-14 border-b border-[#1e1e2e] bg-[#0d0d16] flex items-center px-6 gap-4">
          <div className="flex-1 relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
            <input placeholder="Search users, orders, streams..."
              className="w-full bg-[#1e1e2e] border border-[#2a2a3e] rounded-lg pl-9 pr-4 py-2 text-[12px] text-white/70 placeholder-white/20 focus:outline-none focus:border-purple-500/50" />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button className="relative w-8 h-8 rounded-lg bg-[#1e1e2e] border border-[#2a2a3e] flex items-center justify-center hover:border-purple-500/30 transition-all">
              <Bell className="w-3.5 h-3.5 text-white/40" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500" />
            </button>
            <div className="w-7 h-7 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-[10px] font-black text-purple-300">
              {admin.name[0]}
            </div>
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
