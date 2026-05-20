import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { Building2, ShoppingBag, ShieldCheck, TrendingUp } from "lucide-react";

export function Businesses() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [stats, setStats]           = useState({ total: 0, verified: 0, vendors: 0 });

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("profiles")
        .select("id,username,avatar_url,business_category,is_verified,is_vendor,created_at,bio,location")
        .or("is_vendor.eq.true,is_professional.eq.true")
        .order("created_at", { ascending: false })
        .limit(60);
      const list = data ?? [];
      setBusinesses(list);
      setStats({ total: list.length, verified: list.filter((b: any) => b.is_verified).length, vendors: list.filter((b: any) => b.is_vendor).length });
      setLoading(false);
    }
    load();
  }, []);

  const filtered = businesses.filter(b => !search || b.username?.toLowerCase().includes(search.toLowerCase()) || b.business_category?.toLowerCase().includes(search.toLowerCase()));

  function tAgo(iso: string) {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (d === 0) return "Today"; if (d === 1) return "Yesterday";
    return `${d}d ago`;
  }

  return (
    <div>
      <PageHeader title="Businesses" sub="Business accounts, stores and vendors">
        <span className="text-[12px] text-white/40">{stats.total} businesses</span>
      </PageHeader>

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Total Businesses" value={stats.total}    icon={Building2}   color="#7c3aed" />
          <StatCard label="Verified"         value={stats.verified} icon={ShieldCheck} color="#10b981" />
          <StatCard label="Active Vendors"   value={stats.vendors}  icon={ShoppingBag} color="#3b82f6" />
          <StatCard label="Growth"           value="+12%"           icon={TrendingUp}  color="#f59e0b" change="+12%" up />
        </div>

        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or category…"
          className="w-full max-w-xs bg-[#12121c] border border-[#1e1e2e] rounded-lg px-4 py-2 text-[12px] text-white/70 focus:outline-none focus:border-purple-500/50" />

        <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl overflow-hidden">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-[#1e1e2e] text-white/30 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Business</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Verified</th>
                <th className="px-4 py-3 text-left">Joined</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e2e]">
              {loading ? Array(6).fill(0).map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 bg-[#1e1e2e] rounded animate-pulse" /></td></tr>
              )) : filtered.map(b => (
                <tr key={b.id} className="hover:bg-[#1a1a2a] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#1e1e2e] overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {b.avatar_url ? <img src={b.avatar_url} alt="" className="w-full h-full object-cover" /> : <Building2 className="w-4 h-4 text-white/20" />}
                      </div>
                      <p className="font-semibold text-white">@{b.username}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white/50">{b.business_category ?? "General"}</td>
                  <td className="px-4 py-3 text-white/40">{b.location ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${b.is_vendor ? "text-blue-400 bg-blue-500/10 border-blue-500/25" : "text-purple-400 bg-purple-500/10 border-purple-500/25"}`}>
                      {b.is_vendor ? "Vendor" : "Professional"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${b.is_verified ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/25" : "text-white/25 bg-white/5 border-white/10"}`}>
                      {b.is_verified ? "✓ Verified" : "Unverified"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/30">{tAgo(b.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={async () => {
                        await supabase.from("profiles").update({ is_verified: !b.is_verified }).eq("id", b.id);
                        setBusinesses(prev => prev.map(x => x.id === b.id ? { ...x, is_verified: !x.is_verified } : x));
                      }} className={`px-3 py-1 rounded-lg text-[11px] font-semibold border transition-all ${b.is_verified ? "text-red-400 border-red-500/25 hover:bg-red-500/10" : "text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/10"}`}>
                        {b.is_verified ? "Unverify" : "Verify"}
                      </button>
                      <button className="px-3 py-1 rounded-lg text-[11px] font-semibold text-white/30 border border-white/10 hover:bg-white/5">Suspend</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && <p className="text-center text-white/20 py-8 text-[12px]">No businesses found</p>}
        </div>
      </div>
    </div>
  );
}
