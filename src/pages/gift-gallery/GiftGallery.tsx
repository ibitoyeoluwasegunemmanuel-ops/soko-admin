import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { Gift, Star, Trophy, RefreshCw, Edit2 } from "lucide-react";

interface GiftItem {
  id: string;
  name: string;
  coin_cost: number;
  animation_url?: string;
  icon_url?: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  is_active: boolean;
  weekly_limit?: number;
  total_sent?: number;
}

const RARITY_STYLE: Record<string, string> = {
  common:    "text-white/50 bg-white/5 border-white/10",
  rare:      "text-blue-400 bg-blue-500/10 border-blue-500/25",
  epic:      "text-purple-400 bg-purple-500/10 border-purple-500/25",
  legendary: "text-amber-400 bg-amber-500/10 border-amber-500/25",
};

type Tab = "gallery" | "leaderboard" | "config";

export function GiftGallery() {
  const [tab, setTab] = useState<Tab>("gallery");
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, sentThisWeek: 0, topGift: "—" });
  const [resetDay, setResetDay] = useState("Monday");
  const [resetTime, setResetTime] = useState("00:00");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const [giftR, leadR] = await Promise.all([
        supabase.from("gifts").select("*").order("coin_cost", { ascending: true }),
        supabase.from("gift_transactions").select("sender:profiles!sender_id(username,avatar_url), total_coins_spent:coin_cost.sum(), total_gifts:id.count()").limit(10),
      ]);
      const list: GiftItem[] = giftR.data ?? [];
      setGifts(list);
      const leadList = leadR.data ?? [];
      setLeaders(leadList);
      const active = list.filter(g => g.is_active);
      const topByName = list.reduce((best: any, g: any) => (Number(g.total_sent ?? 0) > Number(best?.total_sent ?? 0)) ? g : best, null);
      setStats({ total: list.length, active: active.length, sentThisWeek: list.reduce((s, g) => s + Number(g.total_sent ?? 0), 0), topGift: topByName?.name ?? "—" });
      setLoading(false);
    }
    load();
  }, []);

  async function toggleGift(id: string, current: boolean) {
    await supabase.from("gifts").update({ is_active: !current }).eq("id", id);
    setGifts(prev => prev.map(g => g.id === id ? { ...g, is_active: !current } : g));
  }

  async function saveConfig() {
    setSaving(true);
    await supabase.from("app_config").upsert({ key: "gallery_reset_day", value: resetDay });
    await supabase.from("app_config").upsert({ key: "gallery_reset_time", value: resetTime });
    setSaving(false);
  }

  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const RARITY_ORDER = ["common", "rare", "epic", "legendary"];

  return (
    <div>
      <PageHeader title="Gift Gallery" sub="Weekly gift configuration, top senders, and reward cycles" />

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Total Gifts"      value={stats.total}          icon={Gift}      color="#7c3aed" />
          <StatCard label="Active Gifts"     value={stats.active}         icon={Star}      color="#10b981" />
          <StatCard label="Sent This Week"   value={stats.sentThisWeek}   icon={Trophy}    color="#f59e0b" />
          <StatCard label="Top Gift"         value={stats.topGift}        icon={Gift}      color="#3b82f6" />
        </div>

        <div className="flex gap-1 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg p-1 w-fit">
          {(["gallery", "leaderboard", "config"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-[12px] font-semibold capitalize transition-all ${tab === t ? "bg-[#7c3aed] text-white" : "text-white/40 hover:text-white/70"}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === "gallery" && (
          <div className="space-y-3">
            {RARITY_ORDER.map(rarity => {
              const slice = gifts.filter(g => g.rarity === rarity);
              if (slice.length === 0) return null;
              return (
                <div key={rarity} className="bg-[#12121c] border border-[#1e1e2e] rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#1e1e2e] flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border capitalize ${RARITY_STYLE[rarity]}`}>{rarity}</span>
                    <span className="text-[11px] text-white/30">{slice.length} gifts</span>
                  </div>
                  <div className="grid grid-cols-4 gap-0 divide-x divide-[#1e1e2e]">
                    {slice.map(g => (
                      <div key={g.id} className="p-4 flex flex-col gap-2 hover:bg-[#1a1a2a] transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-[#1e1e2e] flex items-center justify-center text-2xl mx-auto">
                          {g.icon_url ? <img src={g.icon_url} alt="" className="w-10 h-10 object-contain" /> : "🎁"}
                        </div>
                        <p className="text-[12px] font-semibold text-white text-center">{g.name}</p>
                        <p className="text-[11px] text-purple-400 font-bold text-center">{g.coin_cost.toLocaleString()} coins</p>
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => toggleGift(g.id, g.is_active)}
                            className={`flex-1 py-1 rounded-lg text-[10px] font-semibold border transition-all ${g.is_active ? "text-red-400 border-red-500/25 hover:bg-red-500/10" : "text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/10"}`}>
                            {g.is_active ? "Disable" : "Enable"}
                          </button>
                          <button className="p-1 rounded-lg text-white/30 border border-white/10 hover:bg-white/5">
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {!loading && gifts.length === 0 && (
              <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl p-12 text-center">
                <Gift className="w-8 h-8 text-white/10 mx-auto mb-3" />
                <p className="text-[12px] text-white/20">No gifts configured yet</p>
              </div>
            )}
          </div>
        )}

        {tab === "leaderboard" && (
          <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1e1e2e]">
              <p className="text-[13px] font-black text-white">Top Gift Senders (This Week)</p>
            </div>
            {leaders.length === 0 ? (
              <p className="text-center text-white/20 py-8 text-[12px]">No gift data yet</p>
            ) : (
              <div className="divide-y divide-[#1e1e2e]">
                {leaders.map((l, i) => (
                  <div key={i} className="px-4 py-3 flex items-center gap-3 hover:bg-[#1a1a2a]">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0 ${i === 0 ? "bg-amber-500/20 text-amber-400" : i === 1 ? "bg-white/10 text-white/50" : i === 2 ? "bg-orange-500/10 text-orange-400" : "bg-white/5 text-white/20"}`}>
                      {i + 1}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-[#1e1e2e] overflow-hidden flex-shrink-0">
                      {l.sender?.avatar_url && <img src={l.sender.avatar_url} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <span className="flex-1 text-[12px] font-semibold text-white">@{l.sender?.username ?? "—"}</span>
                    <div className="text-right">
                      <p className="text-[12px] text-purple-400 font-bold">{Number(l.total_coins_spent ?? 0).toLocaleString()} coins</p>
                      <p className="text-[10px] text-white/30">{l.total_gifts ?? 0} gifts sent</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "config" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <RefreshCw className="w-4 h-4 text-purple-400" />
                <p className="text-[14px] font-black text-white">Weekly Reset Schedule</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] text-white/40 mb-1.5">Reset Day</label>
                  <select value={resetDay} onChange={e => setResetDay(e.target.value)}
                    className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2 text-[12px] text-white focus:outline-none focus:border-purple-500/50">
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 mb-1.5">Reset Time (WAT)</label>
                  <input type="time" value={resetTime} onChange={e => setResetTime(e.target.value)}
                    className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2 text-[12px] text-white focus:outline-none focus:border-purple-500/50" />
                </div>
                <button onClick={saveConfig} disabled={saving}
                  className="w-full py-2 rounded-lg text-[12px] font-semibold bg-[#7c3aed] text-white hover:bg-[#6d28d9] transition-all disabled:opacity-50">
                  {saving ? "Saving…" : "Save Schedule"}
                </button>
              </div>
            </div>

            <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-4 h-4 text-amber-400" />
                <p className="text-[14px] font-black text-white">Reward Tiers</p>
              </div>
              <div className="space-y-3">
                {[
                  { rank: "#1", reward: "₦50,000 + Legendary badge", color: "#f59e0b" },
                  { rank: "#2", reward: "₦25,000 + Epic badge",      color: "#a78bfa" },
                  { rank: "#3", reward: "₦10,000 + Rare badge",      color: "#f97316" },
                  { rank: "#4–10", reward: "₦2,500 + Common badge",  color: "#6b7280" },
                ].map(r => (
                  <div key={r.rank} className="flex items-center justify-between p-3 rounded-lg bg-[#0a0a0f] border border-[#1e1e2e]">
                    <span className="text-[12px] font-black" style={{ color: r.color }}>{r.rank}</span>
                    <span className="text-[11px] text-white/50">{r.reward}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
