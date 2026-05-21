import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { Shield, ShieldCheck, ShieldAlert, Users, Lock, Smartphone, AlertTriangle } from "lucide-react";

type Tab = "overview" | "users" | "policy" | "events";

const MOCK_USERS = [
  { id: "u1", name: "Chisom Okafor", username: "chisom_style", role: "creator", twofa_enabled: true, method: "totp", last_used: "2026-05-20", verified: true },
  { id: "u2", name: "Tunde Fashola", username: "tundefashola", role: "seller", twofa_enabled: true, method: "sms", last_used: "2026-05-19", verified: true },
  { id: "u3", name: "Amaka Eze", username: "amaka_beauty", role: "buyer", twofa_enabled: false, method: null, last_used: null, verified: true },
  { id: "u4", name: "Emeka Nwosu", username: "emeka_tech", role: "seller", twofa_enabled: false, method: null, last_used: null, verified: false },
  { id: "u5", name: "Ngozi Williams", username: "ngozi_w", role: "creator", twofa_enabled: true, method: "totp", last_used: "2026-05-21", verified: true },
  { id: "u6", name: "Kola Badmus", username: "kolabadmus", role: "seller", twofa_enabled: false, method: null, last_used: null, verified: true },
  { id: "u7", name: "Fatima Bello", username: "fatimabello", role: "buyer", twofa_enabled: true, method: "sms", last_used: "2026-05-18", verified: true },
];

const MOCK_EVENTS = [
  { id: "1", user: "chisom_style", event: "2fa_enabled", method: "TOTP", ip: "105.112.45.23", time: "2026-05-20 14:32" },
  { id: "2", user: "tundefashola", event: "2fa_challenge", method: "SMS", ip: "197.211.62.85", time: "2026-05-19 09:15" },
  { id: "3", user: "emeka_tech", event: "2fa_failed", method: "SMS", ip: "102.89.33.41", time: "2026-05-18 22:07" },
  { id: "4", user: "ngozi_w", event: "2fa_backup_used", method: "Backup Code", ip: "41.58.112.9", time: "2026-05-17 11:43" },
  { id: "5", user: "fatimabello", event: "2fa_enabled", method: "SMS", ip: "105.113.8.20", time: "2026-05-16 16:20" },
  { id: "6", user: "kola_badmus", event: "2fa_disabled", method: "TOTP", ip: "197.255.40.12", time: "2026-05-15 08:55" },
];

const EVENT_COLORS: Record<string, string> = {
  "2fa_enabled": "#10b981", "2fa_challenge": "#3b82f6", "2fa_failed": "#ef4444",
  "2fa_backup_used": "#f59e0b", "2fa_disabled": "#6b7280",
};

const ROLE_COLORS: Record<string, string> = {
  creator: "#7c3aed", seller: "#10b981", buyer: "#3b82f6"
};

export function TwoFactorAuth() {
  const [tab, setTab] = useState<Tab>("overview");
  const [users, setUsers] = useState(MOCK_USERS);
  const [policy, setPolicy] = useState({
    requireFor_creators: true,
    requireFor_sellers: false,
    requireFor_buyers: false,
    allowSMS: true,
    allowTOTP: true,
    allowEmail: true,
    gracePeriodDays: 7,
    lockAfterFailedAttempts: 5,
    smsProvider: "termii",
  });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const enabled = users.filter(u => u.twofa_enabled).length;
  const total = users.length;
  const failedAttempts = MOCK_EVENTS.filter(e => e.event === "2fa_failed").length;

  const filtered = users.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase())
  );

  function forceEnable(id: string) {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, twofa_enabled: true, method: "sms" } : u));
  }

  function forceDisable(id: string) {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, twofa_enabled: false, method: null, last_used: null } : u));
  }

  async function savePolicy() {
    setSaving(true);
    await supabase.from("app_config").upsert({ key: "2fa_policy", value: policy });
    setSaving(false);
  }

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <div onClick={onChange} style={{ width: 40, height: 22, borderRadius: 11, background: value ? "#7c3aed" : "rgba(255,255,255,0.1)", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 3, left: value ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
    </div>
  );

  return (
    <div>
      <PageHeader title="Two-Factor Authentication" sub="Manage 2FA policy, monitor user enrollment and security events">
        <button onClick={savePolicy} disabled={saving} style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          {saving ? "Saving…" : "Save Policy"}
        </button>
      </PageHeader>

      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          <StatCard label="2FA Enabled Users"  value={`${enabled}/${total}`}  icon={ShieldCheck}  color="#10b981" change={`${Math.round(enabled/total*100)}%`} up />
          <StatCard label="Creators Protected"  value={users.filter(u => u.role === "creator" && u.twofa_enabled).length} icon={Shield} color="#7c3aed" />
          <StatCard label="Sellers Protected"   value={users.filter(u => u.role === "seller" && u.twofa_enabled).length}  icon={Lock}   color="#3b82f6" />
          <StatCard label="Failed Attempts (7d)" value={failedAttempts}       icon={ShieldAlert}  color="#ef4444" />
        </div>

        <div style={{ display: "flex", gap: 4, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 4, width: "fit-content" }}>
          {(["overview","users","policy","events"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: tab === t ? "#7c3aed" : "transparent", color: tab === t ? "#fff" : "var(--muted)", textTransform: "capitalize" }}>
              {t}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>Enrollment by Role</p>
              {[
                { role: "creator", label: "Creators", color: "#7c3aed" },
                { role: "seller", label: "Sellers", color: "#10b981" },
                { role: "buyer", label: "Buyers", color: "#3b82f6" },
              ].map(r => {
                const roleUsers = users.filter(u => u.role === r.role);
                const roleEnabled = roleUsers.filter(u => u.twofa_enabled).length;
                const pct = roleUsers.length > 0 ? Math.round(roleEnabled / roleUsers.length * 100) : 0;
                return (
                  <div key={r.role} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: "var(--muted)" }}>{r.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: r.color }}>{roleEnabled}/{roleUsers.length} ({pct}%)</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 99, background: "var(--bg)", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 99, background: r.color, width: `${pct}%`, transition: "width 0.5s" }} />
                    </div>
                  </div>
                );
              })}

              <div style={{ marginTop: 24 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>Method Breakdown</p>
                {[
                  { label: "TOTP App (Google/Authy)", count: users.filter(u => u.method === "totp").length, color: "#7c3aed" },
                  { label: "SMS via Termii", count: users.filter(u => u.method === "sms").length, color: "#10b981" },
                  { label: "Not Enrolled", count: users.filter(u => !u.twofa_enabled).length, color: "#6b7280" },
                ].map(m => (
                  <div key={m.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 13, color: "var(--muted)" }}>{m.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{m.count} users</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>Users Without 2FA</p>
              {users.filter(u => !u.twofa_enabled).map(u => (
                <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>@{u.username}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "capitalize" }}>
                      <span style={{ color: ROLE_COLORS[u.role] }}>{u.role}</span>
                      {!u.verified && <span style={{ color: "#ef4444", marginLeft: 6 }}>· unverified</span>}
                    </div>
                  </div>
                  <button onClick={() => forceEnable(u.id)} style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(124,58,237,0.3)", background: "rgba(124,58,237,0.08)", color: "#a78bfa", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                    Force Enable
                  </button>
                </div>
              ))}
              {users.filter(u => !u.twofa_enabled).length === 0 && (
                <div style={{ textAlign: "center", padding: "30px 0", color: "var(--muted)", fontSize: 13 }}>All users have 2FA enabled</div>
              )}
            </div>
          </div>
        )}

        {tab === "users" && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…"
                style={{ width: 280, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13 }} />
            </div>
            <table style={{ width: "100%", fontSize: 13 }}>
              <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["User","Role","2FA Status","Method","Last Verified","Actions"].map(h => (
                  <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "11px 16px" }}>
                      <div style={{ fontWeight: 600, color: "var(--text)" }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>@{u.username}</div>
                    </td>
                    <td style={{ padding: "11px 16px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, color: ROLE_COLORS[u.role], background: `${ROLE_COLORS[u.role]}18`, textTransform: "capitalize" }}>{u.role}</span>
                    </td>
                    <td style={{ padding: "11px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {u.twofa_enabled ? <ShieldCheck size={14} style={{ color: "#10b981" }} /> : <ShieldAlert size={14} style={{ color: "#ef4444" }} />}
                        <span style={{ fontSize: 12, fontWeight: 700, color: u.twofa_enabled ? "#10b981" : "#ef4444" }}>{u.twofa_enabled ? "Enabled" : "Disabled"}</span>
                      </div>
                    </td>
                    <td style={{ padding: "11px 16px", color: "var(--muted)", textTransform: "uppercase", fontSize: 11 }}>{u.method ?? "—"}</td>
                    <td style={{ padding: "11px 16px", color: "var(--muted)", fontSize: 12 }}>{u.last_used ?? "—"}</td>
                    <td style={{ padding: "11px 16px" }}>
                      {u.twofa_enabled
                        ? <button onClick={() => forceDisable(u.id)} style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.06)", color: "#ef4444", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Disable</button>
                        : <button onClick={() => forceEnable(u.id)} style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(124,58,237,0.25)", background: "rgba(124,58,237,0.06)", color: "#a78bfa", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Force Enable</button>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "policy" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>Require 2FA By Role</p>
              {[
                { key: "requireFor_creators" as const, label: "Require for Creators", desc: "All creators must set up 2FA before going live" },
                { key: "requireFor_sellers" as const, label: "Require for Sellers", desc: "All sellers must set up 2FA before listing products" },
                { key: "requireFor_buyers" as const, label: "Require for Buyers", desc: "All users must set up 2FA on registration" },
              ].map(item => (
                <div key={item.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{item.desc}</div>
                  </div>
                  <Toggle value={policy[item.key]} onChange={() => setPolicy(p => ({ ...p, [item.key]: !p[item.key] }))} />
                </div>
              ))}

              <div style={{ marginTop: 24 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>Grace Period</p>
                <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>Days before 2FA requirement is enforced after account creation</p>
                <input type="number" value={policy.gracePeriodDays} min={0} max={30} onChange={e => setPolicy(p => ({ ...p, gracePeriodDays: Number(e.target.value) }))}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13 }} />
              </div>

              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Lock After Failed Attempts</p>
                <input type="number" value={policy.lockAfterFailedAttempts} min={3} max={10} onChange={e => setPolicy(p => ({ ...p, lockAfterFailedAttempts: Number(e.target.value) }))}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13 }} />
              </div>
            </div>

            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>Allowed Methods</p>
              {[
                { key: "allowTOTP" as const, label: "Authenticator App (TOTP)", desc: "Google Authenticator, Authy, etc.", icon: "🔐" },
                { key: "allowSMS" as const, label: "SMS via Termii", desc: "One-time code sent to phone number", icon: "📱" },
                { key: "allowEmail" as const, label: "Email OTP", desc: "One-time code sent to email address", icon: "📧" },
              ].map(item => (
                <div key={item.key} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 12, border: `1px solid ${policy[item.key] ? "rgba(124,58,237,0.3)" : "var(--border)"}`, background: policy[item.key] ? "rgba(124,58,237,0.04)" : "transparent", marginBottom: 10 }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{item.desc}</div>
                  </div>
                  <Toggle value={policy[item.key]} onChange={() => setPolicy(p => ({ ...p, [item.key]: !p[item.key] }))} />
                </div>
              ))}

              <div style={{ marginTop: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>SMS Provider</p>
                <select value={policy.smsProvider} onChange={e => setPolicy(p => ({ ...p, smsProvider: e.target.value }))}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13 }}>
                  <option value="termii">Termii (Recommended for Nigeria)</option>
                  <option value="twilio">Twilio</option>
                  <option value="africas-talking">Africa's Talking</option>
                </select>
              </div>

              <button onClick={savePolicy} disabled={saving} style={{ width: "100%", marginTop: 24, padding: "10px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#7c3aed,#ec4899)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                {saving ? "Saving…" : "Save Policy"}
              </button>
            </div>
          </div>
        )}

        {tab === "events" && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Recent 2FA Security Events</span>
            </div>
            <table style={{ width: "100%", fontSize: 13 }}>
              <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["User","Event","Method","IP Address","Time"].map(h => (
                  <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {MOCK_EVENTS.map(e => (
                  <tr key={e.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "11px 16px", fontWeight: 600, color: "var(--text)" }}>@{e.user}</td>
                    <td style={{ padding: "11px 16px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, color: EVENT_COLORS[e.event] ?? "#6b7280", background: `${EVENT_COLORS[e.event] ?? "#6b7280"}18` }}>
                        {e.event.replace("2fa_", "").replace(/_/g, " ")}
                      </span>
                    </td>
                    <td style={{ padding: "11px 16px", color: "var(--muted)", textTransform: "uppercase", fontSize: 11 }}>{e.method}</td>
                    <td style={{ padding: "11px 16px", color: "var(--muted)", fontSize: 12, fontFamily: "monospace" }}>{e.ip}</td>
                    <td style={{ padding: "11px 16px", color: "var(--muted)", fontSize: 12 }}>{e.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
