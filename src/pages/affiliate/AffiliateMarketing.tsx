import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { Users, DollarSign, TrendingUp, Link, Plus, Trash2, Copy, CheckCircle } from "lucide-react";

type Tab = "overview" | "affiliates" | "config" | "payouts";

interface Affiliate {
  id: string; name: string; email: string; code: string;
  clicks: number; conversions: number; revenue: number;
  commission_rate: number; status: "active" | "paused" | "pending";
  joined: string; tier: "standard" | "premium" | "elite";
}

const MOCK_AFFILIATES: Affiliate[] = [
  { id: "1", name: "Chisom Okafor", email: "chisom@creator.ng", code: "CHISOM20", clicks: 4820, conversions: 312, revenue: 2850000, commission_rate: 8, status: "active", joined: "2026-01-15", tier: "elite" },
  { id: "2", name: "Tunde Fashola", email: "tunde@blog.ng", code: "TUNDE15", clicks: 2100, conversions: 145, revenue: 980000, commission_rate: 6, status: "active", joined: "2026-02-08", tier: "premium" },
  { id: "3", name: "Amaka Style", email: "amaka@fashion.ng", code: "AMAKA10", clicks: 890, conversions: 62, revenue: 340000, commission_rate: 5, status: "active", joined: "2026-03-01", tier: "standard" },
  { id: "4", name: "Emeka Tech", email: "emeka@techblog.ng", code: "EMEKA15", clicks: 1650, conversions: 98, revenue: 720000, commission_rate: 6, status: "paused", joined: "2026-02-20", tier: "premium" },
  { id: "5", name: "Ngozi Beauty", email: "ngozi@beauty.ng", code: "NGOZI10", clicks: 3200, conversions: 180, revenue: 1200000, commission_rate: 7, status: "active", joined: "2026-01-28", tier: "elite" },
];

const TIER_COLORS: Record<string, string> = {
  standard: "#6b7280", premium: "#f59e0b", elite: "#7c3aed"
};

const STATUS_COLORS: Record<string, string> = {
  active: "#10b981", paused: "#f59e0b", pending: "#3b82f6"
};

export function AffiliateMarketing() {
  const [tab, setTab] = useState<Tab>("overview");
  const [affiliates, setAffiliates] = useState<Affiliate[]>(MOCK_AFFILIATES);
  const [showAdd, setShowAdd] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [config, setConfig] = useState({
    standardRate: 5, premiumRate: 6, eliteRate: 8,
    minPayout: 5000, cookieDays: 30,
    autoApprove: false, maxAffiliates: 500,
    landingPage: "https://soko.africa/ref/",
    programStatus: "active",
  });
  const [newAffiliate, setNewAffiliate] = useState({ name: "", email: "", tier: "standard", commission_rate: 5 });
  const [saving, setSaving] = useState(false);

  const totalClicks = affiliates.reduce((s, a) => s + a.clicks, 0);
  const totalConversions = affiliates.reduce((s, a) => s + a.conversions, 0);
  const totalRevenue = affiliates.reduce((s, a) => s + a.revenue, 0);
  const totalCommission = affiliates.reduce((s, a) => s + (a.revenue * a.commission_rate / 100), 0);
  const convRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(1) : "0";

  function generateCode(name: string) {
    return name.split(" ")[0].toUpperCase() + Math.floor(10 + Math.random() * 90);
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(`${config.landingPage}${code}`);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  function addAffiliate() {
    const affiliate: Affiliate = {
      id: Date.now().toString(),
      ...newAffiliate,
      code: generateCode(newAffiliate.name),
      clicks: 0, conversions: 0, revenue: 0,
      status: config.autoApprove ? "active" : "pending",
      joined: new Date().toISOString().split("T")[0],
      tier: newAffiliate.tier as "standard" | "premium" | "elite",
    };
    setAffiliates(prev => [affiliate, ...prev]);
    setNewAffiliate({ name: "", email: "", tier: "standard", commission_rate: 5 });
    setShowAdd(false);
  }

  function toggleStatus(id: string) {
    setAffiliates(prev => prev.map(a => a.id === id
      ? { ...a, status: a.status === "active" ? "paused" : "active" }
      : a
    ));
  }

  async function saveConfig() {
    setSaving(true);
    await supabase.from("app_config").upsert({ key: "affiliate_config", value: config });
    setSaving(false);
  }

  const inp = (val: string | number, onChange: (v: string) => void, type = "text") => ({
    value: val,
    type,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
    style: { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13 } as React.CSSProperties,
  });

  return (
    <div>
      <PageHeader title="Affiliate Marketing" sub="Manage affiliate partners, track conversions, and configure commission payouts">
        <button onClick={() => setShowAdd(true)} style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#7c3aed,#ec4899)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={14} /> Add Affiliate
        </button>
      </PageHeader>

      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          <StatCard label="Total Affiliates"   value={affiliates.filter(a => a.status === "active").length} icon={Users}      color="#7c3aed" change={`${affiliates.length} total`} />
          <StatCard label="Total Clicks"        value={totalClicks.toLocaleString()}                          icon={TrendingUp}  color="#3b82f6" change={`${convRate}% CVR`} up />
          <StatCard label="Revenue via Affiliates" value={`₦${(totalRevenue / 1000000).toFixed(1)}M`}        icon={DollarSign}  color="#10b981" change="+24%" up />
          <StatCard label="Commission Owed"     value={`₦${totalCommission.toLocaleString()}`}                icon={DollarSign}  color="#f59e0b" />
        </div>

        <div style={{ display: "flex", gap: 4, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 4, width: "fit-content" }}>
          {(["overview","affiliates","config","payouts"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: tab === t ? "#7c3aed" : "transparent", color: tab === t ? "#fff" : "var(--muted)", textTransform: "capitalize" }}>
              {t}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>Top Affiliates by Revenue</p>
              {[...affiliates].sort((a, b) => b.revenue - a.revenue).slice(0, 5).map((a, i) => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#cd7c32" : "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: i < 3 ? "#fff" : "var(--muted)", flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{a.code} · {a.conversions} conversions</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#10b981" }}>₦{a.revenue.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{a.commission_rate}% rate</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>Tier Breakdown</p>
              {[
                { tier: "elite", label: "Elite Affiliates", rate: `${config.eliteRate}%`, color: "#7c3aed" },
                { tier: "premium", label: "Premium Affiliates", rate: `${config.premiumRate}%`, color: "#f59e0b" },
                { tier: "standard", label: "Standard Affiliates", rate: `${config.standardRate}%`, color: "#6b7280" },
              ].map(t => {
                const count = affiliates.filter(a => a.tier === t.tier).length;
                const rev = affiliates.filter(a => a.tier === t.tier).reduce((s, a) => s + a.revenue, 0);
                return (
                  <div key={t.tier} style={{ marginBottom: 16, padding: "14px 16px", background: "var(--bg)", borderRadius: 10, border: `1px solid ${t.color}22` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: t.color }}>{t.label}</span>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>{count} partners · {t.rate} commission</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>₦{rev.toLocaleString()} generated</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "affiliates" && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
            <table style={{ width: "100%", fontSize: 13 }}>
              <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Affiliate","Code","Tier","Clicks","Conv.","Revenue","Commission","Status","Actions"].map(h => (
                  <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {affiliates.map(a => (
                  <tr key={a.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ fontWeight: 600, color: "var(--text)" }}>{a.name}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>{a.email}</div>
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", fontFamily: "monospace" }}>{a.code}</span>
                        <button onClick={() => copyCode(a.code)} style={{ background: "none", border: "none", cursor: "pointer", color: copiedCode === a.code ? "#10b981" : "var(--muted)", padding: 2 }}>
                          {copiedCode === a.code ? <CheckCircle size={12} /> : <Copy size={12} />}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, color: TIER_COLORS[a.tier], background: `${TIER_COLORS[a.tier]}18`, textTransform: "capitalize" }}>{a.tier}</span>
                    </td>
                    <td style={{ padding: "11px 14px", color: "var(--muted)" }}>{a.clicks.toLocaleString()}</td>
                    <td style={{ padding: "11px 14px", color: "var(--muted)" }}>{a.conversions}</td>
                    <td style={{ padding: "11px 14px", fontWeight: 700, color: "#10b981" }}>₦{a.revenue.toLocaleString()}</td>
                    <td style={{ padding: "11px 14px", color: "#f59e0b", fontWeight: 600 }}>₦{(a.revenue * a.commission_rate / 100).toLocaleString()}</td>
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, color: STATUS_COLORS[a.status], background: `${STATUS_COLORS[a.status]}18`, textTransform: "capitalize" }}>{a.status}</span>
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => toggleStatus(a.id)} style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", fontSize: 11, cursor: "pointer" }}>
                          {a.status === "active" ? "Pause" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "config" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>Commission Rates by Tier</p>
              {[
                { label: "Standard Rate (%)", key: "standardRate" as const, desc: "Default for new affiliates" },
                { label: "Premium Rate (%)", key: "premiumRate" as const, desc: "High-performing partners" },
                { label: "Elite Rate (%)", key: "eliteRate" as const, desc: "Top-tier, exclusive partners" },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 6 }}>{f.label} <span style={{ fontSize: 11, color: "rgba(240,242,255,0.2)" }}>— {f.desc}</span></label>
                  <input {...inp(config[f.key], v => setConfig(p => ({ ...p, [f.key]: Number(v) })), "number")} min={1} max={30} />
                </div>
              ))}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 6 }}>Cookie Duration (days)</label>
                <input {...inp(config.cookieDays, v => setConfig(p => ({ ...p, cookieDays: Number(v) })), "number")} min={1} max={90} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 6 }}>Minimum Payout (₦)</label>
                <input {...inp(config.minPayout, v => setConfig(p => ({ ...p, minPayout: Number(v) })), "number")} />
              </div>
            </div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>Program Settings</p>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 6 }}>Landing Page Base URL</label>
                <input {...inp(config.landingPage, v => setConfig(p => ({ ...p, landingPage: v })))} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 6 }}>Maximum Affiliates</label>
                <input {...inp(config.maxAffiliates, v => setConfig(p => ({ ...p, maxAffiliates: Number(v) })), "number")} />
              </div>
              <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "var(--bg)", borderRadius: 10, border: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Auto-Approve New Affiliates</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>Skip manual review for new applicants</div>
                </div>
                <div onClick={() => setConfig(p => ({ ...p, autoApprove: !p.autoApprove }))} style={{ width: 40, height: 22, borderRadius: 11, background: config.autoApprove ? "#7c3aed" : "rgba(255,255,255,0.1)", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                  <div style={{ position: "absolute", top: 3, left: config.autoApprove ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                </div>
              </div>
              <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "var(--bg)", borderRadius: 10, border: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Program Status</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>Pause all new affiliate registrations</div>
                </div>
                <div onClick={() => setConfig(p => ({ ...p, programStatus: p.programStatus === "active" ? "paused" : "active" }))} style={{ width: 40, height: 22, borderRadius: 11, background: config.programStatus === "active" ? "#10b981" : "rgba(255,255,255,0.1)", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                  <div style={{ position: "absolute", top: 3, left: config.programStatus === "active" ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                </div>
              </div>
              <button onClick={saveConfig} disabled={saving} style={{ width: "100%", padding: "10px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#7c3aed,#ec4899)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                {saving ? "Saving…" : "Save Configuration"}
              </button>
            </div>
          </div>
        )}

        {tab === "payouts" && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Pending Commission Payouts</span>
              <button style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: "#10b981", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                Process All Payouts
              </button>
            </div>
            <table style={{ width: "100%", fontSize: 13 }}>
              <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Affiliate","Tier","Revenue Generated","Commission Rate","Amount Owed","Action"].map(h => (
                  <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {affiliates.filter(a => a.status === "active" && a.conversions > 0).map(a => {
                  const commission = Math.round(a.revenue * a.commission_rate / 100);
                  return (
                    <tr key={a.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "11px 16px" }}>
                        <div style={{ fontWeight: 600, color: "var(--text)" }}>{a.name}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>{a.email}</div>
                      </td>
                      <td style={{ padding: "11px 16px" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, color: TIER_COLORS[a.tier], background: `${TIER_COLORS[a.tier]}18`, textTransform: "capitalize" }}>{a.tier}</span>
                      </td>
                      <td style={{ padding: "11px 16px", color: "#10b981", fontWeight: 600 }}>₦{a.revenue.toLocaleString()}</td>
                      <td style={{ padding: "11px 16px", color: "var(--muted)" }}>{a.commission_rate}%</td>
                      <td style={{ padding: "11px 16px", fontWeight: 800, color: "#f59e0b", fontSize: 14 }}>₦{commission.toLocaleString()}</td>
                      <td style={{ padding: "11px 16px" }}>
                        {commission >= config.minPayout
                          ? <button style={{ padding: "5px 14px", borderRadius: 8, border: "none", background: "#10b981", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Pay Now</button>
                          : <span style={{ fontSize: 11, color: "var(--muted)" }}>Below minimum (₦{config.minPayout.toLocaleString()})</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 32, width: 420 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 24 }}>Add Affiliate Partner</h3>
            {[
              { label: "Full Name", key: "name", type: "text" },
              { label: "Email Address", key: "email", type: "email" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 6 }}>{f.label}</label>
                <input value={(newAffiliate as any)[f.key]} type={f.type} onChange={e => setNewAffiliate(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13 }} />
              </div>
            ))}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 6 }}>Tier</label>
              <select value={newAffiliate.tier} onChange={e => setNewAffiliate(p => ({ ...p, tier: e.target.value, commission_rate: e.target.value === "elite" ? config.eliteRate : e.target.value === "premium" ? config.premiumRate : config.standardRate }))}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13 }}>
                <option value="standard">Standard ({config.standardRate}%)</option>
                <option value="premium">Premium ({config.premiumRate}%)</option>
                <option value="elite">Elite ({config.eliteRate}%)</option>
              </select>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 6 }}>Commission Rate (%)</label>
              <input value={newAffiliate.commission_rate} type="number" min={1} max={30} onChange={e => setNewAffiliate(p => ({ ...p, commission_rate: Number(e.target.value) }))}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13 }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={addAffiliate} disabled={!newAffiliate.name || !newAffiliate.email} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#7c3aed,#ec4899)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Add Partner</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
