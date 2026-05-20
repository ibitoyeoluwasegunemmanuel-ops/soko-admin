import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AdminRole = "super_admin" | "support_admin" | "finance_admin" | "marketplace_admin" | "live_admin" | "moderation_admin" | "ads_admin";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  avatar?: string;
}

interface AuthStore {
  admin: AdminUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// Demo admin accounts — in production these come from admin_users table
const DEMO_ADMINS: (AdminUser & { password: string })[] = [
  { id: "a1", email: "admin@soko.app",      password: "soko2026",     name: "Super Admin",      role: "super_admin" },
  { id: "a2", email: "finance@soko.app",    password: "finance2026",  name: "Finance Admin",    role: "finance_admin" },
  { id: "a3", email: "moderation@soko.app", password: "mod2026",      name: "Moderation Admin", role: "moderation_admin" },
  { id: "a4", email: "live@soko.app",       password: "live2026",     name: "Live Admin",       role: "live_admin" },
  { id: "a5", email: "market@soko.app",     password: "market2026",   name: "Marketplace Admin",role: "marketplace_admin" },
];

export const useAuth = create<AuthStore>()(
  persist(
    (set) => ({
      admin: null,
      token: null,
      login: async (email, password) => {
        const found = DEMO_ADMINS.find(a => a.email === email && a.password === password);
        if (!found) return false;
        const { password: _, ...admin } = found;
        set({ admin, token: `tok_${admin.id}_${Date.now()}` });
        return true;
      },
      logout: () => set({ admin: null, token: null }),
    }),
    { name: "soko-admin-auth" }
  )
);

export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin:       ["*"],
  support_admin:     ["users", "reports", "disputes", "moderation", "logs"],
  finance_admin:     ["wallet", "payouts", "orders", "subscriptions", "analytics"],
  marketplace_admin: ["marketplace", "products", "orders", "auctions", "sellers"],
  live_admin:        ["live", "gifts", "league", "feature-flags"],
  moderation_admin:  ["moderation", "reports", "users", "live"],
  ads_admin:         ["ads", "analytics"],
};

export function canAccess(role: AdminRole, section: string): boolean {
  const perms = ROLE_PERMISSIONS[role];
  return perms.includes("*") || perms.includes(section);
}
