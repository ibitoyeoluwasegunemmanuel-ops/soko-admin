import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { Megaphone, TrendingUp, DollarSign, Eye, CheckCircle, XCircle, Clock } from "lucide-react";

type Tab = "campaigns" | "pending" | "analytics";

const STATUS_STYLE: Record<string, string> = {
  active:   "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
  pending:  "text-amber-400 bg-amber-500/10 border-amber-500/25",
  paused:   "text-white/40 bg-white/5 border-white/10",
  rejected: "text-red-400 bg-red-500/10 border-red-500/25",
  ended:    "text-white/20 bg-white/5 border-white/5",
};

const AD_TYPES = [
  { type: "product_boost", label: "Product Boost", color: "#7c3aed", icon: "📦" },
  { type: "banner",        label: "Banner Ad",     color: "#3b82f6", icon: "🖼️" },
  { type: "live_sponsor",  label: "Live Sponsor",  color: "#ef4444", icon: "🔴" },
  { type: "story_ad",      label: "Story Ad",      color: "#f59e0b", icon: "📸" },
];

export function Ads() {
  const [tab, setTab] = useState<Tab>("campaigns");
  const [ads, setAds] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, revenue: 0, impressions: 0 });
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const [adsR, pendR] = await Promise.all([
        supabase.from("ad_campaigns").select("id,title,type,status,budget,spent,impressions,clicks,created_at,advertiser:profiles!user_id(username,avatar_url)").order("created_at", { ascending: false }).limit(60),
        supabase.from("ad_campaigns").select("id,title,type,budget,created_at,advertiser:profiles!user_id(username,avatar_url)").eq("status", "pending").order("created_at", { ascending: false }),
      ]);
      const list = adsR.data ?? [];
      const pend = pendR.data ?? [];
      setAds(list);
      setPending(pend);
      const active = list.filter((a: any) => a.status === "active");
      const totalRevenue = list.reduce((s: number, a: any) => s + Number(a.spent ?? 0), 0);
      const totalImpressions = list.reduce((s: number, a: any) => s + Number(a.impressions ?? 0), 0);
      setStats({ total: list.length, active: active.length, revenue: totalRevenue, impressions: totalImpressions });
      setLoading(false);
    }
    load();
  }, []);

  async function approve(id: string) {
    await supabase.from("ad_campaigns").update({ status: "active" }).eq("id", id);
    setPending(prev => prev.filter(x => x.id !== id));
    setAds(prev => prev.map(x => x.id === id ? { ...x, status: "active" } : x));
  }

  async function reject(id: string) {
    await supabase.from("ad_campaigns").update({ status: "rejected" }).eq("id", id);
    setPending(prev => prev.filter(x => x.id !== id));
    setAds(prev => prev.map(x => x.id === id ? { ...x, status: "rejected" } : x));
  }

  async function pause(id: string, current: string) {
    const next = current === "active" ? "paused" : "active";
    await supabase.from("ad_campaigns").update({ status: next }).eq("id", id);
    setAds(prev => prev.map(x => x.id === id ? { ...x, status: next } : x));
  }

  function tAgo(iso: string) {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (d === 0) return "Today"; if (d === 1) return "Yesterday";
    return `${d}d ago`;
  }

  const filteredAds = ads.filter(a => !search || a.title?.toLowerCase().includes(search.toLowerCase()) || a.advertiser?.username?.toLowerCase().includes(search.toLowerCase()));

  const ANALYTICS = AD_TYPES.map(t => {
    const slice = ads.filter(a => a.type === t.type);
    return { ...t, count: slice.length, revenue: slice.reduce((s: number, a: any) => s + Number(a.spent ?? 0), 0), impressions: slice.reduce((s: number, a: any) => s + Number(a.impressions ?? 0), 0) };
  });

  return (
    <div>
      <PageHeader title="Ads & Promotions" sub="Ad campaigns, boosts, approvals, and analytics">
        {pending.length > 0 && (
          <span className="flex items-center gap-1.5 text-[11px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/25 px-3 py-1.5 rounded-full">
            <Clock className="w-3 h-3" />{pending.length} pending
          </span>
        )}
      </PageHeader>

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Total Campaigns"  value={stats.total}                                   icon={Megaphone}  color="#7c3aed" />
          <StatCard label="Active Campaigns" value={stats.active}                                  icon={TrendingUp} color="#10b981" />
          <StatCard label="Ad Revenue"       value={`₦${stats.revenue.toLocaleString()}`}          icon={DollarSign} color="#f59e0b" change="+18%" up />
          <StatCard label="Total Impressions" value={stats.impressions.toLocaleString()}           icon={Eye}        color="#3b82f6" />
        </div>

        <div className="flex gap-1 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg p-1 w-fit">
          {(["campaigns", "pending", "analytics"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-[12px] font-semibold capitalize transition-all relative ${tab === t ? "bg-[#7c3aed] text-white" : "text-white/40 hover:text-white/70"}`}>
              {t}
              {t === "pending" && pending.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-[9px] text-white font-black flex items-center justify-center">{pending.length}</span>
              )}
            </button>
          ))}
        </div>

        {tab !== "analytics" && (
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search campaigns…"
            className="w-full max-w-xs bg-[#12121c] border border-[#1e1e2e] rounded-lg px-4 py-2 text-[12px] text-white/70 focus:outline-none focus:border-purple-500/50" />
        )}

        {tab === "campaigns" && (
          <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl overflow-hidden">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[#1e1e2e] text-white/30 text-[11px] font-bold uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Campaign</th>
                  <th className="px-4 py-3 text-left">Advertiser</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Budget/Spent</th>
                  <th className="px-4 py-3 text-left">Impressions</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e2e]">
                {loading ? Array(5).fill(0).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 bg-[#1e1e2e] rounded animate-pulse" /></td></tr>
                )) : filteredAds.map(a => (
                  <tr key={a.id} className="hover:bg-[#1a1a2a] transition-colors">
                    <td className="px-4 py-3 font-semibold text-white max-w-[160px] truncate">{a.title ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#1e1e2e] overflow-hidden flex-shrink-0">
                          {a.advertiser?.avatar_url && <img src={a.advertiser.avatar_url} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <span className="text-white/60">@{a.advertiser?.username ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] text-white/50 capitalize">{(a.type ?? "—").replace(/_/g, " ")}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white/60">₦{Number(a.budget ?? 0).toLocaleString()}</p>
                        <p className="text-emerald-400 text-[10px]">₦{Number(a.spent ?? 0).toLocaleString()} spent</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white/50">{Number(a.impressions ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${STATUS_STYLE[a.status] ?? STATUS_STYLE.paused}`}>{a.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      {(a.status === "active" || a.status === "paused") && (
                        <button onClick={() => pause(a.id, a.status)}
                          className={`px-3 py-1 rounded-lg text-[11px] font-semibold border transition-all ${a.status === "active" ? "text-amber-400 border-amber-500/25 hover:bg-amber-500/10" : "text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/10"}`}>
                          {a.status === "active" ? "Pause" : "Resume"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && filteredAds.length === 0 && <p className="text-center text-white/20 py-8 text-[12px]">No campaigns found</p>}
          </div>
        )}

        {tab === "pending" && (
          <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1e1e2e]">
              <p className="text-[13px] font-black text-white">Pending Approval</p>
            </div>
            {pending.length === 0 ? (
              <p className="text-center text-white/20 py-8 text-[12px]">No pending campaigns</p>
            ) : (
              <div className="divide-y divide-[#1e1e2e]">
                {pending.map(p => (
                  <div key={p.id} className="px-4 py-4 flex items-center justify-between hover:bg-[#1a1a2a]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1e1e2e] overflow-hidden">
                        {p.advertiser?.avatar_url && <img src={p.advertiser.avatar_url} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-white">{p.title ?? "Untitled"}</p>
                        <p className="text-[11px] text-white/40">@{p.advertiser?.username ?? "—"} · ₦{Number(p.budget ?? 0).toLocaleString()} budget · {tAgo(p.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => approve(p.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/10 transition-all">
                        <CheckCircle className="w-3 h-3" /> Approve
                      </button>
                      <button onClick={() => reject(p.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-red-400 border border-red-500/25 hover:bg-red-500/10 transition-all">
                        <XCircle className="w-3 h-3" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "analytics" && (
          <div className="grid grid-cols-2 gap-4">
            {ANALYTICS.map(a => (
              <div key={a.type} className="bg-[#12121c] border border-[#1e1e2e] rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{a.icon}</span>
                  <div>
                    <p className="text-[14px] font-black text-white">{a.label}</p>
                    <p className="text-[11px] text-white/30">{a.count} campaigns</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#0a0a0f] rounded-lg p-3">
                    <p className="text-[10px] text-white/30 mb-1">Revenue</p>
                    <p className="text-[16px] font-black" style={{ color: a.color }}>₦{a.revenue.toLocaleString()}</p>
                  </div>
                  <div className="bg-[#0a0a0f] rounded-lg p-3">
                    <p className="text-[10px] text-white/30 mb-1">Impressions</p>
                    <p className="text-[16px] font-black text-white">{a.impressions.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
