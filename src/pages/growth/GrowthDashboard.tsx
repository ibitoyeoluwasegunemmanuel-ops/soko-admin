import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { TrendingUp, Users, UserPlus, Star, Repeat } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const TTIP = { background: "#12131f", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, color: "#fff", fontSize: 12 };

const DAILY = [
  { day: "May 14", newUsers: 142, activeUsers: 1820, creators: 28, sellers: 64, orders: 312, retention: 68 },
  { day: "May 15", newUsers: 189, activeUsers: 2100, creators: 34, sellers: 71, orders: 398, retention: 71 },
  { day: "May 16", newUsers: 156, activeUsers: 1950, creators: 29, sellers: 68, orders: 341, retention: 69 },
  { day: "May 17", newUsers: 214, activeUsers: 2340, creators: 41, sellers: 82, orders: 452, retention: 73 },
  { day: "May 18", newUsers: 198, activeUsers: 2280, creators: 38, sellers: 79, orders: 421, retention: 72 },
  { day: "May 19", newUsers: 267, activeUsers: 2680, creators: 52, sellers: 94, orders: 524, retention: 75 },
  { day: "May 20", newUsers: 301, activeUsers: 2920, creators: 58, sellers: 102, orders: 612, retention: 77 },
  { day: "May 21", newUsers: 284, activeUsers: 2810, creators: 55, sellers: 98, orders: 588, retention: 76 },
];

const CHANNELS = [
  { channel: "Organic / Word of Mouth", users: 3840, pct: 42, color: "#7c3aed" },
  { channel: "Referral Program", users: 2190, pct: 24, color: "#ec4899" },
  { channel: "Instagram / TikTok Ads", users: 1460, pct: 16, color: "#10b981" },
  { channel: "Creator Audience", users: 920, pct: 10, color: "#f59e0b" },
  { channel: "Google / SEO", users: 640, pct: 7, color: "#3b82f6" },
  { channel: "Other", users: 90, pct: 1, color: "#6b7280" },
];

const FUNNEL = [
  { stage: "App Opened", value: 12480, color: "#7c3aed" },
  { stage: "Registered", value: 9140, color: "#a78bfa" },
  { stage: "Completed Profile", value: 6820, color: "#ec4899" },
  { stage: "First Browse", value: 5640, color: "#f9a8d4" },
  { stage: "First Purchase / Gift", value: 2180, color: "#10b981" },
  { stage: "7-day Retained", value: 1540, color: "#6ee7b7" },
];

export function GrowthDashboard() {
  const [range, setRange] = useState<"7d"|"30d"|"90d">("7d");
  const [stats, setStats] = useState({ totalUsers: 0, creators: 0 });

  useEffect(() => {
    async function load() {
      const { count: total } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      const { count: creators } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_creator", true);
      setStats({ totalUsers: total ?? 0, creators: creators ?? 0 });
    }
    load();
  }, []);

  return (
    <div>
      <PageHeader title="Growth Dashboard" sub="User acquisition, retention, conversion funnel and channel attribution">
        <div style={{ display: "flex", gap: 4, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: 3 }}>
          {(["7d","30d","90d"] as const).map(r => (
            <button key={r} onClick={() => setRange(r)} style={{ padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: range === r ? "#7c3aed" : "transparent", color: range === r ? "#fff" : "var(--muted)" }}>{r}</button>
          ))}
        </div>
      </PageHeader>

      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          <StatCard label="Total Users"     value={(stats.totalUsers || 9140).toLocaleString()} icon={Users}     color="#7c3aed" change="+284 today" up />
          <StatCard label="New Today"       value={284}                                          icon={UserPlus}  color="#10b981" change="+18%" up />
          <StatCard label="Active Creators" value={stats.creators || 842}                        icon={Star}      color="#ec4899" change="+52 week" up />
          <StatCard label="7-day Retention" value="76%"                                          icon={Repeat}    color="#f59e0b" change="+3%" up />
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>Daily User Growth</p>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 20 }}>New registrations vs. daily active users</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={DAILY}>
              <defs>
                <linearGradient id="gdau" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25} /><stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gnew" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: "rgba(240,242,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(240,242,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TTIP} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="activeUsers" name="Daily Active Users" stroke="#7c3aed" fill="url(#gdau)" strokeWidth={2} />
              <Area type="monotone" dataKey="newUsers" name="New Registrations" stroke="#10b981" fill="url(#gnew)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>Acquisition Channels</p>
            {CHANNELS.map(c => (
              <div key={c.channel} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>{c.channel}</span>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: c.color }}>{c.users.toLocaleString()}</span>
                    <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 6 }}>({c.pct}%)</span>
                  </div>
                </div>
                <div style={{ height: 6, borderRadius: 99, background: "var(--bg)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 99, background: c.color, width: `${c.pct}%`, transition: "width 0.5s" }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>Conversion Funnel</p>
            {FUNNEL.map((f, i) => (
              <div key={f.stage} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>{f.stage}</span>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: f.color }}>{f.value.toLocaleString()}</span>
                    {i > 0 && <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 6 }}>({Math.round(f.value / FUNNEL[0].value * 100)}%)</span>}
                  </div>
                </div>
                <div style={{ height: 8, borderRadius: 99, background: "var(--bg)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 99, background: f.color, width: `${Math.round(f.value / FUNNEL[0].value * 100)}%`, transition: "width 0.5s" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>Creator & Seller Growth</p>
            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 20 }}>Daily new creators and sellers onboarded</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={DAILY}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fill: "rgba(240,242,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(240,242,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TTIP} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="creators" name="New Creators" fill="#7c3aed" radius={[4,4,0,0]} />
                <Bar dataKey="sellers" name="New Sellers" fill="#10b981" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>7-Day Retention Rate</p>
            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 20 }}>% of users who return within 7 days</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={DAILY}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fill: "rgba(240,242,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[60, 85]} tick={{ fill: "rgba(240,242,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={TTIP} formatter={(v: any) => [`${v}%`, "Retention"]} />
                <Line type="monotone" dataKey="retention" name="Retention" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: "#f59e0b", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
