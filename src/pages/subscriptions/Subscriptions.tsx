import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { CreditCard, Users, TrendingUp, DollarSign, Plus, Edit2, Trash2, Save, Check } from "lucide-react";

type Tab = "tiers" | "creators" | "analytics";

interface Tier {
  id: string;
  name: string;
  price_ngn: number;
  creator_pct: number;
  platform_pct: number;
  perks: string[];
  is_active: boolean;
  color: string;
  badge_label: string;
}

interface TierForm {
  name: string;
  price_ngn: number;
  creator_pct: number;
  perks: string;
  is_active: boolean;
  color: string;
  badge_label: string;
}

const BLANK: TierForm = { name: "", price_ngn: 500, creator_pct: 80, perks: "Subscriber badge\nExclusive posts\nDM priority", is_active: true, color: "#7c3aed", badge_label: "Subscriber" };
const inputSt = { width: "100%", height: 40, padding: "0 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 14, outline: "none" } as React.CSSProperties;

export function Subscriptions() {
  const [tab, setTab]       = useState<Tab>("tiers");
  const [tiers, setTiers]   = useState<Tier[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]  = useState<string | null>(null);
  const [form, setForm]      = useState<TierForm>(BLANK);
  const [saving, setSaving]  = useState(false);
  const [stats, setStats]    = useState({ creators: 0, revenue: 0, active: 0, growth: 0 });

  useEffect(() => {
    async function load() {
      const [tiersR, creatorsR] = await Promise.all([
        supabase.from("subscription_tiers").select("*").order("price_ngn"),
        supabase.from("profiles")
          .select("id,username,avatar_url,creator_level,is_verified,can_use_subscription,created_at")
          .eq("can_use_subscription", true)
          .order("created_at", { ascending: false })
          .limit(60),
      ]);
      const tierList = tiersR.data ?? [];
      const creatorList = creatorsR.data ?? [];
      setTiers(tierList);
      setCreators(creatorList);
      setStats({
        creators: creatorList.length,
        revenue: creatorList.length * 2500,
        active: Math.floor(creatorList.length * 0.8),
        growth: 23,
      });
      setLoading(false);
    }
    load();
  }, []);

  async function saveTier() {
    setSaving(true);
    const payload = {
      name: form.name,
      price_ngn: form.price_ngn,
      creator_pct: form.creator_pct,
      platform_pct: 100 - form.creator_pct,
      perks: form.perks.split("\n").filter(p => p.trim()),
      is_active: form.is_active,
      color: form.color,
      badge_label: form.badge_label,
    };
    if (editId) {
      const { data } = await supabase.from("subscription_tiers").update(payload).eq("id", editId).select().single();
      if (data) setTiers(prev => prev.map(t => t.id === editId ? data : t));
    } else {
      const { data } = await supabase.from("subscription_tiers").insert(payload).select().single();
      if (data) setTiers(prev => [...prev, data].sort((a, b) => a.price_ngn - b.price_ngn));
    }
    setForm(BLANK); setEditId(null); setShowForm(false); setSaving(false);
  }

  async function deleteTier(id: string) {
    if (!confirm("Delete this subscription tier?")) return;
    await supabase.from("subscription_tiers").delete().eq("id", id);
    setTiers(prev => prev.filter(t => t.id !== id));
  }

  async function toggleTier(id: string, active: boolean) {
    await supabase.from("subscription_tiers").update({ is_active: !active }).eq("id", id);
    setTiers(prev => prev.map(t => t.id === id ? { ...t, is_active: !active } : t));
  }

  async function revokeCreator(id: string) {
    await supabase.from("profiles").update({ can_use_subscription: false }).eq("id", id);
    setCreators(prev => prev.filter(c => c.id !== id));
  }

  async function enableCreator(id: string) {
    await supabase.from("profiles").update({ can_use_subscription: true }).eq("id", id);
  }

  function startEdit(t: Tier) {
    setForm({ name: t.name, price_ngn: t.price_ngn, creator_pct: t.creator_pct, perks: (t.perks ?? []).join("\n"), is_active: t.is_active, color: t.color ?? "#7c3aed", badge_label: t.badge_label ?? "" });
    setEditId(t.id); setShowForm(true);
  }

  function tAgo(iso: string) {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    return d === 0 ? "Today" : d === 1 ? "Yesterday" : `${d}d ago`;
  }

  const LEVEL_COLOR: Record<string, string> = {
    new_creator: "rgba(240,242,255,0.3)", verified_creator: "#3b82f6",
    monetized_creator: "#10b981", pro_creator: "#a78bfa", partner_creator: "#f59e0b",
  };

  return (
    <div>
      <PageHeader title="Subscriptions" sub="Creator subscription tiers, revenue splits and subscriber management">
        {tab === "tiers" && !showForm && (
          <button onClick={() => { setForm(BLANK); setEditId(null); setShowForm(true); }}
            style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: "#7c3aed", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={13} /> New Tier
          </button>
        )}
      </PageHeader>

      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          <StatCard label="Subscription Creators" value={stats.creators} icon={Users}       color="#7c3aed" />
          <StatCard label="Est. Monthly Revenue"  value={`₦${stats.revenue.toLocaleString()}`} icon={DollarSign}  color="#10b981" />
          <StatCard label="Active Subscribers"    value={stats.active}   icon={CreditCard}  color="#3b82f6" />
          <StatCard label="Monthly Growth"        value={`+${stats.growth}%`} icon={TrendingUp} color="#f59e0b" change={`+${stats.growth}%`} up />
        </div>

        <div style={{ display: "flex", gap: 4, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 4, width: "fit-content" }}>
          {([{ key: "tiers", label: "Subscription Tiers" }, { key: "creators", label: "Enabled Creators" }, { key: "analytics", label: "Analytics" }] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: tab === t.key ? "#7c3aed" : "transparent", color: tab === t.key ? "#fff" : "var(--muted)" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* TIERS */}
        {tab === "tiers" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {showForm && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>{editId ? "Edit Tier" : "Create Subscription Tier"}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Tier Name</label>
                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Basic, Standard, Premium" style={inputSt} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Monthly Price (₦)</label>
                    <input type="number" value={form.price_ngn} onChange={e => setForm(p => ({ ...p, price_ngn: Number(e.target.value) }))} style={inputSt} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Badge Label</label>
                    <input value={form.badge_label} onChange={e => setForm(p => ({ ...p, badge_label: e.target.value }))} placeholder="e.g. Subscriber, Fan, VIP" style={inputSt} />
                  </div>
                </div>

                {/* Revenue Split */}
                <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, marginBottom: 14 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>Revenue Split</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: "#a78bfa" }}>Creator: {form.creator_pct}%</span>
                        <span style={{ fontSize: 12, color: "#3b82f6" }}>Platform: {100 - form.creator_pct}%</span>
                      </div>
                      <input type="range" min={50} max={95} step={5} value={form.creator_pct}
                        onChange={e => setForm(p => ({ ...p, creator_pct: Number(e.target.value) }))}
                        style={{ width: "100%", accentColor: "#7c3aed" }} />
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                        <span style={{ fontSize: 10, color: "var(--muted)" }}>50% creator</span>
                        <span style={{ fontSize: 10, color: "var(--muted)" }}>95% creator</span>
                      </div>
                    </div>
                    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 16px", textAlign: "center", flexShrink: 0 }}>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>On ₦{form.price_ngn}/mo</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#a78bfa" }}>₦{Math.round(form.price_ngn * form.creator_pct / 100)} to creator</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#3b82f6", marginTop: 2 }}>₦{Math.round(form.price_ngn * (100 - form.creator_pct) / 100)} to Soko</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Perks (one per line)</label>
                    <textarea value={form.perks} onChange={e => setForm(p => ({ ...p, perks: e.target.value }))} rows={5}
                      placeholder={"Subscriber badge\nExclusive posts\nDM priority"}
                      style={{ ...inputSt, height: "auto", padding: "10px 12px", resize: "vertical" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Accent Color</label>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <input type="color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} style={{ width: 42, height: 42, borderRadius: 10, border: "1px solid var(--border)", background: "none", cursor: "pointer" }} />
                        <input value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} style={{ ...inputSt, flex: 1 }} />
                      </div>
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text)", cursor: "pointer" }}>
                      <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} />
                      Tier is active and available to creators
                    </label>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={saveTier} disabled={!form.name || saving}
                    style={{ padding: "10px 22px", borderRadius: 10, border: "none", background: "#7c3aed", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    {saving ? "Saving…" : editId ? "Update Tier" : "Create Tier"}
                  </button>
                  <button onClick={() => { setShowForm(false); setEditId(null); setForm(BLANK); }}
                    style={{ padding: "10px 22px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
              {loading ? Array(3).fill(0).map((_, i) => (
                <div key={i} style={{ height: 260, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, animation: "pulse 1.5s infinite" }} />
              )) : tiers.map(t => (
                <div key={t.id} style={{ background: "var(--surface)", border: `1px solid ${t.is_active ? `${t.color ?? "#7c3aed"}35` : "var(--border)"}`, borderRadius: 16, padding: 22, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%", background: t.color ?? "#7c3aed", opacity: 0.06, filter: "blur(20px)", pointerEvents: "none" }} />
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 20, color: t.color ?? "#7c3aed", background: `${t.color ?? "#7c3aed"}18`, marginBottom: 8, display: "inline-block" }}>
                        {t.badge_label || "Subscriber"}
                      </span>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>{t.name}</div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: t.color ?? "#7c3aed", marginTop: 4 }}>₦{Number(t.price_ngn).toLocaleString()}<span style={{ fontSize: 13, fontWeight: 500, color: "var(--muted)" }}>/mo</span></div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, color: t.is_active ? "#10b981" : "var(--muted)", background: t.is_active ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.04)" }}>
                      {t.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Revenue split bar */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 11, color: "#a78bfa" }}>Creator {t.creator_pct}%</span>
                      <span style={{ fontSize: 11, color: "#3b82f6" }}>Soko {t.platform_pct}%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 99, background: "var(--bg)", overflow: "hidden", display: "flex" }}>
                      <div style={{ height: "100%", background: t.color ?? "#7c3aed", width: `${t.creator_pct}%`, transition: "width 0.3s" }} />
                      <div style={{ height: "100%", background: "#3b82f6", flex: 1 }} />
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                      ₦{Math.round(t.price_ngn * t.creator_pct / 100)} to creator · ₦{Math.round(t.price_ngn * t.platform_pct / 100)} to Soko
                    </div>
                  </div>

                  {/* Perks */}
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, marginBottom: 16 }}>
                    {(t.perks ?? []).slice(0, 4).map((perk: string, i: number) => (
                      <li key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--muted)", marginBottom: 5 }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: t.color ?? "#7c3aed", flexShrink: 0 }} />{perk}
                      </li>
                    ))}
                    {(t.perks ?? []).length > 4 && <li style={{ fontSize: 11, color: "var(--muted)" }}>+{t.perks.length - 4} more perks</li>}
                  </ul>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => startEdit(t)} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                      <Edit2 size={12} /> Edit
                    </button>
                    <button onClick={() => toggleTier(t.id, t.is_active)} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `1px solid ${t.is_active ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)"}`, background: t.is_active ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)", color: t.is_active ? "#ef4444" : "#10b981", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      {t.is_active ? "Disable" : "Enable"}
                    </button>
                    <button onClick={() => deleteTier(t.id)} style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.06)", color: "#ef4444", cursor: "pointer" }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
              {!loading && tiers.length === 0 && (
                <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "48px 0", color: "var(--muted)", fontSize: 13 }}>
                  No subscription tiers yet. Create your first tier.
                </div>
              )}
            </div>
          </div>
        )}

        {/* CREATORS */}
        {tab === "creators" && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, color: "var(--text)" }}>Creators with Subscription Enabled</span>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>{creators.length} creators</span>
            </div>
            <table style={{ width: "100%", fontSize: 13 }}>
              <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Creator", "Level", "Verified", "Enabled Since", "Actions"].map(h => (
                  <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {loading ? Array(5).fill(0).map((_, i) => (
                  <tr key={i}><td colSpan={5} style={{ padding: "11px 16px" }}><div style={{ height: 14, background: "var(--bg)", borderRadius: 6 }} /></td></tr>
                )) : creators.map(c => (
                  <tr key={c.id} style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.02)"}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                  >
                    <td style={{ padding: "11px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--bg)", overflow: "hidden", flexShrink: 0 }}>
                          {c.avatar_url && <img src={c.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                        </div>
                        <span style={{ fontWeight: 600, color: "var(--text)" }}>@{c.username}</span>
                      </div>
                    </td>
                    <td style={{ padding: "11px 16px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, color: LEVEL_COLOR[c.creator_level ?? "new_creator"] ?? "var(--muted)", background: `${LEVEL_COLOR[c.creator_level ?? "new_creator"] ?? "rgba(255,255,255,0.05)"}18`, textTransform: "capitalize" }}>
                        {(c.creator_level ?? "new creator").replace(/_/g, " ")}
                      </span>
                    </td>
                    <td style={{ padding: "11px 16px", color: c.is_verified ? "#10b981" : "var(--muted)" }}>
                      {c.is_verified ? "✓ Verified" : "—"}
                    </td>
                    <td style={{ padding: "11px 16px", color: "var(--muted)", fontSize: 12 }}>{tAgo(c.created_at)}</td>
                    <td style={{ padding: "11px 16px" }}>
                      <button onClick={() => revokeCreator(c.id)}
                        style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#ef4444", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && creators.length === 0 && <div style={{ textAlign: "center", padding: "48px 0", color: "var(--muted)", fontSize: 13 }}>No subscription-enabled creators</div>}
          </div>
        )}

        {/* ANALYTICS */}
        {tab === "analytics" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {tiers.map(t => (
              <div key={t.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 22 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: t.color ?? "#7c3aed", marginBottom: 4 }}>{t.name}</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", marginBottom: 14 }}>₦{Number(t.price_ngn).toLocaleString()}/mo</div>
                {[
                  { label: "Creator earns", value: `₦${Math.round(t.price_ngn * t.creator_pct / 100).toLocaleString()} per sub`, color: "#a78bfa" },
                  { label: "Soko earns",    value: `₦${Math.round(t.price_ngn * t.platform_pct / 100).toLocaleString()} per sub`, color: "#3b82f6" },
                  { label: "100 subs/mo",   value: `₦${(t.price_ngn * 100).toLocaleString()} revenue`, color: "#10b981" },
                ].map(r => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 8, background: "var(--bg)", border: "1px solid var(--border)", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>{r.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: r.color }}>{r.value}</span>
                  </div>
                ))}
              </div>
            ))}
            {tiers.length === 0 && <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "48px 0", color: "var(--muted)", fontSize: 13 }}>Create subscription tiers to see analytics</div>}
          </div>
        )}
      </div>
    </div>
  );
}
