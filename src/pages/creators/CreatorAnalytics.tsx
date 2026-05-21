import { useState } from "react";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { Star, TrendingUp, DollarSign, Users, Eye, Heart, Gift, Video } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const TTIP = { background: "#12131f", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, color: "#fff", fontSize: 12 };

const MOCK_CREATORS = [
  { id: "1", name: "Chisom Okafor", username: "chisom_style", avatar: "👩🏾", tier: "Partner", followers: 84200, streams: 142, watchHours: 18400, gifts: 2840000, subscriptions: 380000, sales: 1200000, totalEarnings: 4420000, growth: 28, topCategory: "Fashion", avgViewers: 3200, peakViewers: 12800 },
  { id: "2", name: "Ngozi Williams", username: "ngozi_beauty", avatar: "👩🏽", tier: "Pro", followers: 42100, streams: 88, watchHours: 8200, gifts: 1240000, subscriptions: 180000, sales: 620000, totalEarnings: 2040000, growth: 18, topCategory: "Beauty", avgViewers: 1800, peakViewers: 6200 },
  { id: "3", name: "Emeka Nwosu", username: "emeka_tech", avatar: "👨🏿", tier: "Monetized", followers: 28500, streams: 64, watchHours: 5400, gifts: 420000, subscriptions: 95000, sales: 180000, totalEarnings: 695000, growth: 42, topCategory: "Electronics", avgViewers: 980, peakViewers: 3400 },
  { id: "4", name: "Tunde Fashola", username: "tunde_live", avatar: "👨🏾", tier: "Partner", followers: 115000, streams: 210, watchHours: 31200, gifts: 4200000, subscriptions: 620000, sales: 2800000, totalEarnings: 7620000, growth: 15, topCategory: "Marketplace", avgViewers: 5800, peakViewers: 22000 },
  { id: "5", name: "Amaka Eze", username: "amaka_kitchen", avatar: "👩🏿", tier: "Pro", followers: 31800, streams: 72, watchHours: 6100, gifts: 580000, subscriptions: 120000, sales: 340000, totalEarnings: 1040000, growth: 33, topCategory: "Food", avgViewers: 1200, peakViewers: 4800 },
];

const MONTHLY = [
  { month: "Jan", earnings: 2800000, gifts: 1200000, subscriptions: 280000, sales: 1320000 },
  { month: "Feb", earnings: 3400000, gifts: 1500000, subscriptions: 320000, sales: 1580000 },
  { month: "Mar", earnings: 4100000, gifts: 1800000, subscriptions: 380000, sales: 1920000 },
  { month: "Apr", earnings: 3800000, gifts: 1700000, subscriptions: 420000, sales: 1680000 },
  { month: "May", earnings: 5200000, gifts: 2200000, subscriptions: 520000, sales: 2480000 },
];

const TIER_COLORS: Record<string, string> = { Partner: "#f59e0b", Pro: "#7c3aed", Monetized: "#10b981", Verified: "#3b82f6", New: "#6b7280" };

export function CreatorAnalytics() {
  const [selected, setSelected] = useState<string | null>(null);
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");

  const creator = selected ? MOCK_CREATORS.find(c => c.id === selected) : null;
  const totalEarnings = MOCK_CREATORS.reduce((s, c) => s + c.totalEarnings, 0);
  const totalFollowers = MOCK_CREATORS.reduce((s, c) => s + c.followers, 0);
  const totalStreams = MOCK_CREATORS.reduce((s, c) => s + c.streams, 0);

  return (
    <div>
      <PageHeader title="Creator Analytics" sub="Individual creator performance, earnings breakdown, and growth metrics">
        <div style={{ display: "flex", gap: 4, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: 3 }}>
          {(["7d","30d","90d"] as const).map(r => (
            <button key={r} onClick={() => setRange(r)} style={{ padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: range === r ? "#7c3aed" : "transparent", color: range === r ? "#fff" : "var(--muted)" }}>{r}</button>
          ))}
        </div>
      </PageHeader>

      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          <StatCard label="Platform Creator Earnings" value={`₦${(totalEarnings/1000000).toFixed(1)}M`} icon={DollarSign} color="#7c3aed" change="+22%" up />
          <StatCard label="Total Followers"           value={totalFollowers.toLocaleString()}            icon={Users}      color="#10b981" change="+18%" up />
          <StatCard label="Live Streams (30d)"        value={totalStreams}                               icon={Video}      color="#3b82f6" change="+31%" up />
          <StatCard label="Active Creators"           value={MOCK_CREATORS.length}                      icon={Star}       color="#f59e0b" />
        </div>

        {/* Platform trend */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>Total Creator Earnings by Source</p>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 20 }}>Gifts + Subscriptions + Sales commissions (platform view)</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MONTHLY}>
              <defs>
                {[{ id: "g", color: "#ec4899" }, { id: "s", color: "#7c3aed" }, { id: "sl", color: "#10b981" }].map(g => (
                  <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={g.color} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={g.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: "rgba(240,242,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(240,242,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₦${(Number(v)/1000000).toFixed(1)}M`} />
              <Tooltip contentStyle={TTIP} formatter={(v: any) => [`₦${Number(v).toLocaleString()}`, ""]} />
              <Area type="monotone" dataKey="gifts" name="Gifts" stroke="#ec4899" fill="url(#g)" strokeWidth={2} />
              <Area type="monotone" dataKey="subscriptions" name="Subscriptions" stroke="#7c3aed" fill="url(#s)" strokeWidth={2} />
              <Area type="monotone" dataKey="sales" name="Sales" stroke="#10b981" fill="url(#sl)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 16, alignItems: "start" }}>
          {/* Creator list */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Top Creators</div>
            {[...MOCK_CREATORS].sort((a, b) => b.totalEarnings - a.totalEarnings).map((c, i) => (
              <div key={c.id} onClick={() => setSelected(selected === c.id ? null : c.id)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", borderBottom: "1px solid var(--border)", cursor: "pointer", background: selected === c.id ? "rgba(124,58,237,0.08)" : "transparent", borderLeft: selected === c.id ? "3px solid #7c3aed" : "3px solid transparent" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#cd7c32" : "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: i < 3 ? "#fff" : "var(--muted)", flexShrink: 0 }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{c.avatar}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>@{c.username}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: TIER_COLORS[c.tier] }}>{c.tier}</span>
                    <span style={{ fontSize: 10, color: "var(--muted)" }}>{(c.followers/1000).toFixed(1)}K followers</span>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#10b981" }}>₦{(c.totalEarnings/1000000).toFixed(1)}M</div>
                  <div style={{ fontSize: 10, color: c.growth > 25 ? "#10b981" : "var(--muted)" }}>+{c.growth}%</div>
                </div>
              </div>
            ))}
          </div>

          {/* Detail panel */}
          {creator ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Creator header */}
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24, display: "flex", alignItems: "center", gap: 18 }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: "linear-gradient(135deg,#7c3aed,#ec4899)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, flexShrink: 0 }}>{creator.avatar}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>{creator.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 12px", borderRadius: 20, color: TIER_COLORS[creator.tier], background: `${TIER_COLORS[creator.tier]}18` }}>{creator.tier}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 3 }}>@{creator.username} · Top category: {creator.topCategory}</div>
                  <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
                    {[
                      { label: "Followers", value: creator.followers.toLocaleString() },
                      { label: "Streams", value: creator.streams },
                      { label: "Watch Hrs", value: creator.watchHours.toLocaleString() },
                      { label: "Avg Viewers", value: creator.avgViewers.toLocaleString() },
                      { label: "Peak Viewers", value: creator.peakViewers.toLocaleString() },
                    ].map(m => (
                      <div key={m.label}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>{m.value}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "#10b981" }}>₦{(creator.totalEarnings/1000000).toFixed(2)}M</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>Total Earnings</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#10b981", marginTop: 4 }}>+{creator.growth}% growth</div>
                </div>
              </div>

              {/* Earnings breakdown */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {[
                  { label: "Gift Revenue", value: creator.gifts, color: "#ec4899", icon: "🎁" },
                  { label: "Subscriptions", value: creator.subscriptions, color: "#7c3aed", icon: "⭐" },
                  { label: "Sales Commission", value: creator.sales, color: "#10b981", icon: "🛒" },
                ].map(s => (
                  <div key={s.label} style={{ background: "var(--surface)", border: `1px solid ${s.color}22`, borderRadius: 14, padding: "16px 18px" }}>
                    <div style={{ fontSize: 18, marginBottom: 8 }}>{s.icon}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>₦{(s.value/1000).toFixed(0)}K</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                      {Math.round(s.value / creator.totalEarnings * 100)}% of total
                    </div>
                    <div style={{ height: 4, borderRadius: 99, background: "var(--bg)", overflow: "hidden", marginTop: 8 }}>
                      <div style={{ height: "100%", borderRadius: 99, background: s.color, width: `${Math.round(s.value / creator.totalEarnings * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Bar chart - monthly streams */}
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>Monthly Earnings Trend</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={MONTHLY.map(m => ({ ...m, forCreator: Math.round((m.gifts + m.subscriptions + m.sales) * (creator.totalEarnings / totalEarnings)) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" tick={{ fill: "rgba(240,242,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(240,242,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₦${(Number(v)/1000).toFixed(0)}K`} />
                    <Tooltip contentStyle={TTIP} formatter={(v: any) => [`₦${Number(v).toLocaleString()}`, "Earnings"]} />
                    <Bar dataKey="forCreator" fill="#7c3aed" radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 48, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
              <Star size={32} style={{ color: "rgba(255,255,255,0.1)" }} />
              <p style={{ color: "var(--muted)", fontSize: 14 }}>Select a creator to view detailed analytics</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
