import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { ShieldCheck, Clock, CheckCircle, XCircle, User, Store, Star } from "lucide-react";

type Tab = "pending" | "approved" | "rejected";
type VType = "all" | "user" | "seller" | "creator";

const VTYPE_STYLE: Record<string, string> = {
  user:    "text-blue-400 bg-blue-500/10 border-blue-500/25",
  seller:  "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
  creator: "text-purple-400 bg-purple-500/10 border-purple-500/25",
};

export function Verification() {
  const [tab, setTab] = useState<Tab>("pending");
  const [vtype, setVtype] = useState<VType>("all");
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("verification_requests")
        .select("id,type,status,id_type,notes,created_at,reviewed_at,user:profiles!user_id(id,username,avatar_url,is_verified,creator_level,is_vendor)")
        .order("created_at", { ascending: false })
        .limit(100);
      const list = data ?? [];
      setRequests(list);
      setStats({
        pending:  list.filter(r => r.status === "pending").length,
        approved: list.filter(r => r.status === "approved").length,
        rejected: list.filter(r => r.status === "rejected").length,
        total: list.length,
      });
      setLoading(false);
    }
    load();
  }, []);

  async function decide(id: string, userId: string, decision: "approved" | "rejected") {
    await supabase.from("verification_requests").update({ status: decision, reviewed_at: new Date().toISOString() }).eq("id", id);
    if (decision === "approved") {
      await supabase.from("profiles").update({ is_verified: true }).eq("id", userId);
    }
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: decision } : r));
    setStats(prev => ({
      ...prev,
      pending: prev.pending - 1,
      [decision]: prev[decision] + 1,
    }));
  }

  function tAgo(iso: string) {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (d === 0) return "Today"; if (d === 1) return "Yesterday";
    return `${d}d ago`;
  }

  const visible = requests.filter(r => {
    if (r.status !== tab) return false;
    if (vtype !== "all" && r.type !== vtype) return false;
    if (search && !r.user?.username?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <PageHeader title="Verification" sub="KYC, identity, seller, and creator verification queue">
        {stats.pending > 0 && (
          <span className="flex items-center gap-1.5 text-[11px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/25 px-3 py-1.5 rounded-full">
            <Clock className="w-3 h-3" />{stats.pending} pending
          </span>
        )}
      </PageHeader>

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Pending Review"  value={stats.pending}  icon={Clock}       color="#f59e0b" />
          <StatCard label="Approved"        value={stats.approved} icon={ShieldCheck} color="#10b981" />
          <StatCard label="Rejected"        value={stats.rejected} icon={XCircle}     color="#ef4444" />
          <StatCard label="Total Requests"  value={stats.total}    icon={User}        color="#7c3aed" />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg p-1">
            {(["pending", "approved", "rejected"] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-md text-[12px] font-semibold capitalize transition-all ${tab === t ? "bg-[#7c3aed] text-white" : "text-white/40 hover:text-white/70"}`}>
                {t}
              </button>
            ))}
          </div>

          <div className="flex gap-1 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg p-1">
            {(["all", "user", "seller", "creator"] as VType[]).map(v => (
              <button key={v} onClick={() => setVtype(v)}
                className={`px-3 py-1.5 rounded-md text-[11px] font-semibold capitalize transition-all ${vtype === v ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"}`}>
                {v}
              </button>
            ))}
          </div>

          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search username…"
            className="bg-[#12121c] border border-[#1e1e2e] rounded-lg px-4 py-2 text-[12px] text-white/70 focus:outline-none focus:border-purple-500/50" />
        </div>

        <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl overflow-hidden">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-[#1e1e2e] text-white/30 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">ID Type</th>
                <th className="px-4 py-3 text-left">Submitted</th>
                {tab === "pending" && <th className="px-4 py-3 text-left">Actions</th>}
                {tab !== "pending" && <th className="px-4 py-3 text-left">Reviewed</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e2e]">
              {loading ? Array(5).fill(0).map((_, i) => (
                <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-4 bg-[#1e1e2e] rounded animate-pulse" /></td></tr>
              )) : visible.map(r => (
                <tr key={r.id} className="hover:bg-[#1a1a2a] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#1e1e2e] overflow-hidden flex-shrink-0">
                        {r.user?.avatar_url && <img src={r.user.avatar_url} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <p className="font-semibold text-white">@{r.user?.username ?? "—"}</p>
                        <p className="text-[10px] text-white/30">
                          {r.user?.is_verified ? "✓ verified" : "unverified"} · {r.user?.creator_level?.replace(/_/g, " ") ?? "user"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${VTYPE_STYLE[r.type] ?? VTYPE_STYLE.user}`}>
                      {r.type === "user" ? <><User className="w-2.5 h-2.5 inline mr-1" />User</> : r.type === "seller" ? <><Store className="w-2.5 h-2.5 inline mr-1" />Seller</> : <><Star className="w-2.5 h-2.5 inline mr-1" />Creator</>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/50 capitalize">{(r.id_type ?? "—").replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 text-white/40">{tAgo(r.created_at)}</td>
                  {tab === "pending" && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => decide(r.id, r.user?.id, "approved")}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-semibold text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/10 transition-all">
                          <CheckCircle className="w-3 h-3" /> Approve
                        </button>
                        <button onClick={() => decide(r.id, r.user?.id, "rejected")}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-semibold text-red-400 border border-red-500/25 hover:bg-red-500/10 transition-all">
                          <XCircle className="w-3 h-3" /> Reject
                        </button>
                      </div>
                    </td>
                  )}
                  {tab !== "pending" && (
                    <td className="px-4 py-3 text-white/30">{r.reviewed_at ? tAgo(r.reviewed_at) : "—"}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && visible.length === 0 && (
            <p className="text-center text-white/20 py-8 text-[12px]">No {tab} verification requests</p>
          )}
        </div>
      </div>
    </div>
  );
}
