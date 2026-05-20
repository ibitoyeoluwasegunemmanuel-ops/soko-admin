import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";

type GiftTab = "config" | "gifters" | "packages" | "history";

interface TopGifter {
  user_id: string;
  total_points: number;
  gifts_sent: number;
  user?: { username: string; avatar_url: string | null };
}

interface LedgerEntry {
  id: string;
  user_id: string;
  amount: number;
  description: string | null;
  created_at: string;
  user?: { username: string };
}

const GIFT_CATALOG = [
  { id: "g1",  name: "Rose",         coins: 1,      category: "basic",    emoji: "🌹" },
  { id: "g2",  name: "Heart",        coins: 5,      category: "basic",    emoji: "❤️" },
  { id: "g3",  name: "Thumbs Up",    coins: 10,     category: "basic",    emoji: "👍" },
  { id: "g4",  name: "Fire",         coins: 20,     category: "standard", emoji: "🔥" },
  { id: "g5",  name: "Diamond",      coins: 50,     category: "standard", emoji: "💎" },
  { id: "g6",  name: "Crown",        coins: 100,    category: "premium",  emoji: "👑" },
  { id: "g7",  name: "Rocket",       coins: 200,    category: "premium",  emoji: "🚀" },
  { id: "g8",  name: "Galaxy",       coins: 500,    category: "epic",     emoji: "🌌" },
  { id: "g9",  name: "Rainbow",      coins: 1000,   category: "epic",     emoji: "🌈" },
  { id: "g10", name: "Lightning",    coins: 2000,   category: "legendary",emoji: "⚡" },
  { id: "g11", name: "Dragon",       coins: 5000,   category: "legendary",emoji: "🐉" },
  { id: "g12", name: "Universe",     coins: 10000,  category: "legendary",emoji: "🌍" },
];

const COIN_PACKAGES = [
  { id: "p1", coins: 100,   price: 500,   bonus: 0,    popular: false },
  { id: "p2", coins: 500,   price: 2000,  bonus: 50,   popular: false },
  { id: "p3", coins: 1000,  price: 3500,  bonus: 150,  popular: true  },
  { id: "p4", coins: 5000,  price: 15000, bonus: 1000, popular: false },
  { id: "p5", coins: 10000, price: 25000, bonus: 3000, popular: false },
  { id: "p6", coins: 50000, price: 100000,bonus: 20000,popular: false },
];

const CAT_COLOR: Record<string, string> = {
  basic:    "text-white/40 bg-white/5",
  standard: "text-blue-400 bg-blue-500/10",
  premium:  "text-purple-400 bg-purple-500/10",
  epic:     "text-amber-400 bg-amber-500/10",
  legendary:"text-orange-400 bg-orange-500/10",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

export function CoinsGifts() {
  const [tab, setTab] = useState<GiftTab>("config");
  const [topGifters, setTopGifters] = useState<TopGifter[]>([]);
  const [history, setHistory] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const loadGifters = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("league_points")
      .select("user_id,total_points,gifts_sent,user:profiles!user_id(username,avatar_url)")
      .order("total_points", { ascending: false })
      .limit(20);
    setTopGifters((data as unknown as TopGifter[]) ?? []);
    setLoading(false);
  }, []);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("wallet_ledger")
      .select("id,user_id,amount,description,created_at,user:profiles!user_id(username)")
      .eq("type", "gift_sent")
      .order("created_at", { ascending: false })
      .limit(100);
    setHistory((data as unknown as LedgerEntry[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (tab === "gifters") loadGifters();
    if (tab === "history") loadHistory();
  }, [tab, loadGifters, loadHistory]);

  return (
    <div>
      <PageHeader title="Coins & Gifts" sub="Gift economy management" />

      <div className="p-6 space-y-4">
        <div className="flex gap-1 bg-[#12121c] border border-[#1e1e2e] rounded-lg p-1 w-fit">
          {[
            { id: "config",   label: "Gift Config" },
            { id: "gifters",  label: "Top Gifters" },
            { id: "packages", label: "Coin Packages" },
            { id: "history",  label: "Gift History" },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as GiftTab)}
              className={`px-4 py-1.5 rounded-md text-[12px] font-semibold transition-all ${
                tab === t.id ? "bg-[#7c3aed] text-white" : "text-white/40 hover:text-white/70"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Gift Config */}
        {tab === "config" && (
          <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1e1e2e]">
              <p className="text-[13px] font-black text-white">{GIFT_CATALOG.length} Gifts Configured</p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e1e2e]">
                  {["Gift", "Coins", "Naira Value", "Category"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-black text-white/30 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e2e]">
                {GIFT_CATALOG.map(g => (
                  <tr key={g.id} className="hover:bg-[#1a1a2a] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{g.emoji}</span>
                        <span className="text-[12px] font-semibold text-white/80">{g.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] font-bold text-amber-400">{g.coins.toLocaleString()} coins</span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-white/40">
                      ≈ ₦{(g.coins * 3.5).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${CAT_COLOR[g.category]}`}>
                        {g.category}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Top Gifters */}
        {tab === "gifters" && (
          <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e1e2e]">
                  {["Rank", "User", "Points", "Gifts Sent"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-black text-white/30 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e2e]">
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-3 bg-[#1e1e2e] rounded w-3/4" /></td>
                      ))}
                    </tr>
                  ))
                  : topGifters.length === 0
                  ? <tr><td colSpan={4} className="py-16 text-center text-[12px] text-white/20">No gifters data yet</td></tr>
                  : topGifters.map((g, i) => (
                    <tr key={g.user_id} className="hover:bg-[#1a1a2a] transition-colors">
                      <td className="px-4 py-3">
                        <span className={`text-[13px] font-black ${
                          i === 0 ? "text-amber-400" : i === 1 ? "text-white/60" : i === 2 ? "text-orange-400" : "text-white/25"
                        }`}>
                          #{i + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-purple-600/20 border border-purple-500/20 flex items-center justify-center text-[10px] font-black text-purple-300 overflow-hidden flex-shrink-0">
                            {(g.user as any)?.avatar_url
                              ? <img src={(g.user as any).avatar_url} alt="" className="w-full h-full object-cover" />
                              : ((g.user as any)?.username?.[0] ?? "?").toUpperCase()
                            }
                          </div>
                          <span className="text-[12px] font-semibold text-white/80">@{(g.user as any)?.username ?? "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[12px] font-bold text-purple-400">{(g.total_points ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-[12px] text-white/50">{(g.gifts_sent ?? 0).toLocaleString()}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}

        {/* Coin Packages */}
        {tab === "packages" && (
          <div className="grid grid-cols-3 gap-4">
            {COIN_PACKAGES.map(pkg => (
              <div
                key={pkg.id}
                className={`bg-[#12121c] border rounded-xl p-5 relative ${
                  pkg.popular ? "border-purple-500/40" : "border-[#1e1e2e]"
                }`}
              >
                {pkg.popular && (
                  <span className="absolute -top-2.5 left-4 text-[10px] font-black text-white bg-[#7c3aed] px-2.5 py-0.5 rounded-full">
                    POPULAR
                  </span>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🪙</span>
                  <p className="text-[20px] font-black text-amber-400">{pkg.coins.toLocaleString()}</p>
                  <p className="text-[12px] text-white/30">coins</p>
                </div>
                {pkg.bonus > 0 && (
                  <p className="text-[11px] text-emerald-400 font-semibold mb-2">+{pkg.bonus.toLocaleString()} bonus coins</p>
                )}
                <p className="text-[22px] font-black text-white">₦{pkg.price.toLocaleString()}</p>
                <p className="text-[11px] text-white/25 mt-0.5">
                  ≈ ₦{Math.round(pkg.price / (pkg.coins + pkg.bonus))}/coin
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Gift History */}
        {tab === "history" && (
          <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e1e2e]">
                  {["User", "Amount", "Description", "Date"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-black text-white/30 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e2e]">
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-3 bg-[#1e1e2e] rounded w-3/4" /></td>
                      ))}
                    </tr>
                  ))
                  : history.length === 0
                  ? <tr><td colSpan={4} className="py-16 text-center text-[12px] text-white/20">No gift history yet</td></tr>
                  : history.map(h => (
                    <tr key={h.id} className="hover:bg-[#1a1a2a] transition-colors">
                      <td className="px-4 py-3 text-[12px] font-semibold text-white/80">
                        @{(h.user as any)?.username ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-[12px] font-bold text-purple-400">
                        {Math.abs(Number(h.amount)).toLocaleString()} coins
                      </td>
                      <td className="px-4 py-3 text-[12px] text-white/40 max-w-[200px] truncate">
                        {h.description ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-white/30">{fmtDate(h.created_at)}</td>
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
