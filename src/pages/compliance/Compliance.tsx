import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { Shield, FileText, Trash2, Eye, CheckCircle, Clock, AlertTriangle } from "lucide-react";

type Tab = "kyc" | "data-requests" | "legal-holds" | "audit";

export function Compliance() {
  const [tab, setTab] = useState<Tab>("kyc");
  const [kyc, setKyc] = useState<any[]>([]);
  const [dataRequests, setDataRequests] = useState<any[]>([]);
  const [legalHolds, setLegalHolds] = useState<any[]>([]);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pendingKyc: 0, dataReqs: 0, holds: 0, reviewed: 0 });

  useEffect(() => {
    async function load() {
      const [kycR, drR, lhR, auR] = await Promise.all([
        supabase.from("verification_requests").select("*, user:profiles!user_id(username,avatar_url)").order("created_at", { ascending: false }).limit(40),
        supabase.from("data_deletion_requests").select("*, user:profiles!user_id(username,email)").order("created_at", { ascending: false }).limit(30),
        supabase.from("legal_holds").select("*, user:profiles!user_id(username)").order("created_at", { ascending: false }).limit(20),
        supabase.from("admin_audit_log").select("*, admin:admin_users!admin_id(name,role)").order("created_at", { ascending: false }).limit(50),
      ]);
      const k = kycR.data ?? []; const dr = drR.data ?? []; const lh = lhR.data ?? [];
      setKyc(k); setDataRequests(dr); setLegalHolds(lh); setAuditLog(auR.data ?? []);
      setStats({ pendingKyc: k.filter((x: any) => x.status === "pending").length, dataReqs: dr.filter((x: any) => x.status === "pending").length, holds: lh.length, reviewed: k.filter((x: any) => x.status !== "pending").length });
      setLoading(false);
    }
    load();
  }, []);

  async function approveKyc(id: string, userId: string) {
    await supabase.from("verification_requests").update({ status: "approved", reviewed_at: new Date().toISOString() }).eq("id", id);
    await supabase.from("profiles").update({ is_verified: true }).eq("id", userId);
    setKyc(prev => prev.map(k => k.id === id ? { ...k, status: "approved" } : k));
  }

  async function rejectKyc(id: string) {
    await supabase.from("verification_requests").update({ status: "rejected", reviewed_at: new Date().toISOString() }).eq("id", id);
    setKyc(prev => prev.map(k => k.id === id ? { ...k, status: "rejected" } : k));
  }

  async function resolveDataRequest(id: string, action: "deleted" | "exported") {
    await supabase.from("data_deletion_requests").update({ status: action, resolved_at: new Date().toISOString() }).eq("id", id);
    setDataRequests(prev => prev.map(d => d.id === id ? { ...d, status: action } : d));
  }

  async function removeLegalHold(id: string) {
    await supabase.from("legal_holds").delete().eq("id", id);
    setLegalHolds(prev => prev.filter(h => h.id !== id));
  }

  function tAgo(iso: string) {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    return d === 0 ? "Today" : d === 1 ? "Yesterday" : `${d}d ago`;
  }

  const KYC_TYPE = { user: { color: "#3b82f6", label: "User" }, seller: { color: "#10b981", label: "Seller" }, creator: { color: "#a78bfa", label: "Creator" } };

  return (
    <div>
      <PageHeader title="Compliance & Legal" sub="KYC verification queue, data requests, legal holds and admin audit trail" />
      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          <StatCard label="Pending KYC"     value={stats.pendingKyc} icon={Clock}       color="#f59e0b" />
          <StatCard label="Data Requests"   value={stats.dataReqs}   icon={FileText}    color="#3b82f6" />
          <StatCard label="Legal Holds"     value={stats.holds}      icon={Shield}      color="#ef4444" />
          <StatCard label="KYC Reviewed"    value={stats.reviewed}   icon={CheckCircle} color="#10b981" />
        </div>

        <div style={{ display: "flex", gap: 4, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 4, width: "fit-content" }}>
          {[{ key: "kyc", label: "KYC Queue" }, { key: "data-requests", label: "Data Requests" }, { key: "legal-holds", label: "Legal Holds" }, { key: "audit", label: "Audit Trail" }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as Tab)} style={{ padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: tab === t.key ? "#7c3aed" : "transparent", color: tab === t.key ? "#fff" : "var(--muted)" }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "kyc" && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
            <table style={{ width: "100%", fontSize: 13 }}>
              <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["User", "Type", "ID Type", "Status", "Submitted", "Actions"].map(h => (
                  <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {kyc.map(k => {
                  const t = (KYC_TYPE as any)[k.type] ?? KYC_TYPE.user;
                  const isPending = k.status === "pending";
                  return (
                    <tr key={k.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "11px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--bg)", overflow: "hidden" }}>
                            {k.user?.avatar_url && <img src={k.user.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                          </div>
                          <span style={{ fontWeight: 600, color: "var(--text)" }}>@{k.user?.username ?? "—"}</span>
                        </div>
                      </td>
                      <td style={{ padding: "11px 16px" }}><span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, color: t.color, background: `${t.color}18` }}>{t.label}</span></td>
                      <td style={{ padding: "11px 16px", color: "var(--muted)", textTransform: "capitalize" }}>{k.id_type?.replace(/_/g, " ") ?? "—"}</td>
                      <td style={{ padding: "11px 16px" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, color: k.status === "approved" ? "#10b981" : k.status === "rejected" ? "#ef4444" : "#f59e0b", background: k.status === "approved" ? "rgba(16,185,129,0.1)" : k.status === "rejected" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)", textTransform: "capitalize" }}>
                          {k.status}
                        </span>
                      </td>
                      <td style={{ padding: "11px 16px", color: "var(--muted)", fontSize: 12 }}>{tAgo(k.created_at)}</td>
                      <td style={{ padding: "11px 16px" }}>
                        {isPending && (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => approveKyc(k.id, k.user_id)} style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.1)", color: "#10b981", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Approve</button>
                            <button onClick={() => rejectKyc(k.id)} style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.1)", color: "#ef4444", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Reject</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {kyc.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)", fontSize: 13 }}>No KYC requests</div>}
          </div>
        )}

        {tab === "data-requests" && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border)", background: "rgba(59,130,246,0.06)" }}>
              <p style={{ fontSize: 12, color: "#3b82f6" }}>GDPR/NDPA compliance: Users have the right to request data export or deletion. These must be processed within 30 days.</p>
            </div>
            {dataRequests.map(r => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 18px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>@{r.user?.username ?? "—"}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{r.request_type === "delete" ? "🗑 Data Deletion" : "📦 Data Export"} · {tAgo(r.created_at)}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, color: r.status === "pending" ? "#f59e0b" : "#10b981", background: r.status === "pending" ? "rgba(245,158,11,0.1)" : "rgba(16,185,129,0.1)", textTransform: "capitalize" }}>{r.status}</span>
                {r.status === "pending" && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => resolveDataRequest(r.id, "exported")} style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.1)", color: "#3b82f6", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Export</button>
                    <button onClick={() => resolveDataRequest(r.id, "deleted")} style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.1)", color: "#ef4444", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Delete</button>
                  </div>
                )}
              </div>
            ))}
            {dataRequests.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)", fontSize: 13 }}>No data requests</div>}
          </div>
        )}

        {tab === "legal-holds" && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border)", background: "rgba(239,68,68,0.06)" }}>
              <p style={{ fontSize: 12, color: "#ef4444" }}>Accounts under legal hold cannot be deleted or modified until the hold is lifted.</p>
            </div>
            {legalHolds.map(h => (
              <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 18px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>@{h.user?.username ?? "—"}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>Reason: {h.reason ?? "—"} · {tAgo(h.created_at)}</div>
                </div>
                <button onClick={() => removeLegalHold(h.id)} style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.1)", color: "#ef4444", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Lift Hold</button>
              </div>
            ))}
            {legalHolds.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)", fontSize: 13 }}>No legal holds active</div>}
          </div>
        )}

        {tab === "audit" && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
            <table style={{ width: "100%", fontSize: 13 }}>
              <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Admin", "Role", "Action", "Target", "Timestamp"].map(h => (
                  <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {auditLog.map(a => (
                  <tr key={a.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "11px 16px", fontWeight: 600, color: "var(--text)" }}>{a.admin?.name ?? "System"}</td>
                    <td style={{ padding: "11px 16px", color: "var(--muted)", fontSize: 12, textTransform: "capitalize" }}>{a.admin?.role?.replace(/_/g, " ")}</td>
                    <td style={{ padding: "11px 16px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "rgba(124,58,237,0.1)", color: "#a78bfa" }}>{a.action}</span>
                    </td>
                    <td style={{ padding: "11px 16px", color: "var(--muted)", fontSize: 12 }}>{a.target_type} {a.target_id?.slice(0, 8)}…</td>
                    <td style={{ padding: "11px 16px", color: "var(--muted)", fontSize: 12 }}>{tAgo(a.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {auditLog.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)", fontSize: 13 }}>No audit entries</div>}
          </div>
        )}
      </div>
    </div>
  );
}
