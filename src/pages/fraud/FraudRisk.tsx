import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { AlertTriangle, Shield, Ban, Eye, Zap, CheckCircle } from "lucide-react";

type Tab = "alerts" | "flagged" | "blacklist" | "rules";

const RISK_STYLE: Record<string, { color: string; bg: string }> = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  high:     { color: "#f97316", bg: "rgba(249,115,22,0.1)" },
  medium:   { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  low:      { color: "#10b981", bg: "rgba(16,185,129,0.1)" },
};

const inputSt = { width: "100%", height: 40, padding: "0 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 14, outline: "none" } as React.CSSProperties;

export function FraudRisk() {
  const [tab, setTab] = useState<Tab>("alerts");
  const [alerts, setAlerts] = useState<any[]>([]);
  const [flagged, setFlagged] = useState<any[]>([]);
  const [blacklist, setBlacklist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ critical: 0, flagged: 0, blocked: 0, resolved: 0 });
  const [newIp, setNewIp] = useState("");
  const [newReason, setNewReason] = useState("");
  const [rules, setRules] = useState({
    max_transactions_per_hour: 20,
    max_withdrawal_per_day: 500000,
    self_gift_detection: true,
    fake_order_detection: true,
    velocity_check_enabled: true,
    min_account_age_days: 3,
  });

  useEffect(() => {
    async function load() {
      const [alertR, flagR, blkR] = await Promise.all([
        supabase.from("fraud_alerts").select("*, user:profiles!user_id(username,avatar_url)").order("created_at", { ascending: false }).limit(50),
        supabase.from("profiles").select("id,username,avatar_url,fraud_score,created_at,is_verified").gt("fraud_score", 60).order("fraud_score", { ascending: false }).limit(30),
        supabase.from("ip_blacklist").select("*").order("created_at", { ascending: false }),
      ]);
      const al = alertR.data ?? [];
      const fl = flagR.data ?? [];
      setAlerts(al); setFlagged(fl); setBlacklist(blkR.data ?? []);
      setStats({
        critical: al.filter((a: any) => a.risk_level === "critical").length,
        flagged: fl.length,
        blocked: blkR.data?.length ?? 0,
        resolved: al.filter((a: any) => a.resolved).length,
      });
      setLoading(false);
    }
    load();
  }, []);

  async function resolveAlert(id: string) {
    await supabase.from("fraud_alerts").update({ resolved: true }).eq("id", id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
  }

  async function blockUser(userId: string) {
    await supabase.from("profiles").update({ is_banned: true }).eq("id", userId);
    setFlagged(prev => prev.filter(u => u.id !== userId));
  }

  async function addToBlacklist() {
    if (!newIp) return;
    const { data } = await supabase.from("ip_blacklist").insert({ ip: newIp, reason: newReason, created_at: new Date().toISOString() }).select().single();
    if (data) setBlacklist(prev => [data, ...prev]);
    setNewIp(""); setNewReason("");
  }

  async function removeFromBlacklist(id: string) {
    await supabase.from("ip_blacklist").delete().eq("id", id);
    setBlacklist(prev => prev.filter(b => b.id !== id));
  }

  async function saveRules() {
    await supabase.from("app_config").upsert({ key: "fraud_rules", value: JSON.stringify(rules) });
  }

  function tAgo(iso: string) {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }

  const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px", borderRadius: 10, background: "var(--bg)", border: "1px solid var(--border)" }}>
      <span style={{ fontSize: 13, color: "var(--text)" }}>{label}</span>
      <button onClick={() => onChange(!value)} style={{ width: 44, height: 24, borderRadius: 99, border: "none", cursor: "pointer", background: value ? "#7c3aed" : "rgba(255,255,255,0.1)", position: "relative", transition: "background 0.2s" }}>
        <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: value ? 23 : 3, transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
      </button>
    </div>
  );

  return (
    <div>
      <PageHeader title="Fraud & Risk Center" sub="Suspicious activity alerts, flagged accounts, IP blacklist and fraud detection rules" />
      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          <StatCard label="Critical Alerts"  value={stats.critical}  icon={AlertTriangle} color="#ef4444" />
          <StatCard label="Flagged Accounts" value={stats.flagged}   icon={Eye}           color="#f97316" />
          <StatCard label="Blocked IPs"      value={stats.blocked}   icon={Ban}           color="#7c3aed" />
          <StatCard label="Resolved Today"   value={stats.resolved}  icon={CheckCircle}   color="#10b981" />
        </div>

        <div style={{ display: "flex", gap: 4, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 4, width: "fit-content" }}>
          {[{ key: "alerts", label: "Live Alerts" }, { key: "flagged", label: "Flagged Users" }, { key: "blacklist", label: "IP Blacklist" }, { key: "rules", label: "Detection Rules" }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as Tab)} style={{ padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: tab === t.key ? "#7c3aed" : "transparent", color: tab === t.key ? "#fff" : "var(--muted)" }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "alerts" && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
            {alerts.length === 0 ? <div style={{ textAlign: "center", padding: "48px 0", color: "var(--muted)", fontSize: 13 }}>No fraud alerts</div> : alerts.map(a => {
              const r = RISK_STYLE[a.risk_level ?? "low"];
              return (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 18px", borderBottom: "1px solid var(--border)", opacity: a.resolved ? 0.5 : 1 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 20, color: r.color, background: r.bg, flexShrink: 0, textTransform: "capitalize" }}>{a.risk_level ?? "low"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{a.description ?? "Suspicious activity detected"}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>@{a.user?.username ?? "—"} · {tAgo(a.created_at)}</div>
                  </div>
                  {!a.resolved && (
                    <button onClick={() => resolveAlert(a.id)} style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.1)", color: "#10b981", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Resolve</button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "flagged" && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
            <table style={{ width: "100%", fontSize: 13 }}>
              <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["User", "Fraud Score", "Verified", "Joined", "Action"].map(h => (
                  <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {flagged.map(u => {
                  const score = u.fraud_score ?? 0;
                  const color = score >= 90 ? "#ef4444" : score >= 75 ? "#f97316" : "#f59e0b";
                  return (
                    <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "11px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--bg)", overflow: "hidden" }}>
                            {u.avatar_url && <img src={u.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                          </div>
                          <span style={{ fontWeight: 600, color: "var(--text)" }}>@{u.username}</span>
                        </div>
                      </td>
                      <td style={{ padding: "11px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 60, height: 6, background: "var(--bg)", borderRadius: 99, overflow: "hidden" }}>
                            <div style={{ height: "100%", background: color, width: `${score}%`, borderRadius: 99 }} />
                          </div>
                          <span style={{ fontWeight: 800, color, fontSize: 13 }}>{score}</span>
                        </div>
                      </td>
                      <td style={{ padding: "11px 16px", color: u.is_verified ? "#10b981" : "var(--muted)" }}>{u.is_verified ? "✓" : "—"}</td>
                      <td style={{ padding: "11px 16px", color: "var(--muted)", fontSize: 12 }}>{tAgo(u.created_at)}</td>
                      <td style={{ padding: "11px 16px" }}>
                        <button onClick={() => blockUser(u.id)} style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.1)", color: "#ef4444", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Block</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {flagged.length === 0 && <div style={{ textAlign: "center", padding: "48px 0", color: "var(--muted)", fontSize: 13 }}>No high-risk accounts</div>}
          </div>
        )}

        {tab === "blacklist" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 20 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>Add IP to Blacklist</p>
              <div style={{ display: "flex", gap: 10 }}>
                <input value={newIp} onChange={e => setNewIp(e.target.value)} placeholder="192.168.1.1" style={{ ...inputSt, flex: 1 }} />
                <input value={newReason} onChange={e => setNewReason(e.target.value)} placeholder="Reason (optional)" style={{ ...inputSt, flex: 2 }} />
                <button onClick={addToBlacklist} disabled={!newIp} style={{ padding: "0 18px", height: 40, borderRadius: 10, border: "none", background: "#ef4444", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>Block IP</button>
              </div>
            </div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
              {blacklist.map(b => (
                <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 18px", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontFamily: "monospace", fontSize: 13, color: "#ef4444", flex: 1 }}>{b.ip}</span>
                  <span style={{ fontSize: 12, color: "var(--muted)", flex: 2 }}>{b.reason ?? "—"}</span>
                  <button onClick={() => removeFromBlacklist(b.id)} style={{ padding: "4px 10px", borderRadius: 7, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", fontSize: 11, cursor: "pointer" }}>Remove</button>
                </div>
              ))}
              {blacklist.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)", fontSize: 13 }}>No IPs blacklisted</div>}
            </div>
          </div>
        )}

        {tab === "rules" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 18 }}>Detection Thresholds</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { label: "Max transactions per hour", key: "max_transactions_per_hour" as const },
                  { label: "Max withdrawal per day (₦)", key: "max_withdrawal_per_day" as const },
                  { label: "Min account age for withdrawals (days)", key: "min_account_age_days" as const },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{f.label}</label>
                    <input type="number" value={rules[f.key]} onChange={e => setRules(p => ({ ...p, [f.key]: Number(e.target.value) }))} style={inputSt} />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 18 }}>Auto-Detection Modules</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Toggle label="Self-Gifting Detection" value={rules.self_gift_detection} onChange={v => setRules(p => ({ ...p, self_gift_detection: v }))} />
                <Toggle label="Fake Order Detection" value={rules.fake_order_detection} onChange={v => setRules(p => ({ ...p, fake_order_detection: v }))} />
                <Toggle label="Velocity Check (rapid transactions)" value={rules.velocity_check_enabled} onChange={v => setRules(p => ({ ...p, velocity_check_enabled: v }))} />
              </div>
              <button onClick={saveRules} style={{ marginTop: 18, width: "100%", height: 42, borderRadius: 10, border: "none", background: "#7c3aed", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Save Rules
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
