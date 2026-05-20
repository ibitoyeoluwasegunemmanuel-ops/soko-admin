import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { Package, DollarSign, Clock, AlertTriangle } from "lucide-react";

type OrderStatus = "all" | "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | "disputed";

interface Order {
  id: string;
  order_ref: string | null;
  total_amount: number;
  status: string;
  created_at: string;
  buyer_id: string;
  seller_id: string;
  product_id: string;
  buyer?: { username: string };
  seller?: { username: string };
  product?: { title: string };
}

const STATUS_TABS: OrderStatus[] = ["all", "pending", "confirmed", "shipped", "delivered", "cancelled", "disputed"];

const STATUS_COLOR: Record<string, string> = {
  pending:   "text-amber-400 bg-amber-500/10 border-amber-500/20",
  confirmed: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  shipped:   "text-purple-400 bg-purple-500/10 border-purple-500/20",
  delivered: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  cancelled: "text-white/30 bg-white/5 border-white/10",
  disputed:  "text-red-400 bg-red-500/10 border-red-500/20",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<OrderStatus>("all");
  const [stats, setStats] = useState({ total: 0, revenue: 0, pending: 0, disputes: 0 });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [tot, pend, disp, rev] = await Promise.all([
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "disputed"),
        supabase.from("orders").select("total_amount").eq("status", "delivered"),
      ]);
      const revenue = (rev.data ?? []).reduce((s: number, o: any) => s + Number(o.total_amount ?? 0), 0);
      setStats({ total: tot.count ?? 0, revenue, pending: pend.count ?? 0, disputes: disp.count ?? 0 });
    })();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("orders")
      .select("id,order_ref,total_amount,status,created_at,buyer_id,seller_id,product_id,buyer:profiles!buyer_id(username),seller:profiles!seller_id(username),product:products!product_id(title)")
      .order("created_at", { ascending: false })
      .limit(80);
    if (tab !== "all") q = q.eq("status", tab);
    const { data } = await q;
    setOrders((data as unknown as Order[]) ?? []);
    setLoading(false);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  async function forceComplete(id: string) {
    setActionLoading(id + "_complete");
    await supabase.from("orders").update({ status: "delivered" }).eq("id", id);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "delivered" } : o));
    setActionLoading(null);
  }

  async function cancelOrder(id: string) {
    setActionLoading(id + "_cancel");
    await supabase.from("orders").update({ status: "cancelled" }).eq("id", id);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "cancelled" } : o));
    setActionLoading(null);
  }

  return (
    <div>
      <PageHeader title="Orders" sub={`${stats.total.toLocaleString()} total orders`} />

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Total Orders"  value={stats.total}                            icon={Package}       color="#7c3aed" />
          <StatCard label="Revenue"       value={`₦${stats.revenue.toLocaleString()}`}  icon={DollarSign}    color="#10b981" />
          <StatCard label="Pending"       value={stats.pending}                          icon={Clock}         color="#f59e0b" />
          <StatCard label="Disputes"      value={stats.disputes}                         icon={AlertTriangle} color="#ef4444" />
        </div>

        {/* Tab bar */}
        <div className="flex flex-wrap gap-1 bg-[#12121c] border border-[#1e1e2e] rounded-lg p-1 w-fit">
          {STATUS_TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-semibold capitalize transition-all ${
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
                {["Order Ref", "Product", "Buyer", "Seller", "Amount", "Status", "Date", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-black text-white/30 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e2e]">
              {loading
                ? Array.from({ length: 7 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-3 bg-[#1e1e2e] rounded w-3/4" /></td>
                    ))}
                  </tr>
                ))
                : orders.length === 0
                ? <tr><td colSpan={8} className="py-16 text-center text-[12px] text-white/20">No orders found</td></tr>
                : orders.map(o => (
                  <tr key={o.id} className="hover:bg-[#1a1a2a] transition-colors">
                    <td className="px-4 py-3 text-[12px] font-mono text-white/60">
                      {o.order_ref ?? o.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-white/60 max-w-[120px] truncate">
                      {(o.product as any)?.title ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-white/60">@{(o.buyer as any)?.username ?? "—"}</td>
                    <td className="px-4 py-3 text-[12px] text-white/60">@{(o.seller as any)?.username ?? "—"}</td>
                    <td className="px-4 py-3 text-[12px] font-semibold text-white/80">
                      ₦{Number(o.total_amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLOR[o.status] ?? "text-white/30 bg-white/5 border-white/10"}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-white/40">{fmtDate(o.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {["pending", "confirmed", "shipped"].includes(o.status) && (
                          <button
                            onClick={() => forceComplete(o.id)}
                            disabled={!!actionLoading}
                            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                          >
                            Complete
                          </button>
                        )}
                        {["pending", "confirmed"].includes(o.status) && (
                          <button
                            onClick={() => cancelOrder(o.id)}
                            disabled={!!actionLoading}
                            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                          >
                            Cancel
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
