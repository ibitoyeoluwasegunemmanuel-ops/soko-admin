import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { Users, ShoppingBag, Radio, DollarSign, Star } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

type Period = "7d" | "30d" | "90d";

const MOCK_REVENUE = {
  "7d":  [{ d: "Mon", revenue: 1200000, orders: 42 }, { d: "Tue", revenue: 1800000, orders: 67 }, { d: "Wed", revenue: 1450000, orders: 51 }, { d: "Thu", revenue: 2200000, orders: 89 }, { d: "Fri", revenue: 1900000, orders: 74 }, { d: "Sat", revenue: 3100000, orders: 112 }, { d: "Sun", revenue: 2800000, orders: 98 }],
  "30d": Array.from({ length: 30 }, (_, i) => ({ d: `D${i + 1}`, revenue: 800000 + Math.random() * 2000000, orders: 20 + Math.floor(Math.random() * 80) })),
  "90d": Array.from({ length: 12 }, (_, i) => ({ d: `W${i + 1}`, revenue: 5000000 + Math.random() * 15000000, orders: 150 + Math.floor(Math.random() * 400) })),
};

const MOCK_USERS = {
  "7d":  [{ d: "Mon", new: 45, active: 320 }, { d: "Tue", new: 67, active: 380 }, { d: "Wed", new: 38, active: 290 }, { d: "Thu", new: 82, active: 440 }, { d: "Fri", new: 71, active: 410 }, { d: "Sat", new: 94, active: 520 }, { d: "Sun", new: 86, active: 490 }],
  "30d": Array.from({ length: 30 }, (_, i) => ({ d: `D${i + 1}`, new: 20 + Math.floor(Math.random() * 80), active: 200 + Math.floor(Math.random() * 400) })),
  "90d": Array.from({ length: 12 }, (_, i) => ({ d: `W${i + 1}`, new: 200 + Math.floor(Math.random() * 500), active: 1500 + Math.floor(Math.random() * 2000) })),
};

export function Analytics() {
  const [period, setPeriod] = useState<Period>("7d");
  const [stats, setStats] = useState({ users: 0, revenue: 0, orders: 0, lives: 0, creators: 0, products: 0 });
  const [, setLoading] = useState(true);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [topCreators, setTopCreators] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const [u, o, l, p, c, prod] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("total_amount"),
        supabase.from("active_lives").select("*", { count: "exact", head: true }),
        supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("profiles").select("*", { count: "exact", head: true }).not("creator_level", "eq", "new_creator"),
        supabase.from("products").select("id,name,price,seller:profiles!seller_id(username)").eq("is_active", true).limit(5),
      ]);
      const revenue = (o.data ?? []).reduce((s: number, x: any) => s + Number(x.total_amount ?? 0), 0);
      setStats({ users: u.count ?? 0, revenue, orders: (o.data ?? []).length, lives: l.count ?? 0, creators: c.count ?? 0, products: p.count ?? 0 });
      setTopProducts(prod.data ?? []);

      const crR = await supabase.from("profiles").select("id,username,avatar_url,creator_level,followers_count").not("creator_level", "eq", "new_creator").order("followers_count", { ascending: false }).limit(5);
      setTopCreators(crR.data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const revenueData = MOCK_REVENUE[period];
  const userData = MOCK_USERS[period];

  const TTIP_STYLE = { background: "#12121c", border: "1px solid #2a2a3e", borderRadius: 8, color: "#fff", fontSize: 11 };

  return (
    <div>
      <PageHeader title="Analytics" sub="Revenue, growth, live performance, and platform insights">
        <div className="flex gap-1 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg p-1">
          {(["7d", "30d", "90d"] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${period === p ? "bg-[#7c3aed] text-white" : "text-white/40 hover:text-white/70"}`}>
              {p}
            </button>
          ))}
        </div>
      </PageHeader>

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Total Users"     value={stats.users.toLocaleString()}                        icon={Users}       color="#3b82f6" change="+5.1%" up />
          <StatCard label="Platform Revenue" value={`₦${stats.revenue.toLocaleString()}`}              icon={DollarSign}  color="#7c3aed" change="+18%" up />
          <StatCard label="Total Orders"    value={stats.orders.toLocaleString()}                      icon={ShoppingBag} color="#f59e0b" change="+8.2%" up />
          <StatCard label="Active Creators" value={stats.creators.toLocaleString()}                    icon={Star}        color="#ec4899" change="+12%" up />
          <StatCard label="Live Streams"    value={stats.lives.toLocaleString()}                       icon={Radio}       color="#ef4444" sub="right now" />
          <StatCard label="Active Products" value={stats.products.toLocaleString()}                    icon={ShoppingBag} color="#10b981" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl p-5">
            <p className="text-[14px] font-black text-white mb-1">Revenue & Orders</p>
            <p className="text-[11px] text-white/30 mb-4">Combined trend across selected period</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="gr1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                <XAxis dataKey="d" tick={{ fill: "#ffffff40", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="l" tick={{ fill: "#ffffff40", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₦${(Number(v) / 1000).toFixed(0)}K`} />
                <YAxis yAxisId="r" orientation="right" tick={{ fill: "#ffffff40", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TTIP_STYLE} formatter={(v: any, n: any) => [n === "revenue" ? `₦${Number(v).toLocaleString()}` : v, n === "revenue" ? "Revenue" : "Orders"]} />
                <Area yAxisId="l" type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2} fill="url(#gr1)" />
                <Line yAxisId="r" type="monotone" dataKey="orders" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl p-5">
            <p className="text-[14px] font-black text-white mb-1">User Growth</p>
            <p className="text-[11px] text-white/30 mb-4">New signups vs active users</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={userData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                <XAxis dataKey="d" tick={{ fill: "#ffffff40", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#ffffff40", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TTIP_STYLE} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="new"    name="New Users"    fill="#7c3aed" radius={[3, 3, 0, 0]} />
                <Bar dataKey="active" name="Active Users" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1e1e2e]">
              <p className="text-[13px] font-black text-white">Top Products</p>
            </div>
            {topProducts.length === 0 ? (
              <p className="text-center text-white/20 py-6 text-[12px]">No product data</p>
            ) : (
              <div className="divide-y divide-[#1e1e2e]">
                {topProducts.map((p, i) => (
                  <div key={p.id} className="px-4 py-3 flex items-center gap-3">
                    <span className="text-[11px] font-black text-white/20 w-4">{i + 1}</span>
                    <div className="flex-1">
                      <p className="text-[12px] font-semibold text-white truncate max-w-[200px]">{p.name}</p>
                      <p className="text-[10px] text-white/30">@{p.seller?.username ?? "—"}</p>
                    </div>
                    <span className="text-[12px] font-bold text-emerald-400">₦{Number(p.price).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1e1e2e]">
              <p className="text-[13px] font-black text-white">Top Creators by Followers</p>
            </div>
            {topCreators.length === 0 ? (
              <p className="text-center text-white/20 py-6 text-[12px]">No creator data</p>
            ) : (
              <div className="divide-y divide-[#1e1e2e]">
                {topCreators.map((c, i) => (
                  <div key={c.id} className="px-4 py-3 flex items-center gap-3">
                    <span className="text-[11px] font-black text-white/20 w-4">{i + 1}</span>
                    <div className="w-7 h-7 rounded-full bg-[#1e1e2e] overflow-hidden flex-shrink-0">
                      {c.avatar_url && <img src={c.avatar_url} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-[12px] font-semibold text-white">@{c.username}</p>
                      <p className="text-[10px] text-white/30 capitalize">{(c.creator_level ?? "").replace(/_/g, " ")}</p>
                    </div>
                    <span className="text-[12px] font-bold text-purple-400">{Number(c.followers_count ?? 0).toLocaleString()} followers</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
