import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { ShoppingBag, Package, AlertTriangle, CheckCircle } from "lucide-react";

type MktTab = "products" | "sellers" | "reports";

interface Product {
  id: string;
  title: string;
  price: number;
  category: string;
  is_active: boolean;
  image_url: string | null;
  created_at: string;
  seller_id: string;
  seller?: { username: string };
}

interface Seller {
  id: string;
  username: string;
  avatar_url: string | null;
  is_vendor: boolean;
  is_verified: boolean;
  trust_score?: number;
  product_count?: number;
  order_count?: number;
}

interface Stats {
  total: number;
  active: number;
  pending: number;
  flagged: number;
}

export function Marketplace() {
  const [tab, setTab] = useState<MktTab>("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, pending: 0, flagged: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    const [total, active, pending, flagged] = await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", false),
      supabase.from("products").select("*", { count: "exact", head: true }).eq("is_flagged", true),
    ]);
    setStats({
      total: total.count ?? 0,
      active: active.count ?? 0,
      pending: pending.count ?? 0,
      flagged: flagged.count ?? 0,
    });
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("id,title,price,category,is_active,image_url,created_at,seller_id,seller:profiles!seller_id(username)")
      .order("created_at", { ascending: false })
      .limit(50);
    setProducts((data as unknown as Product[]) ?? []);
    setLoading(false);
  }, []);

  const loadSellers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id,username,avatar_url,is_vendor,is_verified,trust_score")
      .eq("is_vendor", true)
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      const ids = data.map((d: any) => d.id);
      const [prods, orders] = await Promise.all([
        supabase.from("products").select("seller_id").in("seller_id", ids),
        supabase.from("orders").select("seller_id").in("seller_id", ids),
      ]);
      const prodMap: Record<string, number> = {};
      const ordMap: Record<string, number> = {};
      (prods.data ?? []).forEach((p: any) => { prodMap[p.seller_id] = (prodMap[p.seller_id] ?? 0) + 1; });
      (orders.data ?? []).forEach((o: any) => { ordMap[o.seller_id] = (ordMap[o.seller_id] ?? 0) + 1; });
      setSellers(data.map((d: any) => ({ ...d, product_count: prodMap[d.id] ?? 0, order_count: ordMap[d.id] ?? 0 })));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStats();
    if (tab === "products") loadProducts();
    if (tab === "sellers") loadSellers();
  }, [tab, loadStats, loadProducts, loadSellers]);

  async function approveProduct(id: string) {
    setActionLoading(id + "_approve");
    await supabase.from("products").update({ is_active: true }).eq("id", id);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: true } : p));
    loadStats();
    setActionLoading(null);
  }

  async function removeProduct(id: string) {
    setActionLoading(id + "_remove");
    await supabase.from("products").update({ is_active: false }).eq("id", id);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: false } : p));
    loadStats();
    setActionLoading(null);
  }

  return (
    <div>
      <PageHeader title="Marketplace" sub="Products, sellers & reports" />

      <div className="p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Total Products"    value={stats.total}   icon={Package}       color="#7c3aed" />
          <StatCard label="Active Products"   value={stats.active}  icon={CheckCircle}   color="#10b981" />
          <StatCard label="Pending Approval"  value={stats.pending} icon={ShoppingBag}   color="#f59e0b" />
          <StatCard label="Flagged Products"  value={stats.flagged} icon={AlertTriangle}  color="#ef4444" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#12121c] border border-[#1e1e2e] rounded-lg p-1 w-fit">
          {[
            { id: "products", label: "Products" },
            { id: "sellers",  label: "Sellers" },
            { id: "reports",  label: "Reports" },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as MktTab)}
              className={`px-4 py-1.5 rounded-md text-[12px] font-semibold transition-all ${
                tab === t.id ? "bg-[#7c3aed] text-white" : "text-white/40 hover:text-white/70"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Products Table */}
        {tab === "products" && (
          <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e1e2e]">
                  {["Product", "Price", "Seller", "Category", "Status", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-black text-white/30 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e2e]">
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-3 bg-[#1e1e2e] rounded w-3/4" /></td>
                      ))}
                    </tr>
                  ))
                  : products.length === 0
                  ? <tr><td colSpan={6} className="py-16 text-center text-[12px] text-white/20">No products found</td></tr>
                  : products.map(p => (
                    <tr key={p.id} className="hover:bg-[#1a1a2a] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#1e1e2e] border border-[#2a2a3e] overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {p.image_url
                              ? <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                              : <ShoppingBag className="w-3.5 h-3.5 text-white/20" />
                            }
                          </div>
                          <span className="text-[12px] font-semibold text-white/80 max-w-[140px] truncate">{p.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-white/60">₦{Number(p.price).toLocaleString()}</td>
                      <td className="px-4 py-3 text-[12px] text-white/50">@{(p.seller as any)?.username ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-semibold text-white/40 bg-white/5 px-2 py-0.5 rounded-full">{p.category ?? "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          p.is_active
                            ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                            : "text-amber-400 bg-amber-500/10 border border-amber-500/20"
                        }`}>
                          {p.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {!p.is_active && (
                            <button
                              onClick={() => approveProduct(p.id)}
                              disabled={actionLoading === p.id + "_approve"}
                              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                            >
                              Approve
                            </button>
                          )}
                          {p.is_active && (
                            <button
                              onClick={() => removeProduct(p.id)}
                              disabled={actionLoading === p.id + "_remove"}
                              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                            >
                              Remove
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
        )}

        {/* Sellers Table */}
        {tab === "sellers" && (
          <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e1e2e]">
                  {["Seller", "Products", "Orders", "Trust Score", "Verified", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-black text-white/30 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e2e]">
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-3 bg-[#1e1e2e] rounded w-3/4" /></td>
                      ))}
                    </tr>
                  ))
                  : sellers.length === 0
                  ? <tr><td colSpan={6} className="py-16 text-center text-[12px] text-white/20">No sellers found</td></tr>
                  : sellers.map(s => (
                    <tr key={s.id} className="hover:bg-[#1a1a2a] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/20 flex items-center justify-center text-[11px] font-black text-purple-300 overflow-hidden flex-shrink-0">
                            {s.avatar_url ? <img src={s.avatar_url} alt="" className="w-full h-full object-cover" /> : s.username?.[0]?.toUpperCase()}
                          </div>
                          <span className="text-[12px] font-semibold text-white/80">@{s.username}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-white/50">{s.product_count ?? 0}</td>
                      <td className="px-4 py-3 text-[12px] text-white/50">{s.order_count ?? 0}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-[#1e1e2e] rounded-full overflow-hidden max-w-[60px]">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.min(100, (s.trust_score ?? 50))}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-white/40">{s.trust_score ?? 50}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          s.is_verified
                            ? "text-emerald-400 bg-emerald-500/10"
                            : "text-white/25 bg-white/5"
                        }`}>
                          {s.is_verified ? "Verified" : "Unverified"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button className="px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-[#1e1e2e] text-white/40 border border-[#2a2a3e] hover:border-purple-500/30 hover:text-purple-300 transition-all">
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}

        {/* Reports Tab */}
        {tab === "reports" && (
          <div className="flex items-center justify-center py-24 bg-[#12121c] border border-[#1e1e2e] rounded-xl">
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 text-white/10 mx-auto mb-3" />
              <p className="text-[12px] text-white/20">Product reports will appear here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
