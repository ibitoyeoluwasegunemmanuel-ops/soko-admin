import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { Trophy, RefreshCw } from "lucide-react";

interface LeagueEntry {
  id: string;
  user_id: string;
  total_points: number;
  gifts_received: number;
  products_sold: number;
  week_number: number;
  season: string | null;
  created_at: string;
  user?: { username: string; avatar_url: string | null; creator_level: string };
}

const RANK_META = [
  { min: 1,  max: 1,  label: "Champion",   color: "#f59e0b", icon: "🏆" },
  { min: 2,  max: 3,  label: "Elite",      color: "#c084fc", icon: "💜" },
  { min: 4,  max: 10, label: "Pro",        color: "#60a5fa", icon: "💙" },
  { min: 11, max: 25, label: "Rising",     color: "#34d399", icon: "💚" },
  { min: 26, max: 50, label: "Starter",    color: "#9ca3af", icon: "⭐" },
];

function getRankMeta(rank: number) {
  return RANK_META.find(r => rank >= r.min && rank <= r.max) ?? RANK_META[RANK_META.length - 1];
}

function getCurrentWeek() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
}

function getNextReset() {
  const now = new Date();
  const monday = new Date(now);
  const day = monday.getDay();
  const daysUntilMonday = (8 - day) % 7 || 7;
  monday.setDate(monday.getDate() + daysUntilMonday);
  monday.setHours(0, 0, 0, 0);
  const diff = monday.getTime() - now.getTime();
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  return `${days}d ${hours}h`;
}

export function League() {
  const [entries, setEntries] = useState<LeagueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekFilter, setWeekFilter] = useState<"current" | "all">("current");

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("league_points")
      .select("id,user_id,total_points,gifts_received,products_sold,week_number,season,created_at,user:profiles!user_id(username,avatar_url,creator_level)")
      .order("total_points", { ascending: false })
      .limit(50);

    if (weekFilter === "current") {
      q = q.eq("week_number", getCurrentWeek());
    }

    const { data } = await q;
    setEntries((data as unknown as LeagueEntry[]) ?? []);
    setLoading(false);
  }, [weekFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <PageHeader title="League & Rankings" sub={`Top creators · Week ${getCurrentWeek()}`}>
        <div className="flex items-center gap-2">
          <div className="text-[12px] text-white/30 bg-[#12121c] border border-[#1e1e2e] px-3 py-1.5 rounded-lg">
            Next reset in <span className="text-amber-400 font-bold">{getNextReset()}</span>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="p-1.5 rounded-lg bg-[#12121c] border border-[#1e1e2e] text-white/40 hover:text-white/70 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </PageHeader>

      <div className="p-6 space-y-4">
        {/* Top 3 podium */}
        {!loading && entries.length >= 3 && (
          <div className="grid grid-cols-3 gap-4 mb-2">
            {[1, 0, 2].map((idx, podiumPos) => {
              const e = entries[idx];
              if (!e) return <div key={podiumPos} />;
              const rank = idx + 1;
              const rankMeta = getRankMeta(rank);
              const heights = ["h-24", "h-28", "h-20"];
              return (
                <div
                  key={e.user_id}
                  className={`bg-[#12121c] border rounded-xl p-4 flex flex-col items-center justify-end ${heights[podiumPos]} ${
                    rank === 1 ? "border-amber-500/30" : "border-[#1e1e2e]"
                  }`}
                  style={{ borderColor: rank === 1 ? "#f59e0b40" : undefined }}
                >
                  <span className="text-2xl mb-1">{rankMeta.icon}</span>
                  <div className="w-10 h-10 rounded-full bg-purple-600/20 border-2 overflow-hidden flex items-center justify-center text-[12px] font-black text-purple-300 mb-1"
                    style={{ borderColor: `${rankMeta.color}40` }}>
                    {(e.user as any)?.avatar_url
                      ? <img src={(e.user as any).avatar_url} alt="" className="w-full h-full object-cover" />
                      : ((e.user as any)?.username?.[0] ?? "?").toUpperCase()
                    }
                  </div>
                  <p className="text-[11px] font-bold text-white/70 truncate max-w-full">@{(e.user as any)?.username}</p>
                  <p className="text-[13px] font-black" style={{ color: rankMeta.color }}>
                    {(e.total_points ?? 0).toLocaleString()} pts
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-1 bg-[#12121c] border border-[#1e1e2e] rounded-lg p-1 w-fit">
          {[
            { id: "current", label: "This Week" },
            { id: "all",     label: "All Time" },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setWeekFilter(t.id as "current" | "all")}
              className={`px-4 py-1.5 rounded-md text-[12px] font-semibold transition-all ${
                weekFilter === t.id ? "bg-[#7c3aed] text-white" : "text-white/40 hover:text-white/70"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e1e2e]">
                {["Rank", "User", "Points", "Gifts Received", "Products Sold", "Week", "Tier"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-black text-white/30 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e2e]">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-3 bg-[#1e1e2e] rounded w-3/4" /></td>
                    ))}
                  </tr>
                ))
                : entries.length === 0
                ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <Trophy className="w-8 h-8 text-white/10 mx-auto mb-3" />
                      <p className="text-[12px] text-white/20">No rankings yet this week</p>
                      <p className="text-[11px] text-white/10 mt-1">Points accumulate as creators receive gifts</p>
                    </td>
                  </tr>
                )
                : entries.map((e, i) => {
                  const rank = i + 1;
                  const meta = getRankMeta(rank);
                  return (
                    <tr key={e.user_id} className="hover:bg-[#1a1a2a] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{meta.icon}</span>
                          <span className="text-[13px] font-black" style={{ color: meta.color }}>#{rank}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/20 flex items-center justify-center text-[11px] font-black text-purple-300 overflow-hidden flex-shrink-0">
                            {(e.user as any)?.avatar_url
                              ? <img src={(e.user as any).avatar_url} alt="" className="w-full h-full object-cover" />
                              : ((e.user as any)?.username?.[0] ?? "?").toUpperCase()
                            }
                          </div>
                          <span className="text-[12px] font-semibold text-white/80">@{(e.user as any)?.username ?? "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[13px] font-black" style={{ color: meta.color }}>
                          {(e.total_points ?? 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-white/50">{(e.gifts_received ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-[12px] text-white/50">{(e.products_sold ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-[12px] text-white/30">W{e.week_number}</td>
                      <td className="px-4 py-3">
                        <span
                          className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                          style={{ color: meta.color, background: `${meta.color}15` }}
                        >
                          {meta.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] text-white/20">Tiers:</span>
          {RANK_META.map(r => (
            <div key={r.label} className="flex items-center gap-1.5">
              <span className="text-xs">{r.icon}</span>
              <span className="text-[11px] font-semibold" style={{ color: r.color }}>{r.label}</span>
              <span className="text-[10px] text-white/20">#{r.min}{r.min !== r.max ? `–${r.max}` : ""}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
