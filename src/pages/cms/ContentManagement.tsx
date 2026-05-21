import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { Layout, Star, Bell, HelpCircle, Save, Plus, Trash2, Eye } from "lucide-react";

type Tab = "banners" | "featured" | "announcements" | "faq";

interface Banner { id: string; title: string; image_url: string; link: string; is_active: boolean; position: string; }
interface FAQ { id: string; question: string; answer: string; category: string; order: number; }

const inputSt = { width: "100%", height: 40, padding: "0 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 14, outline: "none" } as React.CSSProperties;

export function ContentManagement() {
  const [tab, setTab] = useState<Tab>("banners");
  const [banners, setBanners] = useState<Banner[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [featured, setFeatured] = useState<any>({ creators: [], products: [] });
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Banner form
  const [bForm, setBForm] = useState({ title: "", image_url: "", link: "", position: "home_top", is_active: true });
  // FAQ form
  const [fForm, setFForm] = useState({ question: "", answer: "", category: "General", order: 0 });
  // Announcement form
  const [aForm, setAForm] = useState({ title: "", body: "", type: "info", expires_at: "" });

  useEffect(() => {
    async function load() {
      const [bR, fR, aR] = await Promise.all([
        supabase.from("cms_banners").select("*").order("created_at", { ascending: false }),
        supabase.from("cms_faqs").select("*").order("order"),
        supabase.from("cms_announcements").select("*").order("created_at", { ascending: false }),
      ]);
      setBanners(bR.data ?? []);
      setFaqs(fR.data ?? []);
      setAnnouncements(aR.data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function addBanner() {
    setSaving(true);
    const { data } = await supabase.from("cms_banners").insert(bForm).select().single();
    if (data) setBanners(prev => [data, ...prev]);
    setBForm({ title: "", image_url: "", link: "", position: "home_top", is_active: true });
    setSaving(false);
  }

  async function toggleBanner(id: string, active: boolean) {
    await supabase.from("cms_banners").update({ is_active: !active }).eq("id", id);
    setBanners(prev => prev.map(b => b.id === id ? { ...b, is_active: !active } : b));
  }

  async function deleteBanner(id: string) {
    await supabase.from("cms_banners").delete().eq("id", id);
    setBanners(prev => prev.filter(b => b.id !== id));
  }

  async function addFAQ() {
    setSaving(true);
    const { data } = await supabase.from("cms_faqs").insert(fForm).select().single();
    if (data) setFaqs(prev => [...prev, data].sort((a, b) => a.order - b.order));
    setFForm({ question: "", answer: "", category: "General", order: 0 });
    setSaving(false);
  }

  async function deleteFAQ(id: string) {
    await supabase.from("cms_faqs").delete().eq("id", id);
    setFaqs(prev => prev.filter(f => f.id !== id));
  }

  async function addAnnouncement() {
    setSaving(true);
    const { data } = await supabase.from("cms_announcements").insert(aForm).select().single();
    if (data) setAnnouncements(prev => [data, ...prev]);
    setAForm({ title: "", body: "", type: "info", expires_at: "" });
    setSaving(false);
  }

  const POSITIONS = ["home_top", "home_mid", "marketplace_top", "live_top", "login_screen"];
  const FAQ_CATS = ["General", "Payments", "Orders", "Live", "Creators", "Account", "Safety"];
  const ANNTYPE_STYLE: Record<string, { color: string; bg: string }> = {
    info:    { color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
    warning: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
    success: { color: "#10b981", bg: "rgba(16,185,129,0.1)" },
    danger:  { color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  };

  const TABS = [{ key: "banners", label: "Banners", icon: <Layout size={13} /> }, { key: "featured", label: "Featured", icon: <Star size={13} /> }, { key: "announcements", label: "Announcements", icon: <Bell size={13} /> }, { key: "faq", label: "FAQ", icon: <HelpCircle size={13} /> }];

  return (
    <div>
      <PageHeader title="Content Management" sub="Banners, featured content, announcements and FAQ — control what users see without deploying code" />
      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", gap: 4, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 4, width: "fit-content" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as Tab)} style={{ padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: tab === t.key ? "#7c3aed" : "transparent", color: tab === t.key ? "#fff" : "var(--muted)", display: "flex", alignItems: "center", gap: 5 }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* BANNERS */}
        {tab === "banners" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 22 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 18 }}>Add New Banner</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div><label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 5 }}>Title</label><input value={bForm.title} onChange={e => setBForm(p => ({ ...p, title: e.target.value }))} placeholder="Summer Sale" style={inputSt} /></div>
                <div><label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 5 }}>Image URL</label><input value={bForm.image_url} onChange={e => setBForm(p => ({ ...p, image_url: e.target.value }))} placeholder="https://..." style={inputSt} /></div>
                <div><label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 5 }}>Link (optional)</label><input value={bForm.link} onChange={e => setBForm(p => ({ ...p, link: e.target.value }))} placeholder="/marketplace?sale=true" style={inputSt} /></div>
                <div><label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 5 }}>Position</label>
                  <select value={bForm.position} onChange={e => setBForm(p => ({ ...p, position: e.target.value }))} style={{ ...inputSt, height: 42 }}>
                    {POSITIONS.map(p => <option key={p} value={p}>{p.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={addBanner} disabled={!bForm.title || saving} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "#7c3aed", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <Plus size={13} /> Add Banner
              </button>
            </div>

            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
              {banners.length === 0 ? <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)", fontSize: 13 }}>No banners yet</div> : (
                <div>
                  {banners.map(b => (
                    <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ width: 60, height: 36, borderRadius: 8, background: "var(--bg)", overflow: "hidden", flexShrink: 0 }}>
                        {b.image_url && <img src={b.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{b.title}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>{b.position?.replace(/_/g, " ")} {b.link && `· ${b.link}`}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => toggleBanner(b.id, b.is_active)} style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${b.is_active ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`, background: b.is_active ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)", color: b.is_active ? "#ef4444" : "#10b981", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                          {b.is_active ? "Disable" : "Enable"}
                        </button>
                        <button onClick={() => deleteBanner(b.id)} style={{ padding: "5px 8px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.06)", color: "#ef4444", cursor: "pointer" }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* FEATURED */}
        {tab === "featured" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { key: "creators", label: "Featured Creators", table: "profiles", query: { is_verified: true }, fields: ["username", "avatar_url", "creator_level"] },
              { key: "products", label: "Featured Products", table: "products", query: { is_active: true }, fields: ["name", "price", "media_url"] },
            ].map(section => (
              <div key={section.key} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 22 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{section.label}</p>
                  <button style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                    <Plus size={11} /> Add
                  </button>
                </div>
                <div style={{ padding: "40px 0", textAlign: "center" }}>
                  <Star size={24} style={{ color: "var(--muted)", margin: "0 auto 10px" }} />
                  <p style={{ fontSize: 12, color: "var(--muted)" }}>Connect featured {section.key} from the main app database</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ANNOUNCEMENTS */}
        {tab === "announcements" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 22 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 18 }}>New Announcement</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div><label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 5 }}>Title</label><input value={aForm.title} onChange={e => setAForm(p => ({ ...p, title: e.target.value }))} placeholder="Platform Maintenance Notice" style={inputSt} /></div>
                <div><label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 5 }}>Message</label><textarea value={aForm.body} onChange={e => setAForm(p => ({ ...p, body: e.target.value }))} placeholder="Soko will be under maintenance..." rows={3} style={{ ...inputSt, height: "auto", padding: "10px 12px", resize: "vertical" }} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div><label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 5 }}>Type</label>
                    <select value={aForm.type} onChange={e => setAForm(p => ({ ...p, type: e.target.value }))} style={{ ...inputSt, height: 42 }}>
                      {["info", "warning", "success", "danger"].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                  </div>
                  <div><label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 5 }}>Expires At (optional)</label><input type="datetime-local" value={aForm.expires_at} onChange={e => setAForm(p => ({ ...p, expires_at: e.target.value }))} style={inputSt} /></div>
                </div>
                <button onClick={addAnnouncement} disabled={!aForm.title || saving} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "#7c3aed", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", width: "fit-content", display: "flex", alignItems: "center", gap: 6 }}>
                  <Plus size={13} /> Post Announcement
                </button>
              </div>
            </div>

            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
              {announcements.map(a => {
                const s = ANNTYPE_STYLE[a.type] ?? ANNTYPE_STYLE.info;
                return (
                  <div key={a.id} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 20, color: s.color, background: s.bg, flexShrink: 0, marginTop: 2, textTransform: "capitalize" }}>{a.type}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{a.title}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>{a.body}</div>
                    </div>
                  </div>
                );
              })}
              {announcements.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)", fontSize: 13 }}>No announcements</div>}
            </div>
          </div>
        )}

        {/* FAQ */}
        {tab === "faq" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 22 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 18 }}>Add FAQ</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div><label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 5 }}>Question</label><input value={fForm.question} onChange={e => setFForm(p => ({ ...p, question: e.target.value }))} placeholder="How do I withdraw my earnings?" style={inputSt} /></div>
                  <div><label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 5 }}>Category</label>
                    <select value={fForm.category} onChange={e => setFForm(p => ({ ...p, category: e.target.value }))} style={{ ...inputSt, height: 42 }}>
                      {FAQ_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div><label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 5 }}>Answer</label><textarea value={fForm.answer} onChange={e => setFForm(p => ({ ...p, answer: e.target.value }))} placeholder="Go to Wallet → Withdraw..." rows={3} style={{ ...inputSt, height: "auto", padding: "10px 12px", resize: "vertical" }} /></div>
                <button onClick={addFAQ} disabled={!fForm.question || !fForm.answer || saving} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "#7c3aed", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", width: "fit-content" }}>
                  Add FAQ
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {FAQ_CATS.map(cat => {
                const items = faqs.filter(f => f.category === cat);
                if (items.length === 0) return null;
                return (
                  <div key={cat} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
                    <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{cat}</div>
                    {items.map(f => (
                      <div key={f.id} style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>{f.question}</div>
                          <div style={{ fontSize: 12, color: "var(--muted)" }}>{f.answer}</div>
                        </div>
                        <button onClick={() => deleteFAQ(f.id)} style={{ padding: "5px 8px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.06)", color: "#ef4444", cursor: "pointer", flexShrink: 0 }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })}
              {faqs.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)", fontSize: 13 }}>No FAQs yet</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
