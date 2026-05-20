import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Star, Radio, ShoppingBag,
  Wrench, Building2, Gavel, Package, Wallet,
  ArrowUpFromLine, Gift, Flag, BarChart3, Settings,
  ScrollText, Shield, Sparkles, LogOut,
  Bell, CreditCard, Trophy, ImageIcon, Zap, CheckSquare
} from "lucide-react";
import { useAuth } from "../lib/auth";

const NAV = [
  { section: "Main Menu", items: [
    { to: "/",              icon: LayoutDashboard, label: "Overview" },
    { to: "/users",         icon: Users,           label: "Users" },
    { to: "/creators",      icon: Star,            label: "Creators" },
    { to: "/analytics",     icon: BarChart3,       label: "Analytics" },
  ]},
  { section: "Platform", items: [
    { to: "/live",          icon: Radio,           label: "Live Streaming" },
    { to: "/marketplace",   icon: ShoppingBag,     label: "Marketplace" },
    { to: "/services",      icon: Wrench,          label: "Services" },
    { to: "/businesses",    icon: Building2,       label: "Businesses" },
    { to: "/auctions",      icon: Gavel,           label: "Auctions" },
    { to: "/orders",        icon: Package,         label: "Orders" },
  ]},
  { section: "Finance", items: [
    { to: "/wallet",        icon: Wallet,          label: "Wallet & Payments" },
    { to: "/payouts",       icon: ArrowUpFromLine, label: "Payouts" },
    { to: "/coins-gifts",   icon: Gift,            label: "Coins & Gifts" },
    { to: "/subscriptions", icon: CreditCard,      label: "Subscriptions" },
    { to: "/ads",           icon: Zap,             label: "Ads & Boost" },
  ]},
  { section: "Growth", items: [
    { to: "/league",        icon: Trophy,          label: "League & Rankings" },
    { to: "/gift-gallery",  icon: ImageIcon,       label: "Gift Gallery" },
  ]},
  { section: "Control", items: [
    { to: "/moderation",    icon: Shield,          label: "Moderation" },
    { to: "/verification",  icon: CheckSquare,     label: "Verification" },
    { to: "/notifications", icon: Bell,            label: "Notifications" },
    { to: "/ai-settings",   icon: Sparkles,        label: "AI Settings" },
    { to: "/feature-flags", icon: Flag,            label: "Feature Flags" },
    { to: "/settings",      icon: Settings,        label: "App Settings" },
    { to: "/logs",          icon: ScrollText,      label: "System Logs" },
  ]},
];

export function Sidebar() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="fixed left-0 top-0 h-screen flex flex-col bg-[#0d0d18] border-r border-white/[0.06] z-40" style={{ width: 240 }}>
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[15px] font-black text-white flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)" }}>S</div>
        <div>
          <p className="text-[14px] font-bold text-white leading-tight">Soko Admin</p>
          <p className="text-[10px] font-semibold uppercase tracking-widest mt-0.5" style={{ color: "#a78bfa" }}>
            {admin?.role?.replace(/_/g, " ")}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {NAV.map(group => (
          <div key={group.section}>
            <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-white/25 px-3 mb-2">
              {group.section}
            </p>
            <div className="space-y-0.5">
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                      isActive
                        ? "text-white"
                        : "text-white/40 hover:text-white/75 hover:bg-white/[0.04]"
                    }`
                  }
                  style={({ isActive }) => isActive ? {
                    background: "linear-gradient(135deg,rgba(124,58,237,0.18),rgba(236,72,153,0.06))",
                    boxShadow: "inset 0 0 0 1px rgba(124,58,237,0.22)"
                  } : {}}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className="flex-shrink-0" style={{ width: 15, height: 15, color: isActive ? "#a78bfa" : undefined }} />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-white/[0.06] px-3 py-4 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-black text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)" }}>
            {admin?.name?.[0] ?? "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-white truncate">{admin?.name}</p>
            <p className="text-[10px] text-white/35 truncate">{admin?.email}</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate("/login"); }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[12px] font-medium text-white/35 hover:text-red-400 hover:bg-red-500/[0.08] transition-all"
        >
          <LogOut style={{ width: 14, height: 14 }} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
