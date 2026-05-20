import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { ShoppingBag, Package, AlertTriangle, CheckCircle, Tag, Plus, Edit2, Trash2, Save } from "lucide-react";

type Tab = "products" | "sellers" | "categories" | "rules" | "reports";

interface Category { id: string; name: string; slug: string; commission_pct: number; is_active: boolean; icon: string; product_count?: number; }
interface CatForm { name: string; slug: string; commission_pct: number; is_active: boolean; icon: string; }
const BLANK_CAT: CatForm = { name: "", slug: "", commission_pct: 10, is_active: true, icon: "📦" };

const inputSt = { width: "100%", height: 40, padding: "0 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 14, outline: "none" } as React.CSSProperties;

export function Marketplace() {
  const [tab, setTab]         = useState<Tab>("products");
  const [products, setProducts] = useState<any[]>([]);
  const [sellers, setSellers]   = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reports, setReports]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [stats, setStats]       = useState({ total: 0, active: 0, pending: 0, flagged: 0 });
  const [catForm, setCatForm]   = useState<CatForm>(BLANK_CAT);
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [showCatForm, setShowCatForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  // Rules state
  const [rules, setRules] = useState({
    marketplace_commission: 10,
    service_commission: 15,
    auction_commission: 8,
    min_product_price: 100,
    max_product_price: 10000000,
    refund_window_days: 7,
    shipping_free_above: 5000,
    max_products_per_seller: 200,
    dispute_auto_close_days: 14,
    escrow_hold_days: 3,
  });

  useEffect(() => {
    async function load() {
      const [statsR, prodR, selR, catR, repR, cfgR] = await Promise.all([
        Promise.all([
          supabase.from("products").select("*", { count: "exact", head: true }),
          supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", true),
          supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", false),
          supabase.from("products").select("*", { count: "exact", head: true }).eq("is_flagged", true),
        ]),
        supabase.from("products").select("id,name,price,category,is_active,media_url,created_at,seller:profiles!seller_id(username,avatar_url)").order("created_at", { ascending: false }).limit(50),
        supabase.from("profiles").select("id,username,avatar_url,is_vendor,is_verified,trust_score,created_at").eq("is_vendor", true).order("created_at", { ascending: false }).limit(50),
        supabase.from("product_categories").select("*").order("name"),
        supabase.from("product_reports").select("id,reason,status,created_at,reporter:profiles!reporter_id(username),product:products!product_id(name)").order("created_at", { ascending: false }).limit(30),
        supabase.from("app_config").select("key,value").eq("key", "marketplace_rules"),
      ]);
      const [tot, act, pend, flag] = statsR;
      setStats({ total: tot.count ?? 0, active: act.count ?? 0, pending: pend.count ?? 0, flagged: flag.count ?? 0 });
      setProducts(prodR.data ?? []);
      setSellers(selR.data ?? []);
      setCategories(catR.data ?? []);
      setReports(repR.data ?? []);
      try { if (cfgR.data?.[0]) setRules(JSON.parse(cfgR.data[0].value)); } catch {}
      setLoading(false);
    }
    load();
  }, []);

  async function saveRules() {
    setSaving(true);
    await supabase.from("app_config").upsert({ key: "marketplace_rules", value: JSON.stringify(rules) });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  async function saveCategory() {
    setSaving(true);
    const slug = catForm.slug || catForm.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const payload = { ...catForm, slug };
    if (editCatId) {
      const { data } = await supabase.from("product_categories").update(payload).eq("id", editCatId).select().single();
      if (data) setCategories(prev => prev.map(c => c.id === editCatId ? data : c));
    } else {
      const { data } = await supabase.from("product_categories").insert(payload).select().single();
      if (data) setCategories(prev => [...prev, data]);
    }
    setCatForm(BLANK_CAT); setEditCatId(null); setShowCatForm(false); setSaving(false);
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete this category?")) return;
    await supabase.from("product_categories").delete().eq("id", id);
    setCategories(prev => prev.filter(c => c.id !== id));
  }

  async function toggleProduct(id: string, active: boolean) {
    await supabase.from("products").update({ is_active: !active }).eq("id", id);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: !active } : p));
  }

  async function toggleSeller(id: string, verified: boolean) {
    await supabase.from("profiles").update({ is_verified: !verified }).eq("id", id);
    setSellers(prev => prev.map(s => s.id === id ? { ...s, is_verified: !verified } : s));
  }

  async function resolveReport(id: string) {
    await supabase.from("product_reports").update({ status: "resolved" }).eq("id", id);
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: "resolved" } : r));
  }

  function tAgo(iso: string) {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    return d === 0 ? "Today" : d === 1 ? "Yesterday" : `${d}d ago`;
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "products",   label: "Products" },
    { key: "sellers",    label: "Sellers" },
    { key: "categories", label: "Categories" },
    { key: "rules",      label: "Rules & Commission" },
    { key: "reports",    label: `Reports${reports.filter(r => r.status === "open").length > 0 ? ` (${reports.filter(r => r.status === "open").length})` : ""}` },
  ];

  const TH = ({ children }: { children: string }) => (
    <th style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>{children}</th>
  );
  const TR = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <tr style={{ borderBottom: "1px solid var(--border)", cursor: onClick ? "pointer" : "default" }}
      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.02)"}
      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
      onClick={onClick}
    >{children}</tr>
  );
  const TD = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <td style={{ padding: "11px 16px", fontSize: 13, ...style }}>{children}</td>
  );

  const Btn = ({ onClick, color, children }: { onClick: () => void; color: string; children: React.ReactNode }) => (
    <button onClick={onClick} style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${color}35`, background: `${color}10`, color, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
      {children}
    </button>
  );

  const RuleInput = ({ label, hint, value, onChange, prefix }: { label: string; hint: string; value: number; onChange: (v: number) => void; prefix?: string }) => (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{label}</label>
      <div style={{ position: "relative" }}>
        {prefix && <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", fontSize: 13, pointerEvents: "none" }}>{prefix}</span>}
        <input type="number" value={value} onChange={e => onChange(Number(e.target.value))}
          style={{ ...inputSt, paddingLeft: prefix ? 28 : 12 }} />
      </div>
      <p style={{ fontSize: 11, color: "rgba(240,242,255,0.2)", marginTop: 4 }}>{hint}</p>
    </div>
  );

  return (
    <div>
      <PageHeader title="Marketplace" sub="Products, sellers, categories, commission rules and reports">
        <span style={{ fontSize: 12, color: "var(--muted)" }}>{stats.total.toLocaleString()} products</span>
      </PageHeader>

      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          <StatCard label="Total Products"   value={stats.total}   icon={Package}       color="#7c3aed" />
          <StatCard label="Active"           value={stats.active}  icon={CheckCircle}   color="#10b981" />
          <StatCard label="Pending Approval" value={stats.pending} icon={ShoppingBag}   color="#f59e0b" />
          <StatCard label="Flagged"          value={stats.flagged} icon={AlertTriangle}  color="#ef4444" />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 4, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 4 }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: tab === t.key ? "#7c3aed" : "transparent", color: tab === t.key ? "#fff" : "var(--muted)", whiteSpace: "nowrap" }}>
                {t.label}
              </button>
            ))}
          </div>
          {tab === "categories" && !showCatForm && (
            <button onClick={() => { setCatForm(BLANK_CAT); setEditCatId(null); setShowCatForm(true); }}
              style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: "#7c3aed", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Plus size={13} /> New Category
            </button>
          )}
          {tab === "rules" && (
            <button onClick={saveRules} disabled={saving}
              style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: saved ? "#10b981" : "#7c3aed", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "background 0.2s" }}>
              <Save size={13} /> {saved ? "Saved!" : saving ? "Saving…" : "Save Rules"}
            </button>
          )}
        </div>

        {/* PRODUCTS */}
        {tab === "products" && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
            <table style={{ width: "100%", fontSize: 13 }}>
              <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
                <TH>Product</TH><TH>Price</TH><TH>Seller</TH><TH>Category</TH><TH>Status</TH><TH>Listed</TH><TH>Actions</TH>
              </tr></thead>
              <tbody>
                {loading ? Array(6).fill(0).map((_, i) => (
                  <tr key={i}><td colSpan={7} style={{ padding: "11px 16px" }}><div style={{ height: 14, background: "var(--bg)", borderRadius: 6 }} /></td></tr>
                )) : products.map(p => (
                  <TR key={p.id}>
                    <TD>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--bg)", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {p.media_url ? <img src={p.media_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <ShoppingBag size={14} style={{ color: "var(--muted)" }} />}
                        </div>
                        <span style={{ fontWeight: 600, color: "var(--text)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name ?? p.title ?? "—"}</span>
                      </div>
                    </TD>
                    <TD style={{ fontWeight: 700, color: "#10b981" }}>₦{Number(p.price ?? 0).toLocaleString()}</TD>
                    <TD style={{ color: "var(--muted)" }}>@{p.seller?.username ?? "—"}</TD>
                    <TD><span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,0.04)", color: "var(--muted)" }}>{p.category ?? "—"}</span></TD>
                    <TD>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, color: p.is_active ? "#10b981" : "#f59e0b", background: p.is_active ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)" }}>
                        {p.is_active ? "Active" : "Pending"}
                      </span>
                    </TD>
                    <TD style={{ color: "var(--muted)", fontSize: 12 }}>{tAgo(p.created_at)}</TD>
                    <TD>
                      <Btn onClick={() => toggleProduct(p.id, p.is_active)} color={p.is_active ? "#ef4444" : "#10b981"}>
                        {p.is_active ? "Remove" : "Approve"}
                      </Btn>
                    </TD>
                  </TR>
                ))}
              </tbody>
            </table>
            {!loading && products.length === 0 && <div style={{ textAlign: "center", padding: "48px 0", color: "var(--muted)", fontSize: 13 }}>No products found</div>}
          </div>
        )}

        {/* SELLERS */}
        {tab === "sellers" && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
            <table style={{ width: "100%", fontSize: 13 }}>
              <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
                <TH>Seller</TH><TH>Verified</TH><TH>Trust Score</TH><TH>Joined</TH><TH>Actions</TH>
              </tr></thead>
              <tbody>
                {loading ? Array(5).fill(0).map((_, i) => (
                  <tr key={i}><td colSpan={5} style={{ padding: "11px 16px" }}><div style={{ height: 14, background: "var(--bg)", borderRadius: 6 }} /></td></tr>
                )) : sellers.map(s => (
                  <TR key={s.id}>
                    <TD>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--bg)", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>
                          {s.avatar_url ? <img src={s.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : s.username?.[0]?.toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600, color: "var(--text)" }}>@{s.username}</span>
                      </div>
                    </TD>
                    <TD>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, color: s.is_verified ? "#10b981" : "var(--muted)", background: s.is_verified ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.04)" }}>
                        {s.is_verified ? "✓ Verified" : "Unverified"}
                      </span>
                    </TD>
                    <TD>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 5, background: "var(--bg)", borderRadius: 99, overflow: "hidden", maxWidth: 80 }}>
                          <div style={{ height: "100%", borderRadius: 99, background: (s.trust_score ?? 50) >= 70 ? "#10b981" : (s.trust_score ?? 50) >= 40 ? "#f59e0b" : "#ef4444", width: `${s.trust_score ?? 50}%`, transition: "width 0.3s" }} />
                        </div>
                        <span style={{ fontSize: 12, color: "var(--muted)" }}>{s.trust_score ?? 50}%</span>
                      </div>
                    </TD>
                    <TD style={{ color: "var(--muted)", fontSize: 12 }}>{tAgo(s.created_at)}</TD>
                    <TD>
                      <Btn onClick={() => toggleSeller(s.id, s.is_verified)} color={s.is_verified ? "#ef4444" : "#10b981"}>
                        {s.is_verified ? "Unverify" : "Verify"}
                      </Btn>
                    </TD>
                  </TR>
                ))}
              </tbody>
            </table>
            {!loading && sellers.length === 0 && <div style={{ textAlign: "center", padding: "48px 0", color: "var(--muted)", fontSize: 13 }}>No sellers found</div>}
          </div>
        )}

        {/* CATEGORIES */}
        {tab === "categories" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {showCatForm && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>{editCatId ? "Edit Category" : "New Category"}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Category Name</label>
                    <input value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Electronics" style={inputSt} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Slug (auto)</label>
                    <input value={catForm.slug || catForm.name.toLowerCase().replace(/\s+/g, "-")} onChange={e => setCatForm(p => ({ ...p, slug: e.target.value }))} placeholder="electronics" style={inputSt} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Commission (%)</label>
                    <input type="number" min={0} max={100} value={catForm.commission_pct} onChange={e => setCatForm(p => ({ ...p, commission_pct: Number(e.target.value) }))} style={inputSt} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Icon (emoji)</label>
                    <input value={catForm.icon} onChange={e => setCatForm(p => ({ ...p, icon: e.target.value }))} placeholder="📦" style={inputSt} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={saveCategory} disabled={!catForm.name || saving}
                    style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "#7c3aed", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    {saving ? "Saving…" : editCatId ? "Update" : "Create"}
                  </button>
                  <button onClick={() => { setShowCatForm(false); setEditCatId(null); setCatForm(BLANK_CAT); }}
                    style={{ padding: "9px 20px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
              <table style={{ width: "100%", fontSize: 13 }}>
                <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <TH>Category</TH><TH>Slug</TH><TH>Commission</TH><TH>Status</TH><TH>Actions</TH>
                </tr></thead>
                <tbody>
                  {categories.map(cat => (
                    <TR key={cat.id}>
                      <TD>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 20 }}>{cat.icon}</span>
                          <span style={{ fontWeight: 600, color: "var(--text)" }}>{cat.name}</span>
                        </div>
                      </TD>
                      <TD style={{ color: "var(--muted)", fontFamily: "monospace", fontSize: 12 }}>{cat.slug}</TD>
                      <TD>
                        <span style={{ fontWeight: 800, color: "#a78bfa", fontSize: 14 }}>{cat.commission_pct}%</span>
                      </TD>
                      <TD>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, color: cat.is_active ? "#10b981" : "var(--muted)", background: cat.is_active ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.04)" }}>
                          {cat.is_active ? "Active" : "Inactive"}
                        </span>
                      </TD>
                      <TD>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => { setCatForm({ name: cat.name, slug: cat.slug, commission_pct: cat.commission_pct, is_active: cat.is_active, icon: cat.icon }); setEditCatId(cat.id); setShowCatForm(true); }}
                            style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                            <Edit2 size={11} /> Edit
                          </button>
                          <button onClick={() => deleteCategory(cat.id)}
                            style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.08)", color: "#ef4444", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                            <Trash2 size={11} /> Delete
                          </button>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </tbody>
              </table>
              {categories.length === 0 && <div style={{ textAlign: "center", padding: "48px 0", color: "var(--muted)", fontSize: 13 }}>No categories yet. Add your first category.</div>}
            </div>
          </div>
        )}

        {/* RULES */}
        {tab === "rules" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>Commission Rates</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <RuleInput label="Marketplace Commission (%)" hint="% Soko takes from every product sale" value={rules.marketplace_commission} onChange={v => setRules(p => ({ ...p, marketplace_commission: v }))} />
                <RuleInput label="Service Commission (%)" hint="% Soko takes from service payments" value={rules.service_commission} onChange={v => setRules(p => ({ ...p, service_commission: v }))} />
                <RuleInput label="Auction Commission (%)" hint="% Soko takes from winning auction bids" value={rules.auction_commission} onChange={v => setRules(p => ({ ...p, auction_commission: v }))} />
              </div>
            </div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>Pricing & Limits</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <RuleInput label="Min Product Price (₦)" hint="Products below this price are rejected" value={rules.min_product_price} onChange={v => setRules(p => ({ ...p, min_product_price: v }))} prefix="₦" />
                <RuleInput label="Max Product Price (₦)" hint="Products above this price require review" value={rules.max_product_price} onChange={v => setRules(p => ({ ...p, max_product_price: v }))} prefix="₦" />
                <RuleInput label="Max Products Per Seller" hint="Listing cap per vendor account" value={rules.max_products_per_seller} onChange={v => setRules(p => ({ ...p, max_products_per_seller: v }))} />
              </div>
            </div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>Refund & Shipping</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <RuleInput label="Refund Window (days)" hint="Buyers can request a refund within this period" value={rules.refund_window_days} onChange={v => setRules(p => ({ ...p, refund_window_days: v }))} />
                <RuleInput label="Free Shipping Above (₦)" hint="Orders above this amount get free shipping" value={rules.shipping_free_above} onChange={v => setRules(p => ({ ...p, shipping_free_above: v }))} prefix="₦" />
                <RuleInput label="Escrow Hold (days)" hint="Days funds are held before releasing to seller" value={rules.escrow_hold_days} onChange={v => setRules(p => ({ ...p, escrow_hold_days: v }))} />
                <RuleInput label="Dispute Auto-Close (days)" hint="Disputes with no activity close after this" value={rules.dispute_auto_close_days} onChange={v => setRules(p => ({ ...p, dispute_auto_close_days: v }))} />
              </div>
            </div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>Summary Preview</p>
              {[
                { label: "Marketplace cut", value: `${rules.marketplace_commission}% of sale`, color: "#7c3aed" },
                { label: "Service cut", value: `${rules.service_commission}% of payment`, color: "#3b82f6" },
                { label: "Auction cut", value: `${rules.auction_commission}% of bid`, color: "#f59e0b" },
                { label: "Refund window", value: `${rules.refund_window_days} days`, color: "#10b981" },
                { label: "Escrow period", value: `${rules.escrow_hold_days} days`, color: "#06b6d4" },
              ].map(r => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 10, background: "var(--bg)", border: "1px solid var(--border)", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>{r.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: r.color }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REPORTS */}
        {tab === "reports" && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
            <table style={{ width: "100%", fontSize: 13 }}>
              <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
                <TH>Product</TH><TH>Reporter</TH><TH>Reason</TH><TH>Status</TH><TH>Date</TH><TH>Action</TH>
              </tr></thead>
              <tbody>
                {reports.map(r => (
                  <TR key={r.id}>
                    <TD style={{ fontWeight: 600, color: "var(--text)" }}>{r.product?.name ?? "—"}</TD>
                    <TD style={{ color: "var(--muted)" }}>@{r.reporter?.username ?? "—"}</TD>
                    <TD style={{ color: "var(--muted)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.reason}</TD>
                    <TD>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, color: r.status === "resolved" ? "#10b981" : "#f59e0b", background: r.status === "resolved" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)" }}>
                        {r.status}
                      </span>
                    </TD>
                    <TD style={{ color: "var(--muted)", fontSize: 12 }}>{tAgo(r.created_at)}</TD>
                    <TD>
                      {r.status !== "resolved" && <Btn onClick={() => resolveReport(r.id)} color="#10b981">Resolve</Btn>}
                    </TD>
                  </TR>
                ))}
              </tbody>
            </table>
            {reports.length === 0 && <div style={{ textAlign: "center", padding: "48px 0", color: "var(--muted)", fontSize: 13 }}>No product reports</div>}
          </div>
        )}
      </div>
    </div>
  );
}
