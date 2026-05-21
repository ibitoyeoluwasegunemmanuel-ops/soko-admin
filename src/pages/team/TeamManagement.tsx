import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { useAuth, ROLE_PERMISSIONS, ROLE_BY_DEPARTMENT, DEPARTMENT_LABELS, ROLE_LABELS, ALL_SECTIONS, type AdminRole, type Department } from "../../lib/auth";
import { Users, Plus, Edit2, Trash2, Shield, Copy, CheckCircle, Eye, EyeOff, XCircle } from "lucide-react";

type Tab = "members" | "add" | "roles";

interface Member {
  id: string; name: string; email: string; role: AdminRole;
  department: Department; is_active: boolean; last_login?: string;
  created_at: string; permissions: string[]; must_change_password: boolean;
}

interface AddForm {
  name: string; email: string; role: AdminRole; department: Department; permissions: string[];
}

const BLANK: AddForm = { name: "", email: "", role: "support_agent", department: "support", permissions: [] };

const DEPT_COLORS: Record<Department, string> = {
  executive: "#f59e0b", engineering: "#3b82f6", finance: "#10b981",
  operations: "#7c3aed", marketing: "#ec4899", support: "#06b6d4",
  legal: "#f97316", product: "#a78bfa", moderation: "#ef4444",
  business_dev: "#84cc16", data: "#8b5cf6",
};

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$";
  return Array.from(crypto.getRandomValues(new Uint8Array(12))).map(b => chars[b % chars.length]).join("");
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "soko_salt_2026");
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

const inputSt = { width: "100%", height: 40, padding: "0 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 14, outline: "none" } as React.CSSProperties;

export function TeamManagement() {
  const { admin } = useAuth();
  const [tab, setTab]     = useState<Tab>("members");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm]   = useState<AddForm>(BLANK);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [tempPw, setTempPw] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showTempPw, setShowTempPw] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, departments: 0, pending: 0 });

  useEffect(() => { loadMembers(); }, []);

  async function loadMembers() {
    const { data } = await supabase.from("admin_users").select("*").order("created_at", { ascending: false });
    const list = data ?? [];
    setMembers(list);
    setStats({
      total: list.length,
      active: list.filter((m: any) => m.is_active).length,
      departments: new Set(list.map((m: any) => m.department)).size,
      pending: list.filter((m: any) => m.must_change_password).length,
    });
    setLoading(false);
  }

  async function addMember() {
    if (!form.name || !form.email) return;
    setSaving(true);
    const pw = generateTempPassword();
    const hash = await hashPassword(pw);
    const payload = {
      name: form.name, email: form.email, role: form.role,
      department: form.department, permissions: form.permissions,
      password_hash: hash, must_change_password: true,
      is_active: true, created_by: admin?.id,
    };
    if (editId) {
      const { data } = await supabase.from("admin_users").update({ name: form.name, role: form.role, department: form.department, permissions: form.permissions }).eq("id", editId).select().single();
      if (data) setMembers(prev => prev.map(m => m.id === editId ? data : m));
      setEditId(null); setSaving(false); setForm(BLANK); setTab("members");
    } else {
      const { data } = await supabase.from("admin_users").insert(payload).select().single();
      if (data) { setMembers(prev => [data, ...prev]); setTempPw(pw); }
      setSaving(false); setForm(BLANK);
    }
  }

  async function toggleMember(id: string, active: boolean) {
    await supabase.from("admin_users").update({ is_active: !active }).eq("id", id);
    setMembers(prev => prev.map(m => m.id === id ? { ...m, is_active: !active } : m));
  }

  async function deleteMember(id: string) {
    if (!confirm("Remove this team member?")) return;
    await supabase.from("admin_users").delete().eq("id", id);
    setMembers(prev => prev.filter(m => m.id !== id));
  }

  function startEdit(m: Member) {
    setForm({ name: m.name, email: m.email, role: m.role, department: m.department, permissions: m.permissions ?? [] });
    setEditId(m.id); setTab("add");
  }

  function copyPw() {
    if (tempPw) { navigator.clipboard.writeText(tempPw); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  }

  function togglePermission(key: string) {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter(p => p !== key)
        : [...prev.permissions, key],
    }));
  }

  function onDeptChange(dept: Department) {
    const roles = ROLE_BY_DEPARTMENT[dept];
    setForm(prev => ({ ...prev, department: dept, role: roles[0], permissions: [] }));
  }

  function onRoleChange(role: AdminRole) {
    setForm(prev => ({ ...prev, role }));
  }

  const roleDefaultPerms = ROLE_PERMISSIONS[form.role] ?? [];
  const DEPARTMENTS = Object.keys(DEPARTMENT_LABELS) as Department[];

  function tAgo(iso?: string) {
    if (!iso) return "Never";
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    return d === 0 ? "Today" : d === 1 ? "Yesterday" : `${d}d ago`;
  }

  return (
    <div>
      <PageHeader title="Team Management" sub="Enroll staff, assign roles and manage platform access">
        {admin?.role === "super_admin" || admin?.role === "ceo" ? (
          <button onClick={() => { setForm(BLANK); setEditId(null); setTempPw(null); setTab("add"); }}
            style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: "#7c3aed", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={13} /> Add Team Member
          </button>
        ) : null}
      </PageHeader>

      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          <StatCard label="Total Team"       value={stats.total}       icon={Users}        color="#7c3aed" />
          <StatCard label="Active Members"   value={stats.active}      icon={CheckCircle}  color="#10b981" />
          <StatCard label="Departments"      value={stats.departments}  icon={Shield}       color="#3b82f6" />
          <StatCard label="Pending Login"    value={stats.pending}     icon={Eye}          color="#f59e0b" sub="must set password" />
        </div>

        <div style={{ display: "flex", gap: 4, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 4, width: "fit-content" }}>
          {([{ key: "members", label: "Team Members" }, { key: "add", label: editId ? "Edit Member" : "Add Member" }, { key: "roles", label: "Role Permissions" }] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: tab === t.key ? "#7c3aed" : "transparent", color: tab === t.key ? "#fff" : "var(--muted)" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* TEMP PASSWORD MODAL */}
        {tempPw && (
          <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 16, padding: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <CheckCircle size={18} style={{ color: "#10b981" }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Team member created successfully!</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
              Share these credentials securely. The team member will be asked to change their password on first login.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px" }}>
              <span style={{ flex: 1, fontFamily: "monospace", fontSize: 14, color: "var(--text)", letterSpacing: "0.05em" }}>
                {showTempPw ? tempPw : "•".repeat(tempPw.length)}
              </span>
              <button onClick={() => setShowTempPw(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex", padding: 0 }}>
                {showTempPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button onClick={copyPw} style={{ background: "none", border: "none", cursor: "pointer", color: copied ? "#10b981" : "var(--muted)", display: "flex", padding: 0 }}>
                {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <button onClick={() => setTempPw(null)} style={{ marginTop: 12, background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--muted)", padding: 0 }}>
              Dismiss
            </button>
          </div>
        )}

        {/* MEMBERS LIST */}
        {tab === "members" && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
            <table style={{ width: "100%", fontSize: 13 }}>
              <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Name", "Role", "Department", "Status", "Last Login", "Actions"].map(h => (
                  <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {loading ? Array(5).fill(0).map((_, i) => (
                  <tr key={i}><td colSpan={6} style={{ padding: "11px 16px" }}><div style={{ height: 14, background: "var(--bg)", borderRadius: 6 }} /></td></tr>
                )) : members.map(m => (
                  <tr key={m.id} style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.02)"}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                  >
                    <td style={{ padding: "11px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff", background: `linear-gradient(135deg,${DEPT_COLORS[m.department] ?? "#7c3aed"},${DEPT_COLORS[m.department] ?? "#7c3aed"}88)` }}>
                          {m.name[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--text)" }}>{m.name}</div>
                          <div style={{ fontSize: 11, color: "var(--muted)" }}>{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "11px 16px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, color: DEPT_COLORS[m.department], background: `${DEPT_COLORS[m.department]}18` }}>
                        {ROLE_LABELS[m.role] ?? m.role}
                      </span>
                    </td>
                    <td style={{ padding: "11px 16px", color: "var(--muted)", fontSize: 12 }}>{DEPARTMENT_LABELS[m.department]}</td>
                    <td style={{ padding: "11px 16px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20, color: m.is_active ? "#10b981" : "var(--muted)", background: m.is_active ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.04)", display: "inline-block" }}>
                          {m.is_active ? "Active" : "Suspended"}
                        </span>
                        {m.must_change_password && <span style={{ fontSize: 10, color: "#f59e0b" }}>⚠ Must change password</span>}
                      </div>
                    </td>
                    <td style={{ padding: "11px 16px", color: "var(--muted)", fontSize: 12 }}>{tAgo(m.last_login)}</td>
                    <td style={{ padding: "11px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => startEdit(m)} style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                          <Edit2 size={11} /> Edit
                        </button>
                        <button onClick={() => toggleMember(m.id, m.is_active)} style={{ padding: "5px 10px", borderRadius: 8, border: `1px solid ${m.is_active ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)"}`, background: m.is_active ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)", color: m.is_active ? "#ef4444" : "#10b981", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                          {m.is_active ? "Suspend" : "Restore"}
                        </button>
                        <button onClick={() => deleteMember(m.id)} style={{ padding: "5px 8px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.06)", color: "#ef4444", cursor: "pointer", display: "flex" }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && members.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <Users size={32} style={{ color: "var(--muted)", margin: "0 auto 12px" }} />
                <p style={{ color: "var(--muted)", fontSize: 13 }}>No team members yet. Add your first staff member.</p>
              </div>
            )}
          </div>
        )}

        {/* ADD / EDIT FORM */}
        {tab === "add" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 22 }}>{editId ? "Edit Team Member" : "Enroll New Team Member"}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Full Name</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Tunde Adeyemi" style={inputSt} />
                </div>
                {!editId && (
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Work Email</label>
                    <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="tunde@soko.app" style={inputSt} />
                  </div>
                )}
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Department</label>
                  <select value={form.department} onChange={e => onDeptChange(e.target.value as Department)} style={{ ...inputSt, height: 42 }}>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{DEPARTMENT_LABELS[d]}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Role</label>
                  <select value={form.role} onChange={e => onRoleChange(e.target.value as AdminRole)} style={{ ...inputSt, height: 42 }}>
                    {(ROLE_BY_DEPARTMENT[form.department] ?? []).map(r => <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>)}
                  </select>
                </div>

                {!editId && (
                  <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}>
                    <p style={{ fontSize: 12, color: "#a78bfa", lineHeight: 1.6 }}>
                      A temporary password will be generated automatically. The team member must change it on first login. Share credentials securely.
                    </p>
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button onClick={addMember} disabled={saving || !form.name || (!editId && !form.email)}
                    style={{ flex: 1, height: 42, borderRadius: 10, border: "none", background: "#7c3aed", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
                    {saving ? "Saving…" : editId ? "Update Member" : "Enroll Member"}
                  </button>
                  <button onClick={() => { setTab("members"); setEditId(null); setForm(BLANK); }}
                    style={{ padding: "0 18px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>

            {/* Permissions Panel */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>Access Permissions</p>
              <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
                <strong style={{ color: DEPT_COLORS[form.department] }}>{ROLE_LABELS[form.role] ?? form.role}</strong> has these default permissions. Tick extra boxes to grant additional access.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 440, overflowY: "auto" }}>
                {ALL_SECTIONS.map(s => {
                  const isDefault = roleDefaultPerms.includes("*") || roleDefaultPerms.includes(s.key);
                  const isExtra = form.permissions.includes(s.key);
                  return (
                    <label key={s.key} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "9px 12px", borderRadius: 10, cursor: "pointer",
                      background: isDefault ? "rgba(16,185,129,0.06)" : isExtra ? "rgba(124,58,237,0.08)" : "var(--bg)",
                      border: `1px solid ${isDefault ? "rgba(16,185,129,0.2)" : isExtra ? "rgba(124,58,237,0.2)" : "var(--border)"}`,
                      transition: "all 0.12s",
                    }}>
                      <input type="checkbox" checked={isDefault || isExtra} disabled={isDefault}
                        onChange={() => !isDefault && togglePermission(s.key)}
                        style={{ width: 14, height: 14, accentColor: "#7c3aed", flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 500, color: isDefault ? "#10b981" : isExtra ? "#a78bfa" : "var(--muted)", flex: 1 }}>{s.label}</span>
                      {isDefault && <span style={{ fontSize: 9, fontWeight: 700, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.05em" }}>Default</span>}
                      {!isDefault && isExtra && <span style={{ fontSize: 9, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.05em" }}>Extra</span>}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ROLES REFERENCE */}
        {tab === "roles" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
            {DEPARTMENTS.map(dept => (
              <div key={dept} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: DEPT_COLORS[dept], flexShrink: 0 }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{DEPARTMENT_LABELS[dept]}</span>
                </div>
                {(ROLE_BY_DEPARTMENT[dept] ?? []).map(role => {
                  const perms = ROLE_PERMISSIONS[role] ?? [];
                  return (
                    <div key={role} style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 10, background: "var(--bg)", border: "1px solid var(--border)" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: DEPT_COLORS[dept], marginBottom: 6 }}>{ROLE_LABELS[role]}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {perms.includes("*") ? (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>Full Platform Access</span>
                        ) : perms.map(p => (
                          <span key={p} style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: `${DEPT_COLORS[dept]}14`, color: DEPT_COLORS[dept] }}>
                            {ALL_SECTIONS.find(s => s.key === p)?.label ?? p}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
