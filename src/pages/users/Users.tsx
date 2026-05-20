import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { Search, CheckCircle, Ban, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
  is_verified: boolean;
  creator_level: string;
  email: string | null;
  is_suspended?: boolean;
}

const PAGE_SIZE = 20;
const STATUS_TABS = ["All", "Verified", "Unverified", "Suspended"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 bg-[#1e1e2e] rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

function tAgo(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export function Users() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<StatusTab>("All");
  const [page, setPage] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("profiles")
      .select("id,username,avatar_url,created_at,is_verified,creator_level,email,is_suspended", { count: "exact" });

    if (search.trim()) q = q.ilike("username", `%${search.trim()}%`);
    if (tab === "Verified") q = q.eq("is_verified", true);
    if (tab === "Unverified") q = q.eq("is_verified", false);
    if (tab === "Suspended") q = q.eq("is_suspended", true);

    const { data, count, error } = await q
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    if (!error) {
      setProfiles((data as Profile[]) ?? []);
      setTotal(count ?? 0);
    }
    setLoading(false);
  }, [search, tab, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(0); }, [search, tab]);

  async function toggleVerify(p: Profile) {
    setActionLoading(p.id + "_verify");
    await supabase.from("profiles").update({ is_verified: !p.is_verified }).eq("id", p.id);
    setProfiles(prev => prev.map(u => u.id === p.id ? { ...u, is_verified: !u.is_verified } : u));
    setActionLoading(null);
  }

  async function toggleSuspend(p: Profile) {
    setActionLoading(p.id + "_suspend");
    await supabase.from("profiles").update({ is_suspended: !p.is_suspended }).eq("id", p.id);
    setProfiles(prev => prev.map(u => u.id === p.id ? { ...u, is_suspended: !u.is_suspended } : u));
    setActionLoading(null);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <PageHeader title="Users" sub={`${total.toLocaleString()} total users`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search username..."
            className="bg-[#1e1e2e] border border-[#2a2a3e] rounded-lg pl-9 pr-4 py-2 text-[12px] text-white/70 placeholder-white/20 focus:outline-none focus:border-purple-500/50 w-56"
          />
        </div>
      </PageHeader>

      <div className="p-6 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 bg-[#12121c] border border-[#1e1e2e] rounded-lg p-1 w-fit">
          {STATUS_TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-[12px] font-semibold transition-all ${
                tab === t
                  ? "bg-[#7c3aed] text-white"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e1e2e]">
                {["User", "Email", "Level", "Joined", "Status", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-black text-white/30 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e2e]">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                : profiles.length === 0
                ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-[12px] text-white/20">
                      No users found
                    </td>
                  </tr>
                )
                : profiles.map(p => (
                  <tr key={p.id} className="hover:bg-[#1a1a2a] transition-colors">
                    {/* Avatar + Username */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/20 flex items-center justify-center text-[11px] font-black text-purple-300 overflow-hidden flex-shrink-0">
                          {p.avatar_url
                            ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                            : (p.username?.[0] ?? "?").toUpperCase()
                          }
                        </div>
                        <span className="text-[12px] font-semibold text-white/80">@{p.username ?? "—"}</span>
                      </div>
                    </td>
                    {/* Email */}
                    <td className="px-4 py-3 text-[12px] text-white/50">{p.email ?? "—"}</td>
                    {/* Level */}
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-semibold text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
                        {p.creator_level ?? "user"}
                      </span>
                    </td>
                    {/* Joined */}
                    <td className="px-4 py-3 text-[12px] text-white/40">{tAgo(p.created_at)}</td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      {p.is_suspended ? (
                        <span className="text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">Suspended</span>
                      ) : p.is_verified ? (
                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Verified</span>
                      ) : (
                        <span className="text-[11px] font-bold text-white/30 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">Unverified</span>
                      )}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleVerify(p)}
                          disabled={!!actionLoading}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                            p.is_verified
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                              : "bg-[#1e1e2e] text-white/50 border border-[#2a2a3e] hover:border-emerald-500/30 hover:text-emerald-400"
                          }`}
                        >
                          <CheckCircle className="w-3 h-3" />
                          {p.is_verified ? "Verified" : "Verify"}
                        </button>
                        <button
                          onClick={() => toggleSuspend(p)}
                          disabled={!!actionLoading}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                            p.is_suspended
                              ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                              : "bg-[#1e1e2e] text-white/50 border border-[#2a2a3e] hover:border-red-500/30 hover:text-red-400"
                          }`}
                        >
                          <Ban className="w-3 h-3" />
                          {p.is_suspended ? "Unsuspend" : "Suspend"}
                        </button>
                        <a
                          href={`https://soko.app/u/${p.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-[#1e1e2e] text-white/40 border border-[#2a2a3e] hover:text-white/70 hover:border-[#3a3a4e] transition-all"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-white/30">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total.toLocaleString()}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 rounded-lg bg-[#12121c] border border-[#1e1e2e] text-white/40 hover:text-white/70 disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[12px] text-white/40">
                Page {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg bg-[#12121c] border border-[#1e1e2e] text-white/40 hover:text-white/70 disabled:opacity-30 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
