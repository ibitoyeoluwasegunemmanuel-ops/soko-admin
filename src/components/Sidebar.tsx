import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import {
  LayoutDashboard, Users, Star, Radio, ShoppingBag, Wrench, Building2,
  Gavel, Package, Wallet, ArrowUpFromLine, Gift, CreditCard, Zap,
  Trophy, ImageIcon, BarChart3, Shield, CheckSquare, Bell, Sparkles,
  Flag, Settings, ScrollText, LogOut
} from "lucide-react";

const NAV = [
  {
    section: "Main Menu",
    items: [
      { to: "/",              label: "Dashboard",       icon: LayoutDashboard },
      { to: "/users",         label: "Users",           icon: Users },
      { to: "/creators",      label: "Creators",        icon: Star },
      { to: "/analytics",     label: "Analytics",       icon: BarChart3 },
    ],
  },
  {
    section: "Platform",
    items: [
      { to: "/live",          label: "Live Streaming",  icon: Radio },
      { to: "/marketplace",   label: "Marketplace",     icon: ShoppingBag },
      { to: "/services",      label: "Services",        icon: Wrench },
      { to: "/businesses",    label: "Businesses",      icon: Building2 },
      { to: "/auctions",      label: "Auctions",        icon: Gavel },
      { to: "/orders",        label: "Orders",          icon: Package },
    ],
  },
  {
    section: "Finance",
    items: [
      { to: "/wallet",        label: "Wallet & Payments", icon: Wallet },
      { to: "/payouts",       label: "Payouts",         icon: ArrowUpFromLine },
      { to: "/coins-gifts",   label: "Coins & Gifts",   icon: Gift },
      { to: "/subscriptions", label: "Subscriptions",   icon: CreditCard },
      { to: "/ads",           label: "Ads & Boost",     icon: Zap },
    ],
  },
  {
    section: "Growth",
    items: [
      { to: "/league",        label: "League",          icon: Trophy },
      { to: "/gift-gallery",  label: "Gift Gallery",    icon: ImageIcon },
    ],
  },
  {
    section: "Control",
    items: [
      { to: "/moderation",    label: "Moderation",      icon: Shield },
      { to: "/verification",  label: "Verification",    icon: CheckSquare },
      { to: "/notifications", label: "Notifications",   icon: Bell },
      { to: "/ai-settings",   label: "AI Settings",     icon: Sparkles },
      { to: "/feature-flags", label: "Feature Flags",   icon: Flag },
      { to: "/settings",      label: "Settings",        icon: Settings },
      { to: "/logs",          label: "System Logs",     icon: ScrollText },
    ],
  },
];

export function Sidebar() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside style={{
      position: "fixed", top: 0, left: 0, bottom: 0, width: 260,
      display: "flex", flexDirection: "column",
      background: "var(--surface)", borderRight: "1px solid var(--border)",
      zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 20px 18px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12, flexShrink: 0,
            background: "linear-gradient(135deg,#7c3aed,#ec4899)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 900, color: "#fff",
          }}>S</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", lineHeight: 1.2 }}>Soko Admin</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--accent2)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>
              {admin?.role?.replace(/_/g, " ")}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "12px 12px", display: "flex", flexDirection: "column", gap: 20 }}>
        {NAV.map(group => (
          <div key={group.section}>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
              color: "rgba(240,242,255,0.25)", padding: "0 10px", marginBottom: 6,
            }}>
              {group.section}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {group.items.map(item => (
                <NavLink key={item.to} to={item.to} end={item.to === "/"}>
                  {({ isActive }) => (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "8px 10px", borderRadius: 10, cursor: "pointer",
                      fontSize: 13, fontWeight: isActive ? 600 : 450,
                      color: isActive ? "#fff" : "rgba(240,242,255,0.45)",
                      background: isActive
                        ? "linear-gradient(135deg,rgba(124,58,237,0.2),rgba(236,72,153,0.08))"
                        : "transparent",
                      boxShadow: isActive ? "inset 0 0 0 1px rgba(124,58,237,0.25)" : "none",
                      transition: "all 0.12s ease",
                    }}
                      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLDivElement).style.color = "rgba(240,242,255,0.75)"; }}
                      onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLDivElement).style.background = "transparent"; (e.currentTarget as HTMLDivElement).style.color = "rgba(240,242,255,0.45)"; } }}
                    >
                      <item.icon
                        size={15}
                        style={{ flexShrink: 0, color: isActive ? "#a78bfa" : undefined }}
                      />
                      <span style={{ lineHeight: 1 }}>{item.label}</span>
                    </div>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div style={{ padding: "12px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px", borderRadius: 12, marginBottom: 4,
          background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)",
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg,#7c3aed,#ec4899)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 800, color: "#fff",
          }}>
            {admin?.name?.[0] ?? "A"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {admin?.name}
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {admin?.email}
            </div>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate("/login"); }}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 8,
            padding: "7px 10px", borderRadius: 8, border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: 500, color: "rgba(240,242,255,0.3)",
            background: "transparent", transition: "all 0.12s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(240,242,255,0.3)"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
