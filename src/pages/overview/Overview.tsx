import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { StatCard } from "../../components/StatCard";
import { PageHeader } from "../../components/PageHeader";
import { Users, Radio, ShoppingBag, Package, Wallet, ArrowUpFromLine, Star, Gavel } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const CHART_DATA = [
  { day: "Mon", revenue: 1200000 }, { day: "Tue", revenue: 1800000 },
  { day: "Wed", revenue: 1450000 }, { day: "Thu", revenue: 2200000 },
  { day: "Fri", revenue: 1900000 }, { day: "Sat", revenue: 3100000 }, { day: "Sun", revenue: 2800000 },
];

interface Stats { users: number; lives: number; orders: number; products: number; walletBalance: number; pendingPayouts: number; creators: number; auctions: number; }

export function Overview() {
  const [stats, setStats] = useState<Stats>({ users: 0, lives: 0, orders: 0, products: 0, walletBalance: 0, pendingPayouts: 0, creators: 0, auctions: 0 });
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [u, l, o, p, w, pay, c, a] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("active_lives").select("*", { count: "exact", head: true }).eq("status", "live"),
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("wallets").select("balance").limit(200),
        supabase.from("payout_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).not("creator_level", "eq", "new_creator"),
        supabase.from("auctions").select("*", { count: "exact", head: true }).eq("status", "active"),
      ]);
      const bal = (w.data ?? []).reduce((s: number, x: any) => s + Number(x.balance ?? 0), 0);
      setStats({ users: u.count ?? 0, lives: l.count ?? 0, orders: o.count ?? 0, products: p.count ?? 0, walletBalance: bal, pendingPayouts: pay.count ?? 0, creators: c.count ?? 0, auctions: a.count ?? 0 });

      const [lv, or, us] = await Promise.all([
        supabase.from("active_lives").select("id,title,created_at,host:profiles!host_id(username)").order("created_at", { ascending: false }).limit(4),
        supabase.from("orders").select("id,order_ref,total_amount,created_at").order("created_at", { ascending: false }).limit(4),
        supabase.from("profiles").select("id,username,created_at").order("created_at", { ascending: false }).limit(4),
      ]);
      const all = [
        ...(lv.data ?? []).map((x: any) => ({ icon: "🔴", label: `${x.host?.username ?? "Host"} went live: ${x.title}`, time: x.created_at })),
        ...(or.data ?? []).map((x: any) => ({ icon: "📦", label: `Order ${x.order_ref ?? x.id.slice(0, 8)} — ₦${Number(x.total_amount).toLocaleString()}`, time: x.created_at })),
        ...(us.data ?? []).map((x: any) => ({ icon: "👤", label: `@${x.username} joined Soko`, time: x.created_at })),
      ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);
      setActivity(all);
      setLoading(false);
    }
    load();
    const ch = supabase.channel("admin-overview")
      .on("postgres_changes", { event: "*", schema: "public", table: "active_lives" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  function tAgo(iso: string) {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    return `${Math.floor(s / 3600)}h ago`;
  }

  return (
    <div>
      <PageHeader title="Overview" sub={`Platform snapshot · ${new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" })}`}>
        <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {loading ? "Loading" : "Live"}
        </span>
      </PageHeader>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Total Users"     value={stats.users.toLocaleString()}          icon={Users}          color="#3b82f6" change="+5.1%" up />
          <StatCard label="Live Streams"    value={stats.lives.toLocaleString()}          icon={Radio}          color="#ef4444" sub="right now" />
          <StatCard label="Total Orders"    value={stats.orders.toLocaleString()}         icon={Package}        color="#f59e0b" change="+8.2%" up />
          <StatCard label="Products"        value={stats.products.toLocaleString()}       icon={ShoppingBag}    color="#10b981" />
          <StatCard label="Platform Balance" value={`₦${stats.walletBalance.toLocaleString()}`} icon={Wallet}  color="#7c3aed" />
          <StatCard label="Pending Payouts" value={stats.pendingPayouts.toLocaleString()} icon={ArrowUpFromLine} color="#f97316" sub="needs review" />
          <StatCard label="Creators"        value={stats.creators.toLocaleString()}       icon={Star}           color="#ec4899" change="+12%" up />
          <StatCard label="Live Auctions"   value={stats.auctions.toLocaleString()}       icon={Gavel}          color="#06b6d4" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 bg-[#12121c] border border-[#1e1e2e] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[14px] font-black text-white">Revenue Trend (7 days)</p>
                <p className="text-[11px] text-white/30">Orders + gifts + subscriptions</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={CHART_DATA}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                <XAxis dataKey="day" tick={{ fill: "#ffffff40", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#ffffff40", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₦${(Number(v) / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ background: "#12121c", border: "1px solid #2a2a3e", borderRadius: 8, color: "#fff", fontSize: 11 }} formatter={(v: any) => [`₦${Number(v).toLocaleString()}`, "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl p-5">
            <p className="text-[14px] font-black text-white mb-4">Quick Actions</p>
            <div className="space-y-2">
              {[
                { label: "Pending Payouts", count: stats.pendingPayouts, color: "#f97316", href: "/payouts" },
                { label: "Live Streams",    count: stats.lives,          color: "#ef4444", href: "/live" },
                { label: "Live Auctions",   count: stats.auctions,       color: "#06b6d4", href: "/auctions" },
                { label: "Total Users",     count: stats.users,          color: "#3b82f6", href: "/users" },
              ].map(a => (
                <a key={a.label} href={a.href}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#0a0a0f] border border-[#1e1e2e] hover:border-[#2a2a3e] transition-all group">
                  <span className="text-[12px] text-white/50 group-hover:text-white/80">{a.label}</span>
                  <span className="text-[13px] font-black" style={{ color: a.color }}>{a.count.toLocaleString()}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl p-5">
          <p className="text-[14px] font-black text-white mb-4">Recent Platform Activity</p>
          {activity.length === 0
            ? <p className="text-[12px] text-white/20 py-4 text-center">No recent activity</p>
            : (
              <div className="divide-y divide-[#1e1e2e]">
                {activity.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5">
                    <span className="text-base">{item.icon}</span>
                    <p className="flex-1 text-[12px] text-white/60">{item.label}</p>
                    <p className="text-[10px] text-white/25">{tAgo(item.time)}</p>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
