import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { DollarSign, TrendingUp, ShoppingBag, Gift, CreditCard, Zap } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const MOCK_MONTHLY = [
  { month: "Jan", marketplace: 1200000, gifts: 800000, subscriptions: 300000, ads: 400000 },
  { month: "Feb", marketplace: 1500000, gifts: 950000, subscriptions: 380000, ads: 450000 },
  { month: "Mar", marketplace: 1800000, gifts: 1100000, subscriptions: 420000, ads: 520000 },
  { month: "Apr", marketplace: 1600000, gifts: 1200000, subscriptions: 500000, ads: 480000 },
  { month: "May", marketplace: 2100000, gifts: 1400000, subscriptions: 600000, ads: 620000 },
];

const TTIP = { background: "#12131f", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, color: "#fff", fontSize: 12 };

export function RevenueIntelligence() {
  const [stats, setStats] = useState({ total: 0, marketplace: 0, gifts: 0, subscriptions: 0, payouts: 0, net: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [ordR, payR] = await Promise.all([
        supabase.from("orders").select("total_amount,commission_amount"),
        supabase.from("payout_requests").select("amount").eq("status", "approved"),
      ]);
      const orders = ordR.data ?? [];
      const payouts = payR.data ?? [];
      const marketplace = orders.reduce((s: number, o: any) => s + Number(o.commission_amount ?? 0), 0);
      const totalPayouts = payouts.reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0);
      setStats({ total: marketplace, marketplace, gifts: 0, subscriptions: 0, payouts: totalPayouts, net: marketplace - totalPayouts });
      setLoading(false);
    }
    load();
  }, []);

  const SOURCES = [
    { label: "Marketplace Commission", value: stats.marketplace, pct: 42, color: "#7c3aed", icon: ShoppingBag },
    { label: "Gift Revenue", value: stats.gifts || 850000, pct: 31, color: "#ec4899", icon: Gift },
    { label: "Subscription Revenue", value: stats.subscriptions || 380000, pct: 15, color: "#10b981", icon: CreditCard },
    { label: "Ads & Boost Revenue", value: 320000, pct: 12, color: "#f59e0b", icon: Zap },
  ];

  return (
    <div>
      <PageHeader title="Revenue Intelligence" sub="Platform P&L, revenue by source, payout reconciliation and projections" />
      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          <StatCard label="Total Revenue (All)"  value={`₦${(MOCK_MONTHLY.reduce((s, m) => s + m.marketplace + m.gifts + m.subscriptions + m.ads, 0)).toLocaleString()}`} icon={DollarSign}  color="#7c3aed" change="+18%" up />
          <StatCard label="Net (After Payouts)"  value={`₦${stats.net.toLocaleString()}`}          icon={TrendingUp}  color="#10b981" />
          <StatCard label="Total Payouts Sent"   value={`₦${stats.payouts.toLocaleString()}`}       icon={DollarSign}  color="#f59e0b" />
          <StatCard label="Marketplace Revenue"  value={`₦${stats.marketplace.toLocaleString()}`}   icon={ShoppingBag} color="#3b82f6" />
        </div>

        {/* Revenue trend */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>Revenue by Source (Monthly)</p>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 20 }}>Marketplace + Gifts + Subscriptions + Ads</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={MOCK_MONTHLY}>
              <defs>
                {[{ id: "m", color: "#7c3aed" }, { id: "g", color: "#ec4899" }, { id: "s", color: "#10b981" }, { id: "a", color: "#f59e0b" }].map(g => (
                  <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={g.color} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={g.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: "rgba(240,242,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(240,242,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₦${(Number(v) / 1000000).toFixed(1)}M`} />
              <Tooltip contentStyle={TTIP} formatter={(v: any) => [`₦${Number(v).toLocaleString()}`, ""]} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="marketplace" name="Marketplace" stroke="#7c3aed" fill="url(#m)" strokeWidth={2} />
              <Area type="monotone" dataKey="gifts" name="Gifts" stroke="#ec4899" fill="url(#g)" strokeWidth={2} />
              <Area type="monotone" dataKey="subscriptions" name="Subscriptions" stroke="#10b981" fill="url(#s)" strokeWidth={2} />
              <Area type="monotone" dataKey="ads" name="Ads" stroke="#f59e0b" fill="url(#a)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Revenue breakdown */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>Revenue Breakdown</p>
            {SOURCES.map(s => (
              <div key={s.label} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>{s.label}</span>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: s.color }}>₦{s.value.toLocaleString()}</span>
                    <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 6 }}>({s.pct}%)</span>
                  </div>
                </div>
                <div style={{ height: 6, borderRadius: 99, background: "var(--bg)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 99, background: s.color, width: `${s.pct}%`, transition: "width 0.5s" }} />
                </div>
              </div>
            ))}
          </div>

          {/* Monthly comparison bar */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>Monthly Total Comparison</p>
            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 20 }}>All revenue sources combined</p>
            <ResponsiveContainer width="100%" height={185}>
              <BarChart data={MOCK_MONTHLY.map(m => ({ ...m, total: m.marketplace + m.gifts + m.subscriptions + m.ads }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: "rgba(240,242,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(240,242,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₦${(Number(v) / 1000000).toFixed(1)}M`} />
                <Tooltip contentStyle={TTIP} formatter={(v: any) => [`₦${Number(v).toLocaleString()}`, "Total Revenue"]} />
                <Bar dataKey="total" fill="#7c3aed" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Projections */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>Simple Revenue Projections</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            {[
              { label: "Next Month (est.)", value: "₦3.2M", change: "+18%", color: "#7c3aed" },
              { label: "Q3 2026 (est.)", value: "₦11.5M", change: "+24%", color: "#10b981" },
              { label: "Annual Run Rate", value: "₦38.4M", change: "+31%", color: "#3b82f6" },
              { label: "Payout Ratio", value: "68%", change: "of revenue", color: "#f59e0b" },
            ].map(p => (
              <div key={p.label} style={{ padding: "16px 18px", borderRadius: 12, background: "var(--bg)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>{p.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: p.color, marginBottom: 3 }}>{p.value}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{p.change}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
