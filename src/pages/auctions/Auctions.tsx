import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { Gavel, Clock } from "lucide-react";

type AuctionStatus = "all" | "active" | "ended" | "upcoming";

interface Auction {
  id: string;
  title: string;
  starting_price: number;
  current_bid: number;
  bid_count: number;
  status: string;
  ends_at: string;
  created_at: string;
  seller_id: string;
  seller?: { username: string };
}

interface BidModal {
  auction: Auction;
  bids: any[];
  loading: boolean;
}

function fmtDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function timeLeft(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return `${h}h ${m}m`;
}

export function Auctions() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AuctionStatus>("all");
  const [bidModal, setBidModal] = useState<BidModal | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("auctions")
      .select("id,title,starting_price,current_bid,bid_count,status,ends_at,created_at,seller_id,seller:profiles!seller_id(username)")
      .order("created_at", { ascending: false })
      .limit(80);

    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setAuctions((data as unknown as Auction[]) ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function endAuction(id: string) {
    setActionLoading(id + "_end");
    await supabase.from("auctions").update({ status: "ended" }).eq("id", id);
    setAuctions(prev => prev.map(a => a.id === id ? { ...a, status: "ended" } : a));
    setActionLoading(null);
  }

  async function viewBids(auction: Auction) {
    setBidModal({ auction, bids: [], loading: true });
    const { data } = await supabase
      .from("auction_bids")
      .select("id,amount,created_at,bidder:profiles!bidder_id(username)")
      .eq("auction_id", auction.id)
      .order("amount", { ascending: false })
      .limit(20);
    setBidModal({ auction, bids: data ?? [], loading: false });
  }

  return (
    <div>
      {/* Bid Modal */}
      {bidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setBidModal(null)}>
          <div className="bg-[#12121c] border border-[#1e1e2e] rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[14px] font-black text-white">Bids — {bidModal.auction.title}</p>
              <button onClick={() => setBidModal(null)} className="text-white/30 hover:text-white/60 text-xl leading-none">×</button>
            </div>
            {bidModal.loading
              ? <div className="py-8 text-center text-[12px] text-white/30 animate-pulse">Loading bids...</div>
              : bidModal.bids.length === 0
              ? <div className="py-8 text-center text-[12px] text-white/20">No bids yet</div>
              : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {bidModal.bids.map((b: any, i) => (
                    <div key={b.id} className="flex items-center justify-between py-2 border-b border-[#1e1e2e]">
                      <div className="flex items-center gap-2">
                        <span className={`text-[12px] font-black ${i === 0 ? "text-amber-400" : "text-white/20"}`}>#{i + 1}</span>
                        <span className="text-[12px] text-white/60">@{b.bidder?.username ?? "—"}</span>
                      </div>
                      <span className={`text-[13px] font-black ${i === 0 ? "text-white" : "text-white/40"}`}>
                        ₦{Number(b.amount).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        </div>
      )}

      <PageHeader title="Auctions" sub={`${auctions.length} auctions`}>
        <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full">
          <Gavel className="w-3 h-3" />
          {auctions.filter(a => a.status === "active").length} Active
        </div>
      </PageHeader>

      <div className="p-6 space-y-4">
        {/* Filter tabs */}
        <div className="flex gap-1 bg-[#12121c] border border-[#1e1e2e] rounded-lg p-1 w-fit">
          {(["all", "active", "ended", "upcoming"] as AuctionStatus[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-[12px] font-semibold capitalize transition-all ${
                filter === f ? "bg-[#7c3aed] text-white" : "text-white/40 hover:text-white/70"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e1e2e]">
                {["Title", "Seller", "Current Bid", "Bids", "Ends At", "Time Left", "Status", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-black text-white/30 uppercase tracking-wider">{h}</th>
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
                : auctions.length === 0
                ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <Gavel className="w-8 h-8 text-white/10 mx-auto mb-3" />
                      <p className="text-[12px] text-white/20">No auctions found</p>
                    </td>
                  </tr>
                )
                : auctions.map(a => (
                  <tr key={a.id} className="hover:bg-[#1a1a2a] transition-colors">
                    <td className="px-4 py-3 text-[12px] font-semibold text-white/80 max-w-[140px] truncate">
                      {a.title ?? "Untitled"}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-white/50">@{(a.seller as any)?.username ?? "—"}</td>
                    <td className="px-4 py-3 text-[13px] font-black text-white/90">
                      ₦{Number(a.current_bid ?? a.starting_price ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-white/50">{a.bid_count ?? 0}</td>
                    <td className="px-4 py-3 text-[12px] text-white/30">{fmtDate(a.ends_at)}</td>
                    <td className="px-4 py-3">
                      {a.status === "active" ? (
                        <div className="flex items-center gap-1 text-[12px] text-amber-400">
                          <Clock className="w-3 h-3" />
                          {timeLeft(a.ends_at)}
                        </div>
                      ) : (
                        <span className="text-[12px] text-white/20">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        a.status === "active"
                          ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                          : a.status === "upcoming"
                          ? "text-blue-400 bg-blue-500/10 border border-blue-500/20"
                          : "text-white/25 bg-white/5 border border-white/10"
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewBids(a)}
                          className="px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-[#1e1e2e] text-white/50 border border-[#2a2a3e] hover:border-purple-500/30 hover:text-purple-300 transition-all"
                        >
                          Bids
                        </button>
                        {a.status === "active" && (
                          <button
                            onClick={() => endAuction(a.id)}
                            disabled={actionLoading === a.id + "_end"}
                            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                          >
                            End
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
