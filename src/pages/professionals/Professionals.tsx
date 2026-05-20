import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { Briefcase, ShieldCheck, Star, Users, Search } from "lucide-react";

type Tab = "providers" | "workers" | "requests";

export function Professionals() {
  const [tab, setTab] = useState<Tab>("providers");
  const [providers, setProviders] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ total: 0, verified: 0, workers: 0, requests: 0 });

  useEffect(() => {
    async function load() {
      const [provR, reqR] = await Promise.all([
        supabase.from("profiles")
          .select("id,username,avatar_url,is_verified,avg_rating,bio,location,created_at,is_professional,is_vendor")
          .or("is_professional.eq.true,is_vendor.eq.true")
          .order("created_at", { ascending: false })
          .limit(80),
        supabase.from("service_requests")
          .select("id,title,budget,status,created_at,requester:profiles!user_id(username,avatar_url)")
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      const prov = provR.data ?? [];
      const reqs = reqR.data ?? [];
      const allProv = prov.filter((p: any) => p.is_professional);
      const allWork = prov.filter((p: any) => p.is_vendor && !p.is_professional);

      setProviders(allProv);
      setWorkers(allWork);
      setRequests(reqs);
      setStats({
        total:     prov.length,
        verified:  prov.filter((p: any) => p.is_verified).length,
        workers:   allWork.length,
        requests:  reqs.length,
      });
      setLoading(false);
    }
    load();
  }, []);

  async function toggleVerify(id: string, current: boolean) {
    await supabase.from("profiles").update({ is_verified: !current }).eq("id", id);
    setProviders(prev => prev.map(p => p.id === id ? { ...p, is_verified: !current } : p));
    setWorkers(prev => prev.map(p => p.id === id ? { ...p, is_verified: !current } : p));
  }

  function tAgo(iso: string) {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (d === 0) return "Today";
    if (d === 1) return "Yesterday";
    return `${d}d ago`;
  }

  const filterList = (list: any[]) =>
    list.filter(p => !search || p.username?.toLowerCase().includes(search.toLowerCase()) || p.location?.toLowerCase().includes(search.toLowerCase()));

  const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
    open:      { color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
    active:    { color: "#10b981", bg: "rgba(16,185,129,0.1)" },
    completed: { color: "rgba(240,242,255,0.35)", bg: "rgba(255,255,255,0.05)" },
    cancelled: { color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  };

  const TABS = [
    { key: "providers" as Tab, label: `Service Providers (${providers.length})` },
    { key: "workers" as Tab,   label: `Workers / Vendors (${workers.length})` },
    { key: "requests" as Tab,  label: `Job Requests (${requests.length})` },
  ];

  const ProfileRow = ({ p }: { p: any }) => (
    <tr style={{ borderBottom: "1px solid var(--border)", transition: "background 0.1s" }}
      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.02)"}
      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
    >
      {/* Profile */}
      <td style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--bg)", overflow: "hidden", flexShrink: 0 }}>
            {p.avatar_url && <img src={p.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 13 }}>@{p.username}</div>
            {p.bio && <div style={{ fontSize: 11, color: "var(--muted)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.bio}</div>}
          </div>
        </div>
      </td>
      {/* Location */}
      <td style={{ padding: "12px 16px", color: "var(--muted)", fontSize: 13 }}>{p.location ?? "—"}</td>
      {/* Rating */}
      <td style={{ padding: "12px 16px" }}>
        {p.avg_rating ? (
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#f59e0b" }}>
            <Star size={12} style={{ fill: "#f59e0b" }} />
            <span style={{ fontSize: 13, fontWeight: 700 }}>{Number(p.avg_rating).toFixed(1)}</span>
          </div>
        ) : <span style={{ color: "var(--muted)", fontSize: 12 }}>—</span>}
      </td>
      {/* Verified */}
      <td style={{ padding: "12px 16px" }}>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
          color: p.is_verified ? "#10b981" : "var(--muted)",
          background: p.is_verified ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.04)",
        }}>
          {p.is_verified ? "✓ Verified" : "Unverified"}
        </span>
      </td>
      {/* Joined */}
      <td style={{ padding: "12px 16px", color: "var(--muted)", fontSize: 12 }}>{tAgo(p.created_at)}</td>
      {/* Actions */}
      <td style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => toggleVerify(p.id, p.is_verified)}
            style={{
              padding: "5px 12px", borderRadius: 8, border: `1px solid ${p.is_verified ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
              background: p.is_verified ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)",
              color: p.is_verified ? "#ef4444" : "#10b981",
              fontSize: 11, fontWeight: 600, cursor: "pointer",
            }}>
            {p.is_verified ? "Unverify" : "Verify"}
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div>
      <PageHeader title="Professionals" sub="Service providers, workers, freelancers and job requests">
        <span style={{ fontSize: 12, color: "var(--muted)" }}>{stats.total} professionals</span>
      </PageHeader>

      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          <StatCard label="Total Professionals" value={stats.total}    icon={Briefcase}   color="#7c3aed" />
          <StatCard label="Verified"            value={stats.verified} icon={ShieldCheck} color="#10b981" />
          <StatCard label="Workers / Vendors"   value={stats.workers}  icon={Users}       color="#3b82f6" />
          <StatCard label="Open Job Requests"   value={stats.requests} icon={Star}        color="#f59e0b" />
        </div>

        {/* Tabs + Search */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 4, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 4 }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{
                  padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: 600,
                  background: tab === t.key ? "#7c3aed" : "transparent",
                  color: tab === t.key ? "#fff" : "var(--muted)",
                }}>
                {t.label}
              </button>
            ))}
          </div>
          {tab !== "requests" && (
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or location…"
                style={{ paddingLeft: 34, paddingRight: 14, height: 38, borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13, outline: "none" }} />
            </div>
          )}
        </div>

        {/* Table */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
          {tab !== "requests" ? (
            <table style={{ width: "100%", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Profile", "Location", "Rating", "Status", "Joined", "Actions"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? Array(5).fill(0).map((_, i) => (
                  <tr key={i}><td colSpan={6} style={{ padding: "12px 16px" }}><div style={{ height: 16, background: "var(--bg)", borderRadius: 6 }} /></td></tr>
                )) : filterList(tab === "providers" ? providers : workers).map(p => <ProfileRow key={p.id} p={p} />)}
              </tbody>
            </table>
          ) : (
            <table style={{ width: "100%", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Request", "Requester", "Budget", "Status", "Posted"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map(r => {
                  const s = STATUS_STYLE[r.status] ?? STATUS_STYLE.open;
                  return (
                    <tr key={r.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--text)", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</td>
                      <td style={{ padding: "12px 16px", color: "var(--muted)" }}>@{r.requester?.username ?? "—"}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#10b981" }}>
                        {r.budget ? `₦${Number(r.budget).toLocaleString()}` : "Open"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, color: s.color, background: s.bg, textTransform: "capitalize" }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--muted)", fontSize: 12 }}>{tAgo(r.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {!loading && (
            (tab === "providers" && filterList(providers).length === 0) ||
            (tab === "workers" && filterList(workers).length === 0) ||
            (tab === "requests" && requests.length === 0)
          ) && (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--muted)", fontSize: 13 }}>No data found</div>
          )}
        </div>
      </div>
    </div>
  );
}
