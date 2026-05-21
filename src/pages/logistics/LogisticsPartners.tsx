import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { Truck, Package, MapPin, CheckCircle, Plus, AlertTriangle } from "lucide-react";

type Tab = "partners" | "zones" | "rates" | "settings";

interface Partner {
  id: string; name: string; logo: string; apiKey: string; webhookUrl: string;
  status: "active" | "inactive" | "testing"; type: "bike" | "van" | "truck" | "express";
  cities: string[]; avgDeliveryHrs: number; commission: number; trackingEnabled: boolean;
}

const INITIAL_PARTNERS: Partner[] = [
  { id: "1", name: "Kwik Delivery", logo: "🏍️", apiKey: "kwik_live_****", webhookUrl: "https://api.kwik.delivery/webhooks/soko", status: "active", type: "bike", cities: ["Lagos", "Abuja", "PHC"], avgDeliveryHrs: 3, commission: 12, trackingEnabled: true },
  { id: "2", name: "Gokada Business", logo: "🛵", apiKey: "gokada_****", webhookUrl: "", status: "testing", type: "bike", cities: ["Lagos"], avgDeliveryHrs: 2, commission: 14, trackingEnabled: true },
  { id: "3", name: "DHL Express", logo: "✈️", apiKey: "dhl_****", webhookUrl: "https://api.dhl.com/webhooks/soko", status: "active", type: "express", cities: ["All Nigeria", "International"], avgDeliveryHrs: 48, commission: 8, trackingEnabled: true },
  { id: "4", name: "GIG Logistics", logo: "🚚", apiKey: "gig_****", webhookUrl: "", status: "inactive", type: "van", cities: ["Lagos", "Abuja", "PHC", "Kano", "Ibadan"], avgDeliveryHrs: 24, commission: 10, trackingEnabled: false },
  { id: "5", name: "Sendbox", logo: "📦", apiKey: "", webhookUrl: "", status: "inactive", type: "van", cities: ["Lagos"], avgDeliveryHrs: 12, commission: 11, trackingEnabled: false },
];

const DELIVERY_ZONES = [
  { zone: "Lagos Island", cities: ["Eko", "Lagos Island", "Victoria Island", "Ikoyi", "Lekki Phase 1"], rate: 1500, eta: "1–2 hrs" },
  { zone: "Lagos Mainland", cities: ["Surulere", "Yaba", "Ikeja", "Ojodu", "Oshodi"], rate: 1800, eta: "2–4 hrs" },
  { zone: "Lagos Outskirts", cities: ["Badagry", "Epe", "Ikorodu", "Ajah", "Sangotedo"], rate: 2500, eta: "4–6 hrs" },
  { zone: "Abuja FCT", cities: ["Wuse", "Garki", "Maitama", "Gwarinpa", "Apo"], rate: 2200, eta: "3–5 hrs" },
  { zone: "Port Harcourt", cities: ["GRA", "Trans-Amadi", "Rumuola", "Diobu"], rate: 2000, eta: "3–4 hrs" },
  { zone: "Other States", cities: ["Kano", "Ibadan", "Enugu", "Kaduna", "Benin City"], rate: 3500, eta: "24–48 hrs" },
];

const STATUS_COLORS: Record<string, string> = {
  active: "#10b981", inactive: "#6b7280", testing: "#f59e0b"
};

const TYPE_LABELS: Record<string, string> = {
  bike: "🏍️ Bike", van: "🚐 Van", truck: "🚛 Truck", express: "✈️ Express"
};

export function LogisticsPartners() {
  const [tab, setTab] = useState<Tab>("partners");
  const [partners, setPartners] = useState<Partner[]>(INITIAL_PARTNERS);
  const [showAdd, setShowAdd] = useState(false);
  const [settings, setSettings] = useState({
    freeShippingThreshold: 15000,
    defaultPickupTime: 24,
    autoAssignCourier: true,
    preferBikeForSmall: true,
    escrowHoldDays: 3,
    disputeAutoCloseDays: 14,
    trackingUpdateIntervalMins: 15,
  });
  const [saving, setSaving] = useState(false);
  const [newPartner, setNewPartner] = useState<Partial<Partner>>({ name: "", apiKey: "", webhookUrl: "", type: "bike", cities: [], commission: 10, avgDeliveryHrs: 4, trackingEnabled: false, status: "testing" });

  const activePartners = partners.filter(p => p.status === "active").length;
  const totalCities = [...new Set(partners.filter(p => p.status === "active").flatMap(p => p.cities))].length;

  function toggleStatus(id: string) {
    setPartners(prev => prev.map(p => p.id === id
      ? { ...p, status: p.status === "active" ? "inactive" : "active" }
      : p
    ));
  }

  async function saveSettings() {
    setSaving(true);
    await supabase.from("app_config").upsert({ key: "logistics_settings", value: settings });
    setSaving(false);
  }

  function addPartner() {
    if (!newPartner.name) return;
    setPartners(prev => [{
      id: Date.now().toString(),
      name: newPartner.name!,
      logo: "📦",
      apiKey: newPartner.apiKey ?? "",
      webhookUrl: newPartner.webhookUrl ?? "",
      status: (newPartner.apiKey ? "testing" : "inactive") as "active" | "inactive" | "testing",
      type: (newPartner.type ?? "van") as "bike" | "van" | "truck" | "express",
      cities: [],
      avgDeliveryHrs: newPartner.avgDeliveryHrs ?? 24,
      commission: newPartner.commission ?? 10,
      trackingEnabled: false,
    }, ...prev]);
    setShowAdd(false);
  }

  const inp = (val: string | number, onChange: (v: string) => void, type = "text") => ({
    value: val, type,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
    style: { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13 } as React.CSSProperties,
  });

  return (
    <div>
      <PageHeader title="Logistics Partners" sub="Configure delivery partners, shipping zones, rates and tracking integrations">
        <button onClick={() => setShowAdd(true)} style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#7c3aed,#ec4899)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={14} /> Add Partner
        </button>
      </PageHeader>

      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          <StatCard label="Active Partners"   value={activePartners}                         icon={Truck}       color="#7c3aed" />
          <StatCard label="Cities Covered"    value={totalCities}                             icon={MapPin}      color="#3b82f6" />
          <StatCard label="Deliveries (30d)"  value="4,820"                                   icon={Package}     color="#10b981" change="+18%" up />
          <StatCard label="Avg Delivery Time" value="3.2 hrs"                                 icon={CheckCircle} color="#f59e0b" change="-12min" up />
        </div>

        <div style={{ display: "flex", gap: 4, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 4, width: "fit-content" }}>
          {(["partners","zones","rates","settings"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: tab === t ? "#7c3aed" : "transparent", color: tab === t ? "#fff" : "var(--muted)", textTransform: "capitalize" }}>
              {t}
            </button>
          ))}
        </div>

        {tab === "partners" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {partners.map(p => (
              <div key={p.id} style={{ background: "var(--surface)", border: `1px solid ${p.status !== "inactive" ? `${STATUS_COLORS[p.status]}22` : "var(--border)"}`, borderRadius: 14, padding: "18px 22px", display: "flex", alignItems: "center", gap: 18 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{p.logo}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{p.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, color: STATUS_COLORS[p.status], background: `${STATUS_COLORS[p.status]}18`, textTransform: "capitalize" }}>{p.status}</span>
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>{TYPE_LABELS[p.type]}</span>
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--muted)" }}>
                    <span>📍 {p.cities.slice(0, 3).join(", ")}{p.cities.length > 3 ? ` +${p.cities.length - 3} more` : ""}</span>
                    <span>⏱ ~{p.avgDeliveryHrs}hrs avg</span>
                    <span>💰 {p.commission}% commission to Soko</span>
                    <span>📡 {p.trackingEnabled ? "Live tracking" : "No tracking"}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {!p.apiKey && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#f59e0b" }}><AlertTriangle size={11} /> No API key</span>}
                  <button onClick={() => toggleStatus(p.id)} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${STATUS_COLORS[p.status]}44`, background: `${STATUS_COLORS[p.status]}12`, color: STATUS_COLORS[p.status], fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    {p.status === "active" ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "zones" && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Delivery Zones & Coverage</span>
            </div>
            <table style={{ width: "100%", fontSize: 13 }}>
              <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Zone","Cities Covered","Base Rate (₦)","Est. Delivery","Partners Available"].map(h => (
                  <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {DELIVERY_ZONES.map(z => (
                  <tr key={z.zone} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--text)" }}>{z.zone}</td>
                    <td style={{ padding: "12px 16px", color: "var(--muted)", fontSize: 12 }}>{z.cities.join(", ")}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#10b981" }}>₦{z.rate.toLocaleString()}</td>
                    <td style={{ padding: "12px 16px", color: "var(--muted)" }}>{z.eta}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {partners.filter(p => p.status === "active" && (p.cities.some(c => z.cities.some(zc => c.includes(zc) || zc.includes(c))) || p.cities.includes("All Nigeria"))).map(p => (
                          <span key={p.id} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: "rgba(124,58,237,0.1)", color: "#a78bfa" }}>{p.logo} {p.name}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "rates" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>Shipping Rate Matrix</p>
              {[
                { label: "Intra-City (same city)", rate: "₦1,200–₦2,500", eta: "1–4 hrs" },
                { label: "Inter-City (different city)", rate: "₦2,500–₦4,500", eta: "12–48 hrs" },
                { label: "Bulky Items (>10kg)", rate: "₦4,500–₦8,000", eta: "24–72 hrs" },
                { label: "Express Delivery", rate: "₦3,500–₦6,000", eta: "1–3 hrs" },
                { label: "International Shipping", rate: "₦15,000+", eta: "3–7 days" },
              ].map(r => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 13, color: "var(--text)" }}>{r.label}</span>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#7c3aed" }}>{r.rate}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{r.eta}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>Special Conditions</p>
              {[
                { label: "Free Shipping Threshold", value: `₦${settings.freeShippingThreshold.toLocaleString()}+`, color: "#10b981", desc: "Orders above this ship free (platform absorbs cost)" },
                { label: "Seller-Paid Shipping Option", value: "Enabled", color: "#7c3aed", desc: "Sellers can offer free shipping from their margin" },
                { label: "Soko Flash Sale Shipping", value: "₦500 flat", color: "#f59e0b", desc: "Discounted rate during flash sale events" },
                { label: "Return Shipping", value: "Buyer pays", color: "#6b7280", desc: "Unless item is defective (platform covers)" },
                { label: "COD Surcharge", value: "₦500", color: "#ec4899", desc: "Cash on delivery orders incur extra fee" },
              ].map(c => (
                <div key={c.label} style={{ marginBottom: 12, padding: "12px 16px", background: "var(--bg)", borderRadius: 10, border: `1px solid ${c.color}22` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{c.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: c.color }}>{c.value}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{c.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "settings" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>Order Fulfillment Settings</p>
              {[
                { label: "Free Shipping Threshold (₦)", key: "freeShippingThreshold" as const, type: "number" },
                { label: "Default Pickup Time (hours)", key: "defaultPickupTime" as const, type: "number" },
                { label: "Escrow Hold After Delivery (days)", key: "escrowHoldDays" as const, type: "number" },
                { label: "Dispute Auto-Close (days)", key: "disputeAutoCloseDays" as const, type: "number" },
                { label: "Tracking Update Interval (mins)", key: "trackingUpdateIntervalMins" as const, type: "number" },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 6 }}>{f.label}</label>
                  <input {...inp(settings[f.key], v => setSettings(p => ({ ...p, [f.key]: Number(v) })), f.type)} />
                </div>
              ))}
            </div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>Auto-Assignment Rules</p>
              {[
                { label: "Auto-assign courier to orders", key: "autoAssignCourier" as const, desc: "Platform selects best available courier automatically" },
                { label: "Prefer bike for orders <3kg", key: "preferBikeForSmall" as const, desc: "Route small orders to bike couriers for speed" },
              ].map(toggle => (
                <div key={toggle.key} style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "var(--bg)", borderRadius: 10, border: "1px solid var(--border)" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{toggle.label}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{toggle.desc}</div>
                  </div>
                  <div onClick={() => setSettings(p => ({ ...p, [toggle.key]: !p[toggle.key] }))} style={{ width: 40, height: 22, borderRadius: 11, background: settings[toggle.key] ? "#7c3aed" : "rgba(255,255,255,0.1)", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0, marginLeft: 16 }}>
                    <div style={{ position: "absolute", top: 3, left: settings[toggle.key] ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 24, padding: "16px", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#10b981", marginBottom: 8 }}>🔗 Integration Status</div>
                {partners.map(p => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
                    <span>{p.logo} {p.name}</span>
                    <span style={{ color: p.apiKey ? "#10b981" : "#ef4444", fontWeight: 700 }}>{p.apiKey ? "✓ API Connected" : "✗ No API Key"}</span>
                  </div>
                ))}
              </div>

              <button onClick={saveSettings} disabled={saving} style={{ width: "100%", marginTop: 20, padding: "10px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#7c3aed,#ec4899)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                {saving ? "Saving…" : "Save Settings"}
              </button>
            </div>
          </div>
        )}
      </div>

      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 32, width: 420 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 24 }}>Add Logistics Partner</h3>
            {[
              { label: "Company Name", key: "name" },
              { label: "API Key (optional)", key: "apiKey" },
              { label: "Webhook URL (optional)", key: "webhookUrl" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 6 }}>{f.label}</label>
                <input value={(newPartner as any)[f.key] ?? ""} onChange={e => setNewPartner(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13 }} />
              </div>
            ))}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 6 }}>Vehicle Type</label>
              <select value={newPartner.type} onChange={e => setNewPartner(p => ({ ...p, type: e.target.value as any }))}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13 }}>
                <option value="bike">Bike / Motorcycle</option>
                <option value="van">Van / Car</option>
                <option value="truck">Truck</option>
                <option value="express">Air / Express</option>
              </select>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 6 }}>Soko Commission (%)</label>
              <input value={newPartner.commission ?? 10} type="number" min={0} max={30} onChange={e => setNewPartner(p => ({ ...p, commission: Number(e.target.value) }))}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13 }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={addPartner} disabled={!newPartner.name} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#7c3aed,#ec4899)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Add Partner</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
