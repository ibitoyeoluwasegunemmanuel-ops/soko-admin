import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { Wallet, Search } from "lucide-react";

type WalletTab = "wallets" | "transactions" | "logs";

interface WalletEntry {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  total_withdrawn: number;
  user?: { username: string; avatar_url: string | null };
}

interface Ledger {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
  user?: { username: string };
}

const TYPE_COLOR: Record<string, string> = {
  credit:      "text-emerald-400",
  debit:       "text-red-400",
  gift_sent:   "text-purple-400",
  gift_recv:   "text-pink-400",
  withdrawal:  "text-amber-400",
  purchase:    "text-blue-400",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function WalletPayments() {
  const [tab, setTab] = useState<WalletTab>("wallets");
  const [wallets, setWallets] = useState<WalletEntry[]>([]);
  const [ledger, setLedger] = useState<Ledger[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [totalBalance, setTotalBalance] = useState(0);

  const loadWallets = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("wallets")
      .select("id,user_id,balance,total_earned,total_withdrawn,user:profiles!user_id(username,avatar_url)")
      .order("balance", { ascending: false })
      .limit(100);
    const { data } = await q;
    const ws = (data as unknown as WalletEntry[]) ?? [];
    setWallets(ws);
    setTotalBalance(ws.reduce((s, w) => s + Number(w.balance ?? 0), 0));
    setLoading(false);
  }, []);

  const loadLedger = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("wallet_ledger")
      .select("id,user_id,amount,type,description,created_at,user:profiles!user_id(username)")
      .order("created_at", { ascending: false })
      .limit(100);
    setLedger((data as unknown as Ledger[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (tab === "wallets") loadWallets();
    if (tab === "transactions" || tab === "logs") loadLedger();
  }, [tab, loadWallets, loadLedger]);

  const filteredWallets = wallets.filter(w =>
    !search || (w.user as any)?.username?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredLedger = ledger.filter(l =>
    !search || (l.user as any)?.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Wallet & Payments" sub="Platform financial overview">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search username..."
            className="bg-[#1e1e2e] border border-[#2a2a3e] rounded-lg pl-9 pr-4 py-2 text-[12px] text-white/70 placeholder-white/20 focus:outline-none focus:border-purple-500/50 w-48"
          />
        </div>
      </PageHeader>

      <div className="p-6 space-y-5">
        {/* Platform total */}
        <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl p-5 flex items-center gap-5">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-[11px] text-white/30 font-semibold uppercase tracking-wider">Total Platform Balance</p>
            <p className="text-[28px] font-black text-white leading-none">₦{totalBalance.toLocaleString()}</p>
          </div>
          <div className="ml-auto grid grid-cols-2 gap-6 text-right">
            <div>
              <p className="text-[11px] text-white/25">Active Wallets</p>
              <p className="text-[16px] font-black text-white">{wallets.length}</p>
            </div>
            <div>
              <p className="text-[11px] text-white/25">Avg Balance</p>
              <p className="text-[16px] font-black text-white">
                ₦{wallets.length > 0 ? Math.round(totalBalance / wallets.length).toLocaleString() : "0"}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#12121c] border border-[#1e1e2e] rounded-lg p-1 w-fit">
          {[
            { id: "wallets",      label: "Wallets" },
            { id: "transactions", label: "Transactions" },
            { id: "logs",         label: "Payment Logs" },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as WalletTab)}
              className={`px-4 py-1.5 rounded-md text-[12px] font-semibold transition-all ${
                tab === t.id ? "bg-[#7c3aed] text-white" : "text-white/40 hover:text-white/70"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Wallets Table */}
        {tab === "wallets" && (
          <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e1e2e]">
                  {["User", "Balance", "Total Earned", "Total Withdrawn"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-black text-white/30 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e2e]">
                {loading
                  ? Array.from({ length: 7 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-3 bg-[#1e1e2e] rounded w-3/4" /></td>
                      ))}
                    </tr>
                  ))
                  : filteredWallets.length === 0
                  ? <tr><td colSpan={4} className="py-16 text-center text-[12px] text-white/20">No wallets found</td></tr>
                  : filteredWallets.map(w => (
                    <tr key={w.id} className="hover:bg-[#1a1a2a] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-purple-600/20 border border-purple-500/20 flex items-center justify-center text-[10px] font-black text-purple-300 overflow-hidden flex-shrink-0">
                            {(w.user as any)?.avatar_url
                              ? <img src={(w.user as any).avatar_url} alt="" className="w-full h-full object-cover" />
                              : ((w.user as any)?.username?.[0] ?? "?").toUpperCase()
                            }
                          </div>
                          <span className="text-[12px] font-semibold text-white/80">@{(w.user as any)?.username ?? w.user_id.slice(0, 8)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[12px] font-semibold text-white/80">
                        ₦{Number(w.balance ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-emerald-400/70">
                        ₦{Number(w.total_earned ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-amber-400/70">
                        ₦{Number(w.total_withdrawn ?? 0).toLocaleString()}
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}

        {/* Transactions / Logs Table */}
        {(tab === "transactions" || tab === "logs") && (
          <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e1e2e]">
                  {["User", "Amount", "Type", "Description", "Date"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-black text-white/30 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e2e]">
                {loading
                  ? Array.from({ length: 7 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-3 bg-[#1e1e2e] rounded w-3/4" /></td>
                      ))}
                    </tr>
                  ))
                  : filteredLedger.length === 0
                  ? <tr><td colSpan={5} className="py-16 text-center text-[12px] text-white/20">No transactions found</td></tr>
                  : filteredLedger.map(l => (
                    <tr key={l.id} className="hover:bg-[#1a1a2a] transition-colors">
                      <td className="px-4 py-3 text-[12px] font-semibold text-white/80">
                        @{(l.user as any)?.username ?? l.user_id.slice(0, 8)}
                      </td>
                      <td className={`px-4 py-3 text-[12px] font-bold ${Number(l.amount) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {Number(l.amount) >= 0 ? "+" : ""}₦{Math.abs(Number(l.amount)).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-semibold ${TYPE_COLOR[l.type] ?? "text-white/40"}`}>
                          {l.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-white/40 max-w-[200px] truncate">
                        {l.description ?? "—"}
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
