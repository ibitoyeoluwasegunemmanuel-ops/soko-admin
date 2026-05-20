import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { Wrench, Users, Clock, Star, ShieldCheck } from "lucide-react";

type Tab = "providers" | "requests" | "categories";

const STATUS_STYLE: Record<string, string> = {
  open:      "text-blue-400 bg-blue-500/10 border-blue-500/25",
  active:    "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
  completed: "text-white/40 bg-white/5 border-white/10",
  cancelled: "text-red-400 bg-red-500/10 border-red-500/25",
};

export function Services() {
  const [tab, setTab] = useState<Tab>("providers");
  const [providers, setProviders] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, verified: 0, requests: 0, open: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const [provR, reqR] = await Promise.all([
        supabase.from("profiles").select("id,username,avatar_url,is_verified,avg_rating,created_at,bio").eq("is_professional", true).order("created_at", { ascending: false }).limit(50),
        supabase.from("service_requests").select("id,title,budget,status,created_at,requester:profiles!user_id(username,avatar_url)").order("created_at", { ascending: false }).limit(50),
      ]);
      const prov = provR.data ?? [];
      const reqs = reqR.data ?? [];
      setProviders(prov);
      setRequests(reqs);
      setStats({
        total:    prov.length,
        verified: prov.filter((p: any) => p.is_verified).length,
        requests: reqs.length,
        open:     reqs.filter((r: any) => r.status === "open").length,
      });
      setLoading(false);
    }
    load();
  }, []);

  const filteredProviders = providers.filter(p => !search || p.username?.toLowerCase().includes(search.toLowerCase()));
  const filteredRequests  = requests.filter(r => !search || r.title?.toLowerCase().includes(search.toLowerCase()));

  const CATS = ["Plumbing", "Electrical", "Cleaning", "Catering", "Photography", "Hair & Beauty", "Tailoring", "Logistics", "IT Support", "Tutoring", "Security", "Other"];

  function tAgo(iso: string) {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }

  return (
    <div>
      <PageHeader title="Services" sub="Service providers, requests, and categories">
        <span className="text-[12px] text-white/40">{stats.total} providers · {stats.requests} requests</span>
      </PageHeader>

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Service Providers" value={stats.total}    icon={Wrench}       color="#7c3aed" />
          <StatCard label="Verified Providers" value={stats.verified} icon={ShieldCheck}  color="#10b981" />
          <StatCard label="Total Requests"     value={stats.requests} icon={Users}        color="#3b82f6" />
          <StatCard label="Open Requests"      value={stats.open}     icon={Clock}        color="#f59e0b" sub="awaiting bids" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg p-1 w-fit">
          {(["providers", "requests", "categories"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-[12px] font-semibold capitalize transition-all ${tab === t ? "bg-[#7c3aed] text-white" : "text-white/40 hover:text-white/70"}`}>
              {t}
            </button>
          ))}
        </div>

        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
          className="w-full max-w-xs bg-[#12121c] border border-[#1e1e2e] rounded-lg px-4 py-2 text-[12px] text-white/70 focus:outline-none focus:border-purple-500/50" />

        {/* Providers */}
        {tab === "providers" && (
          <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl overflow-hidden">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[#1e1e2e] text-white/30 text-[11px] font-bold uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Provider</th>
                  <th className="px-4 py-3 text-left">Rating</th>
                  <th className="px-4 py-3 text-left">Verified</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e2e]">
                {loading ? Array(5).fill(0).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-4 bg-[#1e1e2e] rounded animate-pulse w-full" /></td></tr>
                )) : filteredProviders.map(p => (
                  <tr key={p.id} className="hover:bg-[#1a1a2a] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#1e1e2e] overflow-hidden flex-shrink-0">
                          {p.avatar_url && <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <p className="font-semibold text-white">@{p.username}</p>
                          <p className="text-white/30 text-[10px] truncate max-w-[180px]">{p.bio ?? "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-amber-400">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{p.avg_rating ? Number(p.avg_rating).toFixed(1) : "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${p.is_verified ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/25" : "text-white/30 bg-white/5 border-white/10"}`}>
                        {p.is_verified ? "Verified" : "Unverified"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/40">{tAgo(p.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={async () => {
                          await supabase.from("profiles").update({ is_verified: !p.is_verified }).eq("id", p.id);
                          setProviders(prev => prev.map(x => x.id === p.id ? { ...x, is_verified: !x.is_verified } : x));
                        }} className={`px-3 py-1 rounded-lg text-[11px] font-semibold border transition-all ${p.is_verified ? "text-red-400 border-red-500/25 hover:bg-red-500/10" : "text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/10"}`}>
                          {p.is_verified ? "Unverify" : "Verify"}
                        </button>
                        <button className="px-3 py-1 rounded-lg text-[11px] font-semibold text-white/30 border border-white/10 hover:bg-white/5">View</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && filteredProviders.length === 0 && <p className="text-center text-white/20 py-8 text-[12px]">No service providers yet</p>}
          </div>
        )}

        {/* Requests */}
        {tab === "requests" && (
          <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl overflow-hidden">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[#1e1e2e] text-white/30 text-[11px] font-bold uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Request</th>
                  <th className="px-4 py-3 text-left">Requester</th>
                  <th className="px-4 py-3 text-left">Budget</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Posted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e2e]">
                {filteredRequests.map(r => (
                  <tr key={r.id} className="hover:bg-[#1a1a2a] transition-colors">
                    <td className="px-4 py-3 font-semibold text-white max-w-[200px] truncate">{r.title}</td>
                    <td className="px-4 py-3 text-white/50">@{r.requester?.username ?? "—"}</td>
                    <td className="px-4 py-3 text-emerald-400 font-bold">{r.budget ? `₦${Number(r.budget).toLocaleString()}` : "Open"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${STATUS_STYLE[r.status] ?? STATUS_STYLE.open}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-white/30">{tAgo(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredRequests.length === 0 && <p className="text-center text-white/20 py-8 text-[12px]">No service requests</p>}
          </div>
        )}

        {/* Categories */}
        {tab === "categories" && (
          <div className="grid grid-cols-4 gap-3">
            {CATS.map(cat => (
              <div key={cat} className="bg-[#12121c] border border-[#1e1e2e] rounded-xl p-4 flex items-center justify-between">
                <span className="text-[13px] font-semibold text-white/70">{cat}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
