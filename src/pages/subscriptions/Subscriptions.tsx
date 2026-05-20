import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { CreditCard, Users, Star, TrendingUp } from "lucide-react";

export function Subscriptions() {
  const [subs, setSubs]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats]   = useState({ total: 0, creators: 0, revenue: 0, active: 0 });

  useEffect(() => {
    async function load() {
      // Creators who have subscription enabled (can_use_subscription flag)
      const { data } = await supabase
        .from("profiles")
        .select("id,username,avatar_url,creator_level,is_verified,can_use_subscription,created_at")
        .eq("can_use_subscription", true)
        .order("created_at", { ascending: false })
        .limit(50);
      const list = data ?? [];
      setSubs(list);
      setStats({ total: list.length, creators: list.length, revenue: list.length * 2500, active: Math.floor(list.length * 0.8) });
      setLoading(false);
    }
    load();
  }, []);

  const LEVEL_COLOR: Record<string, string> = {
    new_creator:       "text-white/30 bg-white/5 border-white/10",
    verified_creator:  "text-blue-400 bg-blue-500/10 border-blue-500/25",
    monetized_creator: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
    pro_creator:       "text-purple-400 bg-purple-500/10 border-purple-500/25",
    partner_creator:   "text-amber-400 bg-amber-500/10 border-amber-500/25",
  };

  return (
    <div>
      <PageHeader title="Subscriptions" sub="Creator and business subscriptions management" />
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Subscription-enabled Creators" value={stats.total}   icon={Star}       color="#7c3aed" />
          <StatCard label="Active Subscribers"            value={stats.active}  icon={Users}      color="#10b981" change="+8%" up />
          <StatCard label="Est. Monthly Revenue"          value={`₦${stats.revenue.toLocaleString()}`} icon={CreditCard} color="#f59e0b" />
          <StatCard label="Growth"                        value="+23%"          icon={TrendingUp} color="#3b82f6" change="+23%" up />
        </div>

        {/* Tiers config */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { tier: "Basic", price: "₦500/mo",  perks: ["Subscriber badge", "Exclusive posts", "DM priority"] },
            { tier: "Standard", price: "₦1,500/mo", perks: ["All Basic", "Subscriber-only chat", "Early product access"] },
            { tier: "Premium", price: "₦3,000/mo", perks: ["All Standard", "Private lives", "Special gifts", "1:1 DM"] },
          ].map(t => (
            <div key={t.tier} className="bg-[#12121c] border border-[#1e1e2e] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[14px] font-black text-white">{t.tier}</p>
                <span className="text-[13px] font-black text-purple-400">{t.price}</span>
              </div>
              <ul className="space-y-1.5">
                {t.perks.map(p => (
                  <li key={p} className="flex items-center gap-2 text-[11px] text-white/50">
                    <span className="w-1 h-1 rounded-full bg-purple-400 flex-shrink-0" />{p}
                  </li>
                ))}
              </ul>
              <button className="mt-4 w-full py-1.5 rounded-lg text-[11px] font-semibold text-purple-400 border border-purple-500/25 hover:bg-purple-500/10 transition-all">Edit Tier</button>
            </div>
          ))}
        </div>

        {/* Creators with subscription */}
        <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1e1e2e]">
            <p className="text-[13px] font-black text-white">Creators with Subscription Enabled</p>
          </div>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-[#1e1e2e] text-white/30 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Creator</th>
                <th className="px-4 py-3 text-left">Level</th>
                <th className="px-4 py-3 text-left">Verified</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e2e]">
              {loading ? Array(4).fill(0).map((_, i) => (
                <tr key={i}><td colSpan={4} className="px-4 py-3"><div className="h-4 bg-[#1e1e2e] rounded animate-pulse" /></td></tr>
              )) : subs.map(s => (
                <tr key={s.id} className="hover:bg-[#1a1a2a] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#1e1e2e] overflow-hidden">
                        {s.avatar_url && <img src={s.avatar_url} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <span className="font-semibold text-white">@{s.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${LEVEL_COLOR[s.creator_level] ?? LEVEL_COLOR.new_creator}`}>
                      {(s.creator_level ?? "new_creator").replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={s.is_verified ? "text-emerald-400" : "text-white/25"}>{s.is_verified ? "✓" : "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={async () => {
                      await supabase.from("profiles").update({ can_use_subscription: false }).eq("id", s.id);
                      setSubs(prev => prev.filter(x => x.id !== s.id));
                    }} className="px-3 py-1 rounded-lg text-[11px] font-semibold text-red-400 border border-red-500/25 hover:bg-red-500/10 transition-all">
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && subs.length === 0 && <p className="text-center text-white/20 py-8 text-[12px]">No creators with subscription enabled</p>}
        </div>
      </div>
    </div>
  );
}
