import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { Star, CheckCircle, Lock, Users, TrendingUp } from "lucide-react";

interface CreatorLevel {
  id: string;
  name: string;
  slug: string;
  badge: string;
  color: string;
  description: string;
  requirements: {
    minFollowers: number;
    minStreams: number;
    minWatchHours: number;
    minGiftsReceived: number;
    kycRequired: boolean;
    manualApproval: boolean;
  };
  perks: string[];
  monetizationEnabled: boolean;
  canReceiveGifts: boolean;
  canGoLive: boolean;
  canUseOBS: boolean;
  canRunAds: boolean;
  maxWithdrawalPerDay: number;
  commissionRate: number;
}

const DEFAULT_LEVELS: CreatorLevel[] = [
  {
    id: "new", name: "New Creator", slug: "new_creator", badge: "🌱", color: "#6b7280",
    description: "Starting out — can post content and build an audience.",
    requirements: { minFollowers: 0, minStreams: 0, minWatchHours: 0, minGiftsReceived: 0, kycRequired: false, manualApproval: false },
    perks: ["Post videos & images", "Follow and like", "Comment on content", "Join live streams as viewer"],
    monetizationEnabled: false, canReceiveGifts: false, canGoLive: false, canUseOBS: false, canRunAds: false,
    maxWithdrawalPerDay: 0, commissionRate: 0,
  },
  {
    id: "verified", name: "Verified Creator", slug: "verified_creator", badge: "✅", color: "#3b82f6",
    description: "Verified identity — can start going live and receiving basic gifts.",
    requirements: { minFollowers: 100, minStreams: 0, minWatchHours: 0, minGiftsReceived: 0, kycRequired: true, manualApproval: false },
    perks: ["Go live (camera & voice)", "Receive gifts", "Verified badge on profile", "Access to creator dashboard"],
    monetizationEnabled: false, canReceiveGifts: true, canGoLive: true, canUseOBS: false, canRunAds: false,
    maxWithdrawalPerDay: 5000, commissionRate: 70,
  },
  {
    id: "monetized", name: "Monetized Creator", slug: "monetized_creator", badge: "💰", color: "#10b981",
    description: "Earning from the platform — subscriptions and full gift access unlocked.",
    requirements: { minFollowers: 1000, minStreams: 10, minWatchHours: 50, minGiftsReceived: 100, kycRequired: true, manualApproval: false },
    perks: ["Creator subscriptions", "Full gift gallery access", "Live deals & promotions", "Basic analytics dashboard", "Product live selling"],
    monetizationEnabled: true, canReceiveGifts: true, canGoLive: true, canUseOBS: false, canRunAds: false,
    maxWithdrawalPerDay: 50000, commissionRate: 75,
  },
  {
    id: "pro", name: "Pro Creator", slug: "pro_creator", badge: "⚡", color: "#f59e0b",
    description: "Professional level — advanced tools, OBS support, and higher limits.",
    requirements: { minFollowers: 10000, minStreams: 50, minWatchHours: 500, minGiftsReceived: 1000, kycRequired: true, manualApproval: false },
    perks: ["OBS / RTMP streaming", "Exclusive gift gallery", "Co-host & battle access", "Advanced creator analytics", "Creator fund access", "Priority support"],
    monetizationEnabled: true, canReceiveGifts: true, canGoLive: true, canUseOBS: true, canRunAds: true,
    maxWithdrawalPerDay: 200000, commissionRate: 80,
  },
  {
    id: "partner", name: "Partner Creator", slug: "partner_creator", badge: "🏆", color: "#7c3aed",
    description: "Top-tier partner — manually approved, highest rates, all features unlocked.",
    requirements: { minFollowers: 50000, minStreams: 200, minWatchHours: 2000, minGiftsReceived: 5000, kycRequired: true, manualApproval: true },
    perks: ["All Pro perks", "Manual partner approval", "Dedicated account manager", "Custom gift animations", "Revenue share bonus", "Exclusive partner badge", "No daily withdrawal limit"],
    monetizationEnabled: true, canReceiveGifts: true, canGoLive: true, canUseOBS: true, canRunAds: true,
    maxWithdrawalPerDay: 0, commissionRate: 85,
  },
];

export function CreatorLevels() {
  const [levels, setLevels] = useState<CreatorLevel[]>(DEFAULT_LEVELS);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update(id: string, field: string, value: any) {
    setLevels(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  }

  function updateReq(id: string, field: string, value: any) {
    setLevels(prev => prev.map(l => l.id === id ? { ...l, requirements: { ...l.requirements, [field]: value } } : l));
  }

  async function saveAll() {
    setSaving(true);
    await supabase.from("app_config").upsert({ key: "creator_levels", value: levels });
    setSaving(false);
  }

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <div onClick={onChange} style={{ width: 38, height: 20, borderRadius: 10, background: value ? "#7c3aed" : "rgba(255,255,255,0.1)", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 2, left: value ? 20 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
    </div>
  );

  const inp = (val: any, onChange: (v: string) => void, type = "text") => ({
    value: val, type,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
    style: { width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13 } as React.CSSProperties,
  });

  return (
    <div>
      <PageHeader title="Creator Level Management" sub="Define requirements, perks and monetization rules for each creator tier">
        <button onClick={saveAll} disabled={saving} style={{ padding: "8px 18px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#7c3aed,#ec4899)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          {saving ? "Saving…" : "Save All Levels"}
        </button>
      </PageHeader>

      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
          {levels.map(l => (
            <div key={l.id} style={{ padding: "14px 16px", background: "var(--surface)", border: `1px solid ${l.color}30`, borderRadius: 14, textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{l.badge}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: l.color }}>{l.name}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{l.requirements.minFollowers.toLocaleString()}+ followers</div>
            </div>
          ))}
        </div>

        {levels.map(l => (
          <div key={l.id} style={{ background: "var(--surface)", border: `1px solid ${editing === l.id ? l.color + "44" : "var(--border)"}`, borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "16px 22px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", borderBottom: editing === l.id ? "1px solid var(--border)" : "none" }} onClick={() => setEditing(editing === l.id ? null : l.id)}>
              <span style={{ fontSize: 28 }}>{l.badge}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{l.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, color: l.color, background: `${l.color}18` }}>{l.slug}</span>
                  {l.monetizationEnabled && <span style={{ fontSize: 11, color: "#10b981" }}>💰 Monetized</span>}
                  {l.requirements.manualApproval && <span style={{ fontSize: 11, color: "#f59e0b" }}>🔒 Manual Approval</span>}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{l.description}</div>
              </div>
              <div style={{ fontSize: 20, color: "var(--muted)" }}>{editing === l.id ? "▲" : "▼"}</div>
            </div>

            {editing === l.id && (
              <div style={{ padding: "20px 22px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                {/* Requirements */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>Requirements to Reach This Level</div>
                  {[
                    { label: "Min Followers", field: "minFollowers" },
                    { label: "Min Live Streams", field: "minStreams" },
                    { label: "Min Watch Hours", field: "minWatchHours" },
                    { label: "Min Gifts Received", field: "minGiftsReceived" },
                  ].map(f => (
                    <div key={f.field} style={{ marginBottom: 10 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>{f.label}</label>
                      <input {...inp((l.requirements as any)[f.field], v => updateReq(l.id, f.field, Number(v)), "number")} min={0} />
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 14, marginTop: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Toggle value={l.requirements.kycRequired} onChange={() => updateReq(l.id, "kycRequired", !l.requirements.kycRequired)} />
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>KYC Required</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Toggle value={l.requirements.manualApproval} onChange={() => updateReq(l.id, "manualApproval", !l.requirements.manualApproval)} />
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>Manual Approval</span>
                    </div>
                  </div>
                </div>

                {/* Permissions & Limits */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>Permissions & Limits</div>
                  {[
                    { label: "Monetization Enabled", field: "monetizationEnabled" },
                    { label: "Can Receive Gifts", field: "canReceiveGifts" },
                    { label: "Can Go Live", field: "canGoLive" },
                    { label: "Can Use OBS/RTMP", field: "canUseOBS" },
                    { label: "Can Run Ads", field: "canRunAds" },
                  ].map(f => (
                    <div key={f.field} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ fontSize: 13, color: "var(--muted)" }}>{f.label}</span>
                      <Toggle value={(l as any)[f.field]} onChange={() => update(l.id, f.field, !(l as any)[f.field])} />
                    </div>
                  ))}
                  <div style={{ marginTop: 14 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>Creator Revenue Share (%)</label>
                    <input {...inp(l.commissionRate, v => update(l.id, "commissionRate", Number(v)), "number")} min={0} max={100} />
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>Max Daily Withdrawal (₦) — 0 = unlimited</label>
                    <input {...inp(l.maxWithdrawalPerDay, v => update(l.id, "maxWithdrawalPerDay", Number(v)), "number")} min={0} />
                  </div>
                </div>

                {/* Perks */}
                <div style={{ gridColumn: "1/-1" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>Perks (one per line)</div>
                  <textarea value={l.perks.join("\n")} onChange={e => update(l.id, "perks", e.target.value.split("\n").filter(Boolean))}
                    rows={4} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13, resize: "vertical" }} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
