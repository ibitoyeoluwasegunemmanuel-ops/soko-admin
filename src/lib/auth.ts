import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "./supabase";

export type AdminRole =
  | "super_admin" | "ceo"
  | "cto" | "cfo" | "coo" | "cpo"
  | "finance_manager" | "accountant"
  | "engineering" | "developer" | "devops"
  | "operations_manager"
  | "marketing_manager" | "content_creator"
  | "support_lead" | "support_agent"
  | "legal_counsel" | "compliance_officer"
  | "product_manager"
  | "moderation_lead" | "moderator"
  | "bd_manager" | "partnerships"
  | "data_analyst";

export type Department =
  | "executive" | "engineering" | "finance" | "operations"
  | "marketing" | "support" | "legal" | "product"
  | "moderation" | "business_dev" | "data";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  department: Department;
  avatar?: string;
  permissions?: string[];          // custom overrides
  must_change_password?: boolean;
  created_by?: string;
  is_active?: boolean;
}

interface AuthStore {
  admin: AdminUser | null;
  token: string | null;
  mustChangePassword: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; mustChange?: boolean }>;
  changePassword: (newPassword: string) => Promise<boolean>;
  logout: () => void;
}

// ─── Default permissions per role ────────────────────────────────────────────
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin:        ["*"],
  ceo:                ["*"],
  cto:                ["developer-tools","feature-flags","platform-health","ai-settings","logs","settings","analytics"],
  cfo:                ["wallet","payouts","revenue","subscriptions","analytics","compliance","orders"],
  coo:                ["*"],
  cpo:                ["cms","feature-flags","analytics","settings","campaigns"],
  finance_manager:    ["wallet","payouts","revenue","subscriptions","orders","analytics"],
  accountant:         ["wallet","payouts","revenue","orders"],
  engineering:        ["developer-tools","feature-flags","platform-health","logs","ai-settings"],
  developer:          ["developer-tools","feature-flags","platform-health","logs"],
  devops:             ["platform-health","logs","developer-tools"],
  operations_manager: ["users","orders","marketplace","services","businesses","auctions","analytics"],
  marketing_manager:  ["campaigns","cms","ads","analytics","creators","notifications"],
  content_creator:    ["cms","campaigns"],
  support_lead:       ["support","users","orders","moderation","fraud"],
  support_agent:      ["support","users","orders"],
  legal_counsel:      ["compliance","verification","users"],
  compliance_officer: ["compliance","verification","fraud","users","logs"],
  product_manager:    ["cms","feature-flags","analytics","settings","campaigns"],
  moderation_lead:    ["moderation","verification","live","fraud","support","users"],
  moderator:          ["moderation","live","support"],
  bd_manager:         ["businesses","creators","marketplace","campaigns","analytics"],
  partnerships:       ["businesses","creators","marketplace"],
  data_analyst:       ["analytics","logs"],
};

export const DEPARTMENT_LABELS: Record<Department, string> = {
  executive:    "Executive",
  engineering:  "Engineering",
  finance:      "Finance",
  operations:   "Operations",
  marketing:    "Marketing",
  support:      "Customer Support",
  legal:        "Legal & Compliance",
  product:      "Product",
  moderation:   "Moderation",
  business_dev: "Business Development",
  data:         "Data & Analytics",
};

export const ROLE_BY_DEPARTMENT: Record<Department, AdminRole[]> = {
  executive:    ["ceo","cto","cfo","coo","cpo"],
  engineering:  ["engineering","developer","devops"],
  finance:      ["finance_manager","accountant"],
  operations:   ["operations_manager"],
  marketing:    ["marketing_manager","content_creator"],
  support:      ["support_lead","support_agent"],
  legal:        ["legal_counsel","compliance_officer"],
  product:      ["product_manager"],
  moderation:   ["moderation_lead","moderator"],
  business_dev: ["bd_manager","partnerships"],
  data:         ["data_analyst"],
};

export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin", ceo: "CEO",
  cto: "CTO", cfo: "CFO", coo: "COO", cpo: "CPO",
  finance_manager: "Finance Manager", accountant: "Accountant",
  engineering: "Engineer", developer: "Developer", devops: "DevOps",
  operations_manager: "Operations Manager",
  marketing_manager: "Marketing Manager", content_creator: "Content Creator",
  support_lead: "Support Lead", support_agent: "Support Agent",
  legal_counsel: "Legal Counsel", compliance_officer: "Compliance Officer",
  product_manager: "Product Manager",
  moderation_lead: "Moderation Lead", moderator: "Moderator",
  bd_manager: "BD Manager", partnerships: "Partnerships",
  data_analyst: "Data Analyst",
};

export const ALL_SECTIONS: { key: string; label: string }[] = [
  { key: "*",               label: "Full Access (all sections)" },
  { key: "users",           label: "Users" },
  { key: "creators",        label: "Creators" },
  { key: "live",            label: "Live Streaming" },
  { key: "marketplace",     label: "Marketplace" },
  { key: "products",        label: "Products" },
  { key: "services",        label: "Services" },
  { key: "businesses",      label: "Businesses" },
  { key: "professionals",   label: "Professionals" },
  { key: "auctions",        label: "Auctions" },
  { key: "orders",          label: "Orders" },
  { key: "wallet",          label: "Wallet & Payments" },
  { key: "payouts",         label: "Payouts" },
  { key: "coins-gifts",     label: "Coins & Gifts" },
  { key: "subscriptions",   label: "Subscriptions" },
  { key: "ads",             label: "Ads & Boost" },
  { key: "league",          label: "League & Rankings" },
  { key: "gift-gallery",    label: "Gift Gallery" },
  { key: "moderation",      label: "Moderation" },
  { key: "verification",    label: "Verification" },
  { key: "ai-settings",     label: "AI Settings" },
  { key: "feature-flags",   label: "Feature Flags" },
  { key: "settings",        label: "App Settings" },
  { key: "analytics",       label: "Analytics" },
  { key: "logs",            label: "System Logs" },
  { key: "support",         label: "Support Center" },
  { key: "cms",             label: "Content CMS" },
  { key: "campaigns",       label: "Campaigns" },
  { key: "fraud",           label: "Fraud & Risk" },
  { key: "compliance",      label: "Compliance" },
  { key: "revenue",         label: "Revenue Intelligence" },
  { key: "developer-tools", label: "Developer Tools" },
  { key: "platform-health", label: "Platform Health" },
  { key: "team",            label: "Team Management" },
];

// Super admin demo accounts (always available)
const DEMO_ADMINS: (AdminUser & { password: string })[] = [
  { id: "a1", email: "admin@soko.app",   password: "soko2026",   name: "Super Admin", role: "super_admin", department: "executive" },
  { id: "a2", email: "ceo@soko.app",     password: "ceo2026",    name: "CEO",         role: "ceo",         department: "executive" },
];

// Simple hash for client-side password verification
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "soko_salt_2026");
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      admin: null,
      token: null,
      mustChangePassword: false,

      login: async (email, password) => {
        // 1. Check demo/hardcoded admins first
        const demo = DEMO_ADMINS.find(a => a.email === email && a.password === password);
        if (demo) {
          const { password: _, ...admin } = demo;
          set({ admin, token: `tok_${admin.id}_${Date.now()}`, mustChangePassword: false });
          return { ok: true };
        }

        // 2. Check admin_users table in Supabase
        const { data: teamMember } = await supabase
          .from("admin_users")
          .select("*")
          .eq("email", email)
          .eq("is_active", true)
          .single();

        if (!teamMember) return { ok: false };

        const hashed = await hashPassword(password);
        if (teamMember.password_hash !== hashed) return { ok: false };

        const admin: AdminUser = {
          id: teamMember.id,
          email: teamMember.email,
          name: teamMember.name,
          role: teamMember.role,
          department: teamMember.department,
          permissions: teamMember.permissions ?? [],
          must_change_password: teamMember.must_change_password ?? false,
          created_by: teamMember.created_by,
          is_active: teamMember.is_active,
        };

        // Update last login
        await supabase.from("admin_users").update({ last_login: new Date().toISOString() }).eq("id", teamMember.id);

        set({ admin, token: `tok_${teamMember.id}_${Date.now()}`, mustChangePassword: teamMember.must_change_password ?? false });
        return { ok: true, mustChange: teamMember.must_change_password };
      },

      changePassword: async (newPassword) => {
        const { admin } = get();
        if (!admin) return false;
        const hashed = await hashPassword(newPassword);
        await supabase.from("admin_users")
          .update({ password_hash: hashed, must_change_password: false })
          .eq("id", admin.id);
        set({ mustChangePassword: false, admin: { ...admin, must_change_password: false } });
        return true;
      },

      logout: () => set({ admin: null, token: null, mustChangePassword: false }),
    }),
    { name: "soko-admin-auth" }
  )
);

export function canAccess(admin: AdminUser, section: string): boolean {
  const rolePerm = ROLE_PERMISSIONS[admin.role] ?? [];
  const customPerm = admin.permissions ?? [];
  const combined = [...rolePerm, ...customPerm];
  return combined.includes("*") || combined.includes(section);
}
