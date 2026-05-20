import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { ShoppingBag, CheckCircle, XCircle, Star, Search, Filter } from "lucide-react";

type Tab = "all" | "pending" | "approved" | "rejected";

const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  pending:  { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  label: "Pending" },
  approved: { color: "#10b981", bg: "rgba(16,185,129,0.1)",  label: "Approved" },
  active:   { color: "#10b981", bg: "rgba(16,185,129,0.1)",  label: "Active" },
  rejected: { color: "#ef4444", bg: "rgba(239,68,68,0.1)",   label: "Rejected" },
  inactive: { color: "rgba(240,242,255,0.3)", bg: "rgba(255,255,255,0.05)", label: "Inactive" },
};

export function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, rejected: 0 });

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("products")
        .select("id,name,price,condition,is_active,is_approved,category,created_at,media_url,seller:profiles!seller_id(username,avatar_url,is_verified)")
        .order("created_at", { ascending: false })
        .limit(100);
      const list = data ?? [];
      setProducts(list);
      setStats({
        total:    list.length,
        active:   list.filter((p: any) => p.is_active && p.is_approved).length,
        pending:  list.filter((p: any) => !p.is_approved && p.is_active).length,
        rejected: list.filter((p: any) => !p.is_active && !p.is_approved).length,
      });
      setLoading(false);
    }
    load();
  }, []);

  async function approve(id: string) {
    await supabase.from("products").update({ is_approved: true, is_active: true }).eq("id", id);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, is_approved: true, is_active: true } : p));
  }

  async function reject(id: string) {
    await supabase.from("products").update({ is_approved: false, is_active: false }).eq("id", id);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, is_approved: false, is_active: false } : p));
  }

  async function remove(id: string) {
    await supabase.from("products").update({ is_active: false }).eq("id", id);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: false } : p));
  }

  function getStatus(p: any) {
    if (!p.is_active && !p.is_approved) return "rejected";
    if (!p.is_approved) return "pending";
    if (p.is_active) return "active";
    return "inactive";
  }

  const filtered = products.filter(p => {
    const status = getStatus(p);
    if (tab === "pending" && status !== "pending") return false;
    if (tab === "approved" && status !== "active") return false;
    if (tab === "rejected" && status !== "rejected") return false;
    if (search && !p.name?.toLowerCase().includes(search.toLowerCase()) &&
        !p.seller?.username?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function tAgo(iso: string) {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (d === 0) return "Today";
    if (d === 1) return "Yesterday";
    return `${d}d ago`;
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "all",      label: "All Products" },
    { key: "pending",  label: `Pending (${stats.pending})` },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];

  return (
    <div>
      <PageHeader title="Products" sub="Manage all marketplace product listings, approvals and removals">
        <span style={{ fontSize: 12, color: "var(--muted)" }}>{stats.total} products total</span>
      </PageHeader>

      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          <StatCard label="Total Products"    value={stats.total}    icon={ShoppingBag} color="#7c3aed" />
          <StatCard label="Active & Approved" value={stats.active}   icon={CheckCircle} color="#10b981" />
          <StatCard label="Pending Approval"  value={stats.pending}  icon={Star}        color="#f59e0b" />
          <StatCard label="Rejected"          value={stats.rejected} icon={XCircle}     color="#ef4444" />
        </div>

        {/* Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 4 }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{
                  padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: 600,
                  background: tab === t.key ? "#7c3aed" : "transparent",
                  color: tab === t.key ? "#fff" : "var(--muted)",
                  transition: "all 0.15s",
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: "relative", flex: 1, maxWidth: 300 }}>
            <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search products or sellers…"
              style={{
                width: "100%", paddingLeft: 34, paddingRight: 14, height: 38,
                borderRadius: 10, border: "1px solid var(--border)",
                background: "var(--surface)", color: "var(--text)", fontSize: 13, outline: "none",
              }} />
          </div>
        </div>

        {/* Table */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
          <table style={{ width: "100%", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Product", "Seller", "Price", "Category", "Condition", "Status", "Listed", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array(6).fill(0).map((_, i) => (
                <tr key={i}>
                  <td colSpan={8} style={{ padding: "12px 16px" }}>
                    <div style={{ height: 16, background: "var(--surface2)", borderRadius: 6, animation: "pulse 1.5s infinite" }} />
                  </td>
                </tr>
              )) : filtered.map(p => {
                const status = getStatus(p);
                const s = STATUS_STYLE[status] ?? STATUS_STYLE.inactive;
                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.1s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.02)"}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                  >
                    {/* Product */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 8, background: "var(--bg)",
                          overflow: "hidden", flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {p.media_url
                            ? <img src={p.media_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <ShoppingBag size={14} style={{ color: "var(--muted)" }} />}
                        </div>
                        <span style={{ fontWeight: 600, color: "var(--text)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.name ?? "—"}
                        </span>
                      </div>
                    </td>
                    {/* Seller */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--bg)", overflow: "hidden", flexShrink: 0 }}>
                          {p.seller?.avatar_url && <img src={p.seller.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                        </div>
                        <span style={{ color: "var(--muted)" }}>@{p.seller?.username ?? "—"}</span>
                      </div>
                    </td>
                    {/* Price */}
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#10b981" }}>
                      ₦{Number(p.price ?? 0).toLocaleString()}
                    </td>
                    {/* Category */}
                    <td style={{ padding: "12px 16px", color: "var(--muted)" }}>{p.category ?? "—"}</td>
                    {/* Condition */}
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,0.05)", color: "var(--muted)", textTransform: "capitalize" }}>
                        {p.condition ?? "new"}
                      </span>
                    </td>
                    {/* Status */}
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, color: s.color, background: s.bg }}>
                        {s.label}
                      </span>
                    </td>
                    {/* Listed */}
                    <td style={{ padding: "12px 16px", color: "var(--muted)", fontSize: 12 }}>{tAgo(p.created_at)}</td>
                    {/* Actions */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        {status === "pending" && (
                          <>
                            <button onClick={() => approve(p.id)}
                              style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.1)", color: "#10b981", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                              Approve
                            </button>
                            <button onClick={() => reject(p.id)}
                              style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.1)", color: "#ef4444", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                              Reject
                            </button>
                          </>
                        )}
                        {status === "active" && (
                          <button onClick={() => remove(p.id)}
                            style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.1)", color: "#ef4444", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                            Remove
                          </button>
                        )}
                        {status === "rejected" && (
                          <button onClick={() => approve(p.id)}
                            style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.1)", color: "#10b981", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                            Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--muted)", fontSize: 13 }}>
              No products found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
