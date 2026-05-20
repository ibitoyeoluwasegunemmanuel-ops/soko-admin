import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Star, Radio, ShoppingBag,
  Wrench, Building2, Gavel, Package, Wallet,
  ArrowUpFromLine, Gift, Flag, BarChart3, Settings,
  ScrollText, Shield, Sparkles, Zap, LogOut, ChevronRight,
  Bell, CreditCard, Trophy, Image
} from "lucide-react";
import { useAuth } from "../lib/auth";

const NAV = [
  { section: "Core", items: [
    { to: "/",               icon: LayoutDashboard, label: "Overview",       key: "overview" },
    { to: "/users",          icon: Users,           label: "Users",          key: "users" },
    { to: "/creators",       icon: Star,            label: "Creators",       key: "creators" },
  ]},
  { section: "Platform", items: [
    { to: "/live",           icon: Radio,           label: "Live Streaming", key: "live" },
    { to: "/marketplace",    icon: ShoppingBag,     label: "Marketplace",    key: "marketplace" },
    { to: "/services",       icon: Wrench,          label: "Services",       key: "services" },
    { to: "/businesses",     icon: Building2,       label: "Businesses",     key: "businesses" },
    { to: "/auctions",       icon: Gavel,           label: "Auctions",       key: "auctions" },
    { to: "/orders",         icon: Package,         label: "Orders",         key: "orders" },
  ]},
  { section: "Finance", items: [
    { to: "/wallet",         icon: Wallet,          label: "Wallet & Payments", key: "wallet" },
    { to: "/payouts",        icon: ArrowUpFromLine, label: "Payouts",        key: "payouts" },
    { to: "/coins-gifts",    icon: Gift,            label: "Coins & Gifts",  key: "gifts" },
    { to: "/subscriptions",  icon: CreditCard,      label: "Subscriptions",  key: "subscriptions" },
    { to: "/ads",            icon: Zap,             label: "Ads & Boost",    key: "ads" },
  ]},
  { section: "Growth", items: [
    { to: "/league",         icon: Trophy,          label: "League & Rankings", key: "league" },
    { to: "/gift-gallery",   icon: Image,           label: "Gift Gallery",   key: "gift-gallery" },
    { to: "/analytics",      icon: BarChart3,       label: "Analytics",      key: "analytics" },
  ]},
  { section: "Control", items: [
    { to: "/moderation",     icon: Shield,          label: "Moderation",     key: "moderation" },
    { to: "/verification",   icon: Flag,            label: "Verification",   key: "verification" },
    { to: "/notifications",  icon: Bell,            label: "Notifications",  key: "notifications" },
    { to: "/ai-settings",    icon: Sparkles,        label: "AI Settings",    key: "ai-settings" },
    { to: "/feature-flags",  icon: Flag,            label: "Feature Flags",  key: "feature-flags" },
    { to: "/settings",       icon: Settings,        label: "App Settings",   key: "settings" },
    { to: "/logs",           icon: ScrollText,      label: "System Logs",    key: "logs" },
  ]},
];

export function Sidebar() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 flex flex-col border-r border-[#1e1e2e] bg-[#0d0d16] z-40 overflow-hidden">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-[#1e1e2e] flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-sm font-black text-white">S</div>
        <div>
          <p className="text-[13px] font-black text-white">Soko Admin</p>
          <p className="text-[9px] text-purple-400 font-semibold uppercase tracking-wider">{admin?.role?.replace(/_/g," ")}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {NAV.map(group => (
          <div key={group.section}>
            <p className="text-[9px] font-black text-white/20 uppercase tracking-[2px] px-2 mb-1.5">{group.section}</p>
            <div className="space-y-0.5">
              {group.items.map(item => (
                <NavLink key={item.to} to={item.to} end={item.to === "/"}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] font-semibold transition-all group ${
                      isActive
                        ? "bg-purple-600/20 text-purple-300 border border-purple-500/25"
                        : "text-white/40 hover:text-white/80 hover:bg-white/5"
                    }`
                  }>
                  {({ isActive }) => (
                    <>
                      <item.icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-purple-400" : ""}`} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {isActive && <ChevronRight className="w-3 h-3 text-purple-400/50" />}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Admin user */}
      <div className="px-3 py-3 border-t border-[#1e1e2e]">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-7 h-7 rounded-full bg-purple-600/30 border border-purple-500/30 flex items-center justify-center text-[10px] font-black text-purple-300">
            {admin?.name?.[0] ?? "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-white truncate">{admin?.name}</p>
            <p className="text-[9px] text-white/30 truncate">{admin?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all">
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
