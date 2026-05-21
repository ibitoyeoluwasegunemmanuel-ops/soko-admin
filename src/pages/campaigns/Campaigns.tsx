import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { Megaphone, Tag, Gift, Calendar, Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

type Tab = "campaigns" | "flash-sales" | "coupons" | "referrals";

const inputSt = { width: "100%", height: 40, padding: "0 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 14, outline: "none" } as React.CSSProperties;

export function Campaigns() {
  const [tab, setTab] = useState<Tab>("campaigns");
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ active: 0, coupons: 0, redeemed: 0, revenue: 0 });
  const [saving, setSaving] = useState(false);

  const [cForm, setCForm] = useState({ name: "", description: "", target: "all_users", start_at: "", end_at: "", is_active: true });
  const [couponForm, setCouponForm] = useState({ code: "", discount_pct: 10, max_uses: 100, min_order_ngn: 0, expires_at: "" });
  const [fsForm, setFsForm] = useState({ category: "", discount_pct: 20, start_at: "", end_at: "" });
  const [refForm, setRefForm] = useState({ referrer_bonus: 500, referee_bonus: 200, max_per_user: 20 });

  useEffect(() => {
    async function load() {
      const [campR, coupR] = await Promise.all([
        supabase.from("campaigns").select("*").order("created_at", { ascending: false }),
        supabase.from("coupons").select("*").order("created_at", { ascending: false }),
      ]);
      const camps = campR.data ?? [];
      const coups = coupR.data ?? [];
      setCampaigns(camps);
      setCoupons(coups);
      setStats({ active: camps.filter((c: any) => c.is_active).length, coupons: coups.length, redeemed: coups.reduce((s: number, c: any) => s + (c.used_count ?? 0), 0), revenue: 0 });
      setLoading(false);
    }
    load();
  }, []);

  async function addCampaign() {
    setSaving(true);
    const { data } = await supabase.from("campaigns").insert(cForm).select().single();
    if (data) setCampaigns(prev => [data, ...prev]);
    setCForm({ name: "", description: "", target: "all_users", start_at: "", end_at: "", is_active: true });
    setSaving(false);
  }

  async function toggleCampaign(id: string, active: boolean) {
    await supabase.from("campaigns").update({ is_active: !active }).eq("id", id);
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, is_active: !active } : c));
  }

  async function addCoupon() {
    setSaving(true);
    const { data } = await supabase.from("coupons").insert({ ...couponForm, used_count: 0 }).select().single();
    if (data) setCoupons(prev => [data, ...prev]);
    setCouponForm({ code: "", discount_pct: 10, max_uses: 100, min_order_ngn: 0, expires_at: "" });
    setSaving(false);
  }

  async function deleteCoupon(id: string) {
    await supabase.from("coupons").delete().eq("id", id);
    setCoupons(prev => prev.filter(c => c.id !== id));
  }

  function tAgo(iso?: string) {
    if (!iso) return "—";
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    return d === 0 ? "Today" : `${d}d ago`;
  }

  const TARGETS = ["all_users", "creators", "sellers", "buyers", "new_users", "vip_users"];

  return (
    <div>
      <PageHeader title="Campaigns & Promotions" sub="Flash sales, discount coupons, referral program and marketing campaigns" />
      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          <StatCard label="Active Campaigns" value={stats.active}   icon={Megaphone} color="#7c3aed" />
          <StatCard label="Active Coupons"   value={stats.coupons}  icon={Tag}       color="#3b82f6" />
          <StatCard label="Total Redeemed"   value={stats.redeemed} icon={Gift}      color="#10b981" />
          <StatCard label="Events This Month" value={campaigns.filter(c => new Date(c.created_at) > new Date(Date.now() - 30 * 86400000)).length} icon={Calendar} color="#f59e0b" />
        </div>

        <div style={{ display: "flex", gap: 4, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 4, width: "fit-content" }}>
          {[{ key: "campaigns", label: "Campaigns" }, { key: "flash-sales", label: "Flash Sales" }, { key: "coupons", label: "Coupon Codes" }, { key: "referrals", label: "Referral Program" }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as Tab)} style={{ padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: tab === t.key ? "#7c3aed" : "transparent", color: tab === t.key ? "#fff" : "var(--muted)" }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "campaigns" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 22 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 18 }}>New Campaign</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div><label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 5 }}>Campaign Name</label><input value={cForm.name} onChange={e => setCForm(p => ({ ...p, name: e.target.value }))} placeholder="Black Friday Sale" style={inputSt} /></div>
                <div><label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 5 }}>Target Audience</label>
                  <select value={cForm.target} onChange={e => setCForm(p => ({ ...p, target: e.target.value }))} style={{ ...inputSt, height: 42 }}>
                    {TARGETS.map(t => <option key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                  </select>
                </div>
                <div><label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 5 }}>Start Date</label><input type="datetime-local" value={cForm.start_at} onChange={e => setCForm(p => ({ ...p, start_at: e.target.value }))} style={inputSt} /></div>
                <div><label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 5 }}>End Date</label><input type="datetime-local" value={cForm.end_at} onChange={e => setCForm(p => ({ ...p, end_at: e.target.value }))} style={inputSt} /></div>
                <div style={{ gridColumn: "1/-1" }}><label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 5 }}>Description</label><input value={cForm.description} onChange={e => setCForm(p => ({ ...p, description: e.target.value }))} placeholder="Campaign details..." style={inputSt} /></div>
              </div>
              <button onClick={addCampaign} disabled={!cForm.name || saving} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "#7c3aed", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <Plus size={13} /> Create Campaign
              </button>
            </div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
              {campaigns.map(c => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{c.target?.replace(/_/g, " ")} · {tAgo(c.created_at)}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, color: c.is_active ? "#10b981" : "var(--muted)", background: c.is_active ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.04)" }}>{c.is_active ? "Active" : "Ended"}</span>
                  <button onClick={() => toggleCampaign(c.id, c.is_active)} style={{ background: "none", border: "none", cursor: "pointer", color: c.is_active ? "#10b981" : "var(--muted)", display: "flex" }}>
                    {c.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  </button>
                </div>
              ))}
              {campaigns.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)", fontSize: 13 }}>No campaigns yet</div>}
            </div>
          </div>
        )}

        {tab === "flash-sales" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 22 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 18 }}>Create Flash Sale</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 5 }}>Category</label><input value={fsForm.category} onChange={e => setFsForm(p => ({ ...p, category: e.target.value }))} placeholder="Electronics, Fashion, All..." style={inputSt} /></div>
                <div><label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 5 }}>Discount (%)</label><input type="number" value={fsForm.discount_pct} onChange={e => setFsForm(p => ({ ...p, discount_pct: Number(e.target.value) }))} style={inputSt} /></div>
                <div><label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 5 }}>Start Time</label><input type="datetime-local" value={fsForm.start_at} onChange={e => setFsForm(p => ({ ...p, start_at: e.target.value }))} style={inputSt} /></div>
                <div><label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 5 }}>End Time</label><input type="datetime-local" value={fsForm.end_at} onChange={e => setFsForm(p => ({ ...p, end_at: e.target.value }))} style={inputSt} /></div>
              </div>
              <button onClick={() => supabase.from("flash_sales").insert(fsForm)} style={{ marginTop: 14, padding: "9px 20px", borderRadius: 10, border: "none", background: "#ef4444", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                🔥 Launch Flash Sale
              </button>
            </div>
          </div>
        )}

        {tab === "coupons" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 22 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 18 }}>Generate Coupon Code</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div><label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 5 }}>Code</label><input value={couponForm.code} onChange={e => setCouponForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="SOKO20" style={{ ...inputSt, fontFamily: "monospace", letterSpacing: "0.1em" }} /></div>
                <div><label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 5 }}>Discount (%)</label><input type="number" value={couponForm.discount_pct} onChange={e => setCouponForm(p => ({ ...p, discount_pct: Number(e.target.value) }))} style={inputSt} /></div>
                <div><label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 5 }}>Max Uses</label><input type="number" value={couponForm.max_uses} onChange={e => setCouponForm(p => ({ ...p, max_uses: Number(e.target.value) }))} style={inputSt} /></div>
                <div><label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 5 }}>Min Order (₦)</label><input type="number" value={couponForm.min_order_ngn} onChange={e => setCouponForm(p => ({ ...p, min_order_ngn: Number(e.target.value) }))} style={inputSt} /></div>
                <div><label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 5 }}>Expires At</label><input type="datetime-local" value={couponForm.expires_at} onChange={e => setCouponForm(p => ({ ...p, expires_at: e.target.value }))} style={inputSt} /></div>
              </div>
              <button onClick={addCoupon} disabled={!couponForm.code || saving} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "#7c3aed", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Create Coupon</button>
            </div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
              <table style={{ width: "100%", fontSize: 13 }}>
                <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Code", "Discount", "Used / Max", "Min Order", "Expires", "Action"].map(h => (
                    <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {coupons.map(c => (
                    <tr key={c.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "11px 16px", fontFamily: "monospace", fontWeight: 700, color: "#a78bfa", fontSize: 14 }}>{c.code}</td>
                      <td style={{ padding: "11px 16px", fontWeight: 800, color: "#10b981" }}>{c.discount_pct}%</td>
                      <td style={{ padding: "11px 16px", color: "var(--muted)" }}>{c.used_count ?? 0} / {c.max_uses}</td>
                      <td style={{ padding: "11px 16px", color: "var(--muted)" }}>{c.min_order_ngn ? `₦${Number(c.min_order_ngn).toLocaleString()}` : "—"}</td>
                      <td style={{ padding: "11px 16px", color: "var(--muted)", fontSize: 12 }}>{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "—"}</td>
                      <td style={{ padding: "11px 16px" }}>
                        <button onClick={() => deleteCoupon(c.id)} style={{ padding: "4px 8px", borderRadius: 7, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.06)", color: "#ef4444", cursor: "pointer" }}>
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {coupons.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)", fontSize: 13 }}>No coupons yet</div>}
            </div>
          </div>
        )}

        {tab === "referrals" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 18 }}>Referral Program Config</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { label: "Referrer Bonus (₦)", key: "referrer_bonus" as const, hint: "Paid when someone signs up via your link" },
                  { label: "Referee Bonus (₦)", key: "referee_bonus" as const, hint: "Paid to the person who was referred" },
                  { label: "Max Referrals Per User", key: "max_per_user" as const, hint: "Cap on how many people one user can refer" },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{f.label}</label>
                    <input type="number" value={refForm[f.key]} onChange={e => setRefForm(p => ({ ...p, [f.key]: Number(e.target.value) }))} style={inputSt} />
                    <p style={{ fontSize: 11, color: "rgba(240,242,255,0.2)", marginTop: 4 }}>{f.hint}</p>
                  </div>
                ))}
                <button onClick={() => supabase.from("app_config").upsert({ key: "referral_config", value: JSON.stringify(refForm) })} style={{ height: 42, borderRadius: 10, border: "none", background: "#7c3aed", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Save Config</button>
              </div>
            </div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>Preview</p>
              {[
                { label: "When user A refers user B", result: `User A gets ₦${refForm.referrer_bonus.toLocaleString()}`, color: "#7c3aed" },
                { label: "User B signs up via referral", result: `User B gets ₦${refForm.referee_bonus.toLocaleString()}`, color: "#10b981" },
                { label: "Max referrals per account", result: `${refForm.max_per_user} people`, color: "#f59e0b" },
              ].map(r => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px", borderRadius: 10, background: "var(--bg)", border: "1px solid var(--border)", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>{r.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: r.color }}>{r.result}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
