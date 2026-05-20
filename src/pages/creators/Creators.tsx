import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { ChevronDown } from "lucide-react";

type CreatorLevel = "new_creator" | "verified_creator" | "monetized_creator" | "pro_creator" | "partner_creator";

interface Creator {
  id: string;
  username: string;
  avatar_url: string | null;
  creator_level: CreatorLevel;
  is_verified: boolean;
  can_receive_gifts: boolean;
  can_use_camera_live: boolean;
  kyc_status?: string;
  live_count?: number;
  total_earnings?: number;
}

const LEVEL_META: Record<CreatorLevel, { label: string; color: string; bg: string }> = {
  new_creator:       { label: "New",       color: "#9ca3af", bg: "#9ca3af15" },
  verified_creator:  { label: "Verified",  color: "#3b82f6", bg: "#3b82f615" },
  monetized_creator: { label: "Monetized", color: "#10b981", bg: "#10b98115" },
  pro_creator:       { label: "Pro",       color: "#7c3aed", bg: "#7c3aed15" },
  partner_creator:   { label: "Partner",   color: "#f59e0b", bg: "#f59e0b15" },
};

const LEVELS: CreatorLevel[] = ["new_creator", "verified_creator", "monetized_creator", "pro_creator", "partner_creator"];

export function Creators() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("profiles")
      .select("id,username,avatar_url,creator_level,is_verified,can_receive_gifts,can_use_camera_live,kyc_status")
      .not("creator_level", "eq", "new_creator");

    if (levelFilter !== "all") q = q.eq("creator_level", levelFilter);

    const { data, error } = await q.order("created_at", { ascending: false }).limit(100);
    if (!error && data) {
      // Enrich with live count
      const ids = data.map((d: any) => d.id);
      const [liveCounts, earnings] = await Promise.all([
        supabase.from("active_lives").select("host_id").in("host_id", ids),
        supabase.from("payout_requests").select("user_id,amount").in("user_id", ids).eq("status", "approved"),
      ]);

      const liveMap: Record<string, number> = {};
      (liveCounts.data ?? []).forEach((l: any) => {
        liveMap[l.host_id] = (liveMap[l.host_id] ?? 0) + 1;
      });
      const earnMap: Record<string, number> = {};
      (earnings.data ?? []).forEach((e: any) => {
        earnMap[e.user_id] = (earnMap[e.user_id] ?? 0) + Number(e.amount ?? 0);
      });

      setCreators(data.map((d: any) => ({
        ...d,
        live_count: liveMap[d.id] ?? 0,
        total_earnings: earnMap[d.id] ?? 0,
      })));
    }
    setLoading(false);
  }, [levelFilter]);

  useEffect(() => { load(); }, [load]);

  async function changeLevel(id: string, level: CreatorLevel) {
    setActionLoading(id + "_level");
    await supabase.from("profiles").update({ creator_level: level }).eq("id", id);
    setCreators(prev => prev.map(c => c.id === id ? { ...c, creator_level: level } : c));
    setOpenDropdown(null);
    setActionLoading(null);
  }

  async function toggleGifts(c: Creator) {
    setActionLoading(c.id + "_gifts");
    await supabase.from("profiles").update({ can_receive_gifts: !c.can_receive_gifts }).eq("id", c.id);
    setCreators(prev => prev.map(x => x.id === c.id ? { ...x, can_receive_gifts: !x.can_receive_gifts } : x));
    setActionLoading(null);
  }

  async function toggleLiveBan(c: Creator) {
    setActionLoading(c.id + "_live");
    await supabase.from("profiles").update({ can_use_camera_live: !c.can_use_camera_live }).eq("id", c.id);
    setCreators(prev => prev.map(x => x.id === c.id ? { ...x, can_use_camera_live: !x.can_use_camera_live } : x));
    setActionLoading(null);
  }

  return (
    <div onClick={() => setOpenDropdown(null)}>
      <PageHeader title="Creators" sub={`${creators.length} creators`}>
        <select
          value={levelFilter}
          onChange={e => setLevelFilter(e.target.value)}
          className="bg-[#1e1e2e] border border-[#2a2a3e] rounded-lg px-3 py-2 text-[12px] text-white/70 focus:outline-none focus:border-purple-500/50"
        >
          <option value="all">All Levels</option>
          {LEVELS.map(l => <option key={l} value={l}>{LEVEL_META[l].label}</option>)}
        </select>
      </PageHeader>

      <div className="p-6">
        <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e1e2e]">
                {["Creator", "Level", "KYC", "Lives", "Earnings", "Gifts", "Cam Live", "Level Action"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-black text-white/30 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e2e]">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-3 bg-[#1e1e2e] rounded w-3/4" /></td>
                    ))}
                  </tr>
                ))
                : creators.length === 0
                ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-[12px] text-white/20">No creators found</td>
                  </tr>
                )
                : creators.map(c => {
                  const meta = LEVEL_META[c.creator_level] ?? LEVEL_META.new_creator;
                  return (
                    <tr key={c.id} className="hover:bg-[#1a1a2a] transition-colors">
                      {/* Creator */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/20 flex items-center justify-center text-[11px] font-black text-purple-300 overflow-hidden flex-shrink-0">
                            {c.avatar_url
                              ? <img src={c.avatar_url} alt="" className="w-full h-full object-cover" />
                              : (c.username?.[0] ?? "?").toUpperCase()
                            }
                          </div>
                          <span className="text-[12px] font-semibold text-white/80">@{c.username}</span>
                        </div>
                      </td>
                      {/* Level */}
                      <td className="px-4 py-3">
                        <span
                          className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                          style={{ color: meta.color, background: meta.bg }}
                        >
                          {meta.label}
                        </span>
                      </td>
                      {/* KYC */}
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          c.kyc_status === "approved"
                            ? "text-emerald-400 bg-emerald-500/10"
                            : c.kyc_status === "pending"
                            ? "text-amber-400 bg-amber-500/10"
                            : "text-white/25 bg-white/5"
                        }`}>
                          {c.kyc_status ?? "none"}
                        </span>
                      </td>
                      {/* Live count */}
                      <td className="px-4 py-3 text-[12px] text-white/50">{c.live_count}</td>
                      {/* Earnings */}
                      <td className="px-4 py-3 text-[12px] text-white/50">
                        ₦{(c.total_earnings ?? 0).toLocaleString()}
                      </td>
                      {/* Gifts toggle */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleGifts(c)}
                          disabled={actionLoading === c.id + "_gifts"}
                          className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                            c.can_receive_gifts
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                              : "bg-[#1e1e2e] text-white/40 border border-[#2a2a3e] hover:border-emerald-500/20"
                          }`}
                        >
                          {c.can_receive_gifts ? "ON" : "OFF"}
                        </button>
                      </td>
                      {/* Cam Live toggle */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleLiveBan(c)}
                          disabled={actionLoading === c.id + "_live"}
                          className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                            c.can_use_camera_live
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                          }`}
                        >
                          {c.can_use_camera_live ? "Allowed" : "Banned"}
                        </button>
                      </td>
                      {/* Level dropdown */}
                      <td className="px-4 py-3 relative" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setOpenDropdown(openDropdown === c.id ? null : c.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-[#1e1e2e] text-white/50 border border-[#2a2a3e] hover:border-purple-500/30 hover:text-purple-300 transition-all"
                        >
                          Change <ChevronDown className="w-3 h-3" />
                        </button>
                        {openDropdown === c.id && (
                          <div className="absolute right-4 top-full mt-1 z-50 bg-[#12121c] border border-[#2a2a3e] rounded-xl shadow-2xl py-1 min-w-[160px]">
                            {LEVELS.map(l => (
                              <button
                                key={l}
                                onClick={() => changeLevel(c.id, l)}
                                className={`w-full text-left px-3 py-2 text-[12px] hover:bg-[#1e1e2e] transition-colors ${
                                  c.creator_level === l ? "text-purple-400 font-bold" : "text-white/60"
                                }`}
                              >
                                {LEVEL_META[l].label}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
