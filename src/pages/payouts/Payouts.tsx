import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { ArrowUpFromLine, Clock, CheckCircle, XCircle } from "lucide-react";

type PayoutTab = "pending" | "approved" | "rejected" | "all";

interface PayoutRequest {
  id: string;
  user_id: string;
  amount: number;
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  reference: string | null;
  status: string;
  created_at: string;
  user?: { username: string; avatar_url: string | null };
}

interface Toast { id: string; msg: string; type: "success" | "error"; }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export function Payouts() {
  const [tab, setTab] = useState<PayoutTab>("pending");
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pendingCount: 0, pendingTotal: 0, approvedToday: 0, rejected: 0 });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  function addToast(msg: string, type: "success" | "error" = "success") {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }

  useEffect(() => {
    (async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [pend, pendAmt, appToday, rej] = await Promise.all([
        supabase.from("payout_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("payout_requests").select("amount").eq("status", "pending"),
        supabase.from("payout_requests").select("*", { count: "exact", head: true }).eq("status", "approved").gte("updated_at", today.toISOString()),
        supabase.from("payout_requests").select("*", { count: "exact", head: true }).eq("status", "rejected"),
      ]);
      const pendingTotal = (pendAmt.data ?? []).reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0);
      setStats({ pendingCount: pend.count ?? 0, pendingTotal, approvedToday: appToday.count ?? 0, rejected: rej.count ?? 0 });
    })();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("payout_requests")
      .select("id,user_id,amount,bank_name,account_number,account_name,reference,status,created_at,user:profiles!user_id(username,avatar_url)")
      .order("created_at", { ascending: false })
      .limit(80);
    if (tab !== "all") q = q.eq("status", tab);
    const { data } = await q;
    setPayouts((data as unknown as PayoutRequest[]) ?? []);
    setLoading(false);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  async function approve(p: PayoutRequest) {
    setActionLoading(p.id + "_approve");
    const { error } = await supabase.from("payout_requests").update({ status: "approved" }).eq("id", p.id);
    if (!error) {
      setPayouts(prev => prev.map(x => x.id === p.id ? { ...x, status: "approved" } : x));
      addToast(`Payout of ₦${Number(p.amount).toLocaleString()} approved for @${(p.user as any)?.username}`);
    } else {
      addToast("Failed to approve payout", "error");
    }
    setActionLoading(null);
  }

  async function reject(p: PayoutRequest) {
    setActionLoading(p.id + "_reject");
    const { error } = await supabase.from("payout_requests").update({ status: "rejected" }).eq("id", p.id);
    if (!error) {
      setPayouts(prev => prev.map(x => x.id === p.id ? { ...x, status: "rejected" } : x));
      addToast("Payout rejected");
    }
    setActionLoading(null);
  }

  return (
    <div>
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-xl border text-[12px] font-semibold shadow-2xl ${
              t.type === "success"
                ? "bg-emerald-900/80 border-emerald-500/30 text-emerald-300"
                : "bg-red-900/80 border-red-500/30 text-red-300"
            }`}
          >
            {t.msg}
          </div>
        ))}
      </div>

      <PageHeader title="Payouts" sub="Withdrawal request management" />

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Pending Requests"  value={stats.pendingCount}                              icon={Clock}           color="#f59e0b" />
          <StatCard label="Pending Amount"    value={`₦${stats.pendingTotal.toLocaleString()}`}       icon={ArrowUpFromLine}  color="#7c3aed" />
          <StatCard label="Approved Today"    value={stats.approvedToday}                             icon={CheckCircle}     color="#10b981" />
          <StatCard label="Total Rejected"    value={stats.rejected}                                  icon={XCircle}         color="#ef4444" />
        </div>

        <div className="flex gap-1 bg-[#12121c] border border-[#1e1e2e] rounded-lg p-1 w-fit">
          {(["pending", "approved", "rejected", "all"] as PayoutTab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-[12px] font-semibold capitalize transition-all ${
                tab === t ? "bg-[#7c3aed] text-white" : "text-white/40 hover:text-white/70"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e1e2e]">
                {["User", "Amount", "Bank Details", "Reference", "Status", "Date", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-black text-white/30 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e2e]">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-3 bg-[#1e1e2e] rounded w-3/4" /></td>
                    ))}
                  </tr>
                ))
                : payouts.length === 0
                ? <tr><td colSpan={7} className="py-16 text-center text-[12px] text-white/20">No payout requests</td></tr>
                : payouts.map(p => (
                  <tr key={p.id} className="hover:bg-[#1a1a2a] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-purple-600/20 border border-purple-500/20 flex items-center justify-center text-[10px] font-black text-purple-300 overflow-hidden flex-shrink-0">
                          {(p.user as any)?.avatar_url
                            ? <img src={(p.user as any).avatar_url} alt="" className="w-full h-full object-cover" />
                            : ((p.user as any)?.username?.[0] ?? "?").toUpperCase()
                          }
                        </div>
                        <span className="text-[12px] font-semibold text-white/80">@{(p.user as any)?.username ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[13px] font-black text-white/90">
                      ₦{Number(p.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[12px] text-white/60">{p.bank_name ?? "—"}</p>
                      <p className="text-[11px] text-white/30">{p.account_number ?? ""} · {p.account_name ?? ""}</p>
                    </td>
                    <td className="px-4 py-3 text-[11px] font-mono text-white/30">{p.reference ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        p.status === "approved" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                        : p.status === "rejected" ? "text-red-400 bg-red-500/10 border-red-500/20"
                        : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-white/30">{fmtDate(p.created_at)}</td>
                    <td className="px-4 py-3">
                      {p.status === "pending" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => approve(p)}
                            disabled={!!actionLoading}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Approve
                          </button>
                          <button
                            onClick={() => reject(p)}
                            disabled={!!actionLoading}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                          >
                            <XCircle className="w-3 h-3" />
                            Reject
                          </button>
                        </div>
                      )}
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
