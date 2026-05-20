import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { Shield, Ban as BanIcon, Filter, Radio } from "lucide-react";

type ModTab = "reports" | "bans" | "keywords" | "live";

interface ModerationLog {
  id: string;
  action: string;
  target_id: string | null;
  reason: string | null;
  created_at: string;
  admin_id?: string;
  details?: any;
}

interface BanEntry {
  id: string;
  user_id: string;
  reason: string | null;
  created_at: string;
  expires_at: string | null;
  user?: { username: string; avatar_url: string | null };
}

interface KeywordFilter {
  id: string;
  creator_id: string;
  keyword: string;
  created_at: string;
  creator?: { username: string };
}

interface FlaggedLive {
  id: string;
  title: string;
  status: string;
  host_id: string;
  created_at: string;
  host?: { username: string };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export function Moderation() {
  const [tab, setTab] = useState<ModTab>("reports");
  const [reports, setReports] = useState<ModerationLog[]>([]);
  const [bans, setBans] = useState<BanEntry[]>([]);
  const [keywords, setKeywords] = useState<KeywordFilter[]>([]);
  const [flaggedLive, setFlaggedLive] = useState<FlaggedLive[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("moderation_log")
      .select("id,action,target_id,reason,created_at,admin_id,details")
      .order("created_at", { ascending: false })
      .limit(80);
    setReports((data as ModerationLog[]) ?? []);
    setLoading(false);
  }, []);

  const loadBans = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("creator_bans")
      .select("id,user_id,reason,created_at,expires_at,user:profiles!user_id(username,avatar_url)")
      .order("created_at", { ascending: false })
      .limit(80);
    setBans((data as unknown as BanEntry[]) ?? []);
    setLoading(false);
  }, []);

  const loadKeywords = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("creator_keyword_filters")
      .select("id,creator_id,keyword,created_at,creator:profiles!creator_id(username)")
      .order("created_at", { ascending: false })
      .limit(100);
    setKeywords((data as unknown as KeywordFilter[]) ?? []);
    setLoading(false);
  }, []);

  const loadFlaggedLive = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("active_lives")
      .select("id,title,status,host_id,created_at,host:profiles!host_id(username)")
      .order("created_at", { ascending: false })
      .limit(30);
    setFlaggedLive((data as unknown as FlaggedLive[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (tab === "reports") loadReports();
    if (tab === "bans") loadBans();
    if (tab === "keywords") loadKeywords();
    if (tab === "live") loadFlaggedLive();
  }, [tab, loadReports, loadBans, loadKeywords, loadFlaggedLive]);

  async function unban(banId: string, userId: string) {
    setActionLoading(banId);
    await supabase.from("creator_bans").delete().eq("id", banId);
    await supabase.from("profiles").update({ is_suspended: false }).eq("id", userId);
    setBans(prev => prev.filter(b => b.id !== banId));
    setActionLoading(null);
  }

  const TABS = [
    { id: "reports",  label: "Reports",          icon: Shield },
    { id: "bans",     label: "Bans",             icon: BanIcon },
    { id: "keywords", label: "Keyword Filters",  icon: Filter },
    { id: "live",     label: "Live Reports",     icon: Radio },
  ];

  return (
    <div>
      <PageHeader title="Moderation" sub="Content safety & enforcement" />

      <div className="p-6 space-y-4">
        <div className="flex gap-1 bg-[#12121c] border border-[#1e1e2e] rounded-lg p-1 w-fit">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as ModTab)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-[12px] font-semibold transition-all ${
                tab === t.id ? "bg-[#7c3aed] text-white" : "text-white/40 hover:text-white/70"
              }`}
            >
              <t.icon className="w-3 h-3" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Reports Tab */}
        {tab === "reports" && (
          <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e1e2e]">
                  {["Action", "Target", "Reason", "Admin", "Date"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-black text-white/30 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e2e]">
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-3 bg-[#1e1e2e] rounded w-3/4" /></td>
                      ))}
                    </tr>
                  ))
                  : reports.length === 0
                  ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center">
                        <Shield className="w-8 h-8 text-white/10 mx-auto mb-3" />
                        <p className="text-[12px] text-white/20">No moderation logs yet</p>
                      </td>
                    </tr>
                  )
                  : reports.map(r => (
                    <tr key={r.id} className="hover:bg-[#1a1a2a] transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">{r.action}</span>
                      </td>
                      <td className="px-4 py-3 text-[12px] font-mono text-white/40">{r.target_id?.slice(0, 12) ?? "—"}</td>
                      <td className="px-4 py-3 text-[12px] text-white/50 max-w-[200px] truncate">{r.reason ?? "—"}</td>
                      <td className="px-4 py-3 text-[12px] text-white/30">{r.admin_id?.slice(0, 8) ?? "system"}</td>
                      <td className="px-4 py-3 text-[12px] text-white/30">{fmtDate(r.created_at)}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}

        {/* Bans Tab */}
        {tab === "bans" && (
          <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e1e2e]">
                  {["User", "Reason", "Banned At", "Expires", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-black text-white/30 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e2e]">
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-3 bg-[#1e1e2e] rounded w-3/4" /></td>
                      ))}
                    </tr>
                  ))
                  : bans.length === 0
                  ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center">
                        <BanIcon className="w-8 h-8 text-white/10 mx-auto mb-3" />
                        <p className="text-[12px] text-white/20">No active bans</p>
                      </td>
                    </tr>
                  )
                  : bans.map(b => (
                    <tr key={b.id} className="hover:bg-[#1a1a2a] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-red-600/20 border border-red-500/20 flex items-center justify-center text-[10px] font-black text-red-300 overflow-hidden flex-shrink-0">
                            {(b.user as any)?.avatar_url
                              ? <img src={(b.user as any).avatar_url} alt="" className="w-full h-full object-cover" />
                              : ((b.user as any)?.username?.[0] ?? "?").toUpperCase()
                            }
                          </div>
                          <span className="text-[12px] font-semibold text-white/80">@{(b.user as any)?.username ?? "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-white/50 max-w-[180px] truncate">{b.reason ?? "No reason"}</td>
                      <td className="px-4 py-3 text-[12px] text-white/30">{fmtDate(b.created_at)}</td>
                      <td className="px-4 py-3 text-[12px] text-white/30">
                        {b.expires_at ? fmtDate(b.expires_at) : "Permanent"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => unban(b.id, b.user_id)}
                          disabled={actionLoading === b.id}
                          className="px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                        >
                          Unban
                        </button>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}

        {/* Keywords Tab */}
        {tab === "keywords" && (
          <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e1e2e]">
                  {["Creator", "Keyword", "Added"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-black text-white/30 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e2e]">
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 3 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-3 bg-[#1e1e2e] rounded w-3/4" /></td>
                      ))}
                    </tr>
                  ))
                  : keywords.length === 0
                  ? (
                    <tr>
                      <td colSpan={3} className="py-16 text-center">
                        <Filter className="w-8 h-8 text-white/10 mx-auto mb-3" />
                        <p className="text-[12px] text-white/20">No keyword filters configured</p>
                      </td>
                    </tr>
                  )
                  : keywords.map(k => (
                    <tr key={k.id} className="hover:bg-[#1a1a2a] transition-colors">
                      <td className="px-4 py-3 text-[12px] text-white/60">@{(k.creator as any)?.username ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-mono font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded">{k.keyword}</span>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-white/30">{fmtDate(k.created_at)}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}

        {/* Live Reports */}
        {tab === "live" && (
          <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1e1e2e] flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <p className="text-[13px] font-black text-white">Recent Live Streams</p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e1e2e]">
                  {["Host", "Title", "Status", "Started"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-black text-white/30 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e2e]">
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-3 bg-[#1e1e2e] rounded w-3/4" /></td>
                      ))}
                    </tr>
                  ))
                  : flaggedLive.length === 0
                  ? <tr><td colSpan={4} className="py-16 text-center text-[12px] text-white/20">No streams found</td></tr>
                  : flaggedLive.map(l => (
                    <tr key={l.id} className="hover:bg-[#1a1a2a] transition-colors">
                      <td className="px-4 py-3 text-[12px] font-semibold text-white/80">
                        @{(l.host as any)?.username ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-white/50 max-w-[200px] truncate">{l.title ?? "Untitled"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          l.status === "live"
                            ? "text-red-400 bg-red-500/10"
                            : "text-white/25 bg-white/5"
                        }`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-white/30">{fmtDate(l.created_at)}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
