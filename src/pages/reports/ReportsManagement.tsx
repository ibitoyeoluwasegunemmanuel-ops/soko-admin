import { useState } from "react";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { Flag, CheckCircle, AlertTriangle, Trash2, Eye, Ban } from "lucide-react";

type Tab = "pending" | "reviewed" | "actioned";
type ReportType = "user" | "product" | "service" | "live" | "business" | "scam" | "review";

interface Report {
  id: string; type: ReportType; target_name: string; target_id: string;
  reporter: string; reason: string; detail: string;
  status: "pending" | "reviewed" | "actioned";
  action_taken?: string; priority: "low" | "medium" | "high" | "critical";
  created_at: string; report_count: number;
}

const MOCK: Report[] = [
  { id: "r1", type: "live", target_name: "Stream by @unknown_user", target_id: "live_8821", reporter: "@amaka_c", reason: "Inappropriate content", detail: "Streaming adult content during peak hours", status: "pending", priority: "critical", created_at: "2026-05-21", report_count: 47 },
  { id: "r2", type: "product", target_name: "iPhone 15 Pro Max 256GB", target_id: "prod_7743", reporter: "@tunde_b", reason: "Fake/counterfeit product", detail: "Seller listing fake phone as original. Multiple buyers complained.", status: "pending", priority: "high", created_at: "2026-05-20", report_count: 12 },
  { id: "r3", type: "user", target_name: "@scammer_ng99", target_id: "user_3312", reporter: "@ngozi_w", reason: "Scam / fraud", detail: "User collecting payments then disappearing. 5 victims confirmed.", status: "pending", priority: "critical", created_at: "2026-05-20", report_count: 8 },
  { id: "r4", type: "review", target_name: "Review on Kola Electronics", target_id: "rev_1102", reporter: "@emeka_t", reason: "Fake review", detail: "Clearly fake 5-star review, product was never purchased by this account.", status: "pending", priority: "medium", created_at: "2026-05-19", report_count: 1 },
  { id: "r5", type: "business", target_name: "Best Phones Ltd", target_id: "biz_6654", reporter: "@faith_a", reason: "Business identity fraud", detail: "Using fake CAC documents. Store selling cloned phones.", status: "reviewed", action_taken: "Sent warning. Requested document re-verification.", priority: "high", created_at: "2026-05-18", report_count: 6 },
  { id: "r6", type: "service", target_name: "@quick_repairs", target_id: "svc_4412", reporter: "@chisom_o", reason: "Did not complete service", detail: "Took payment for laptop repair, disappeared after 3 weeks.", status: "actioned", action_taken: "Account suspended. Buyer refunded. Under review for permanent ban.", priority: "high", created_at: "2026-05-17", report_count: 3 },
];

const TYPE_COLORS: Record<ReportType, string> = { user: "#ef4444", product: "#f59e0b", service: "#7c3aed", live: "#ec4899", business: "#3b82f6", scam: "#ef4444", review: "#10b981" };
const PRIORITY_COLORS = { low: "#6b7280", medium: "#f59e0b", high: "#ef4444", critical: "#dc2626" };
const STATUS_COLORS = { pending: "#f59e0b", reviewed: "#3b82f6", actioned: "#10b981" };

export function ReportsManagement() {
  const [tab, setTab] = useState<Tab>("pending");
  const [reports, setReports] = useState<Report[]>(MOCK);
  const [selected, setSelected] = useState<Report | null>(null);
  const [note, setNote] = useState("");

  const filtered = reports.filter(r => r.status === tab);
  const pending = reports.filter(r => r.status === "pending").length;
  const critical = reports.filter(r => r.priority === "critical" && r.status === "pending").length;

  function tAgo(iso: string) {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    return d === 0 ? "Today" : `${d}d ago`;
  }

  function takeAction(id: string, actionText: string, newStatus: "reviewed" | "actioned") {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus, action_taken: actionText } : r));
    setSelected(null); setNote("");
  }

  function dismiss(id: string) {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: "reviewed", action_taken: "Dismissed — no violation found" } : r));
    setSelected(null);
  }

  return (
    <div>
      <PageHeader title="Reports Management" sub="Review user reports for content, accounts, products, services and scams" />
      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          <StatCard label="Pending Reports"    value={pending}   icon={Flag}         color="#f59e0b" />
          <StatCard label="Critical Priority"  value={critical}  icon={AlertTriangle} color="#ef4444" />
          <StatCard label="Reviewed Today"     value={1}         icon={Eye}          color="#3b82f6" />
          <StatCard label="Actions Taken"      value={reports.filter(r=>r.status==="actioned").length} icon={CheckCircle} color="#10b981" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 380px" : "1fr", gap: 16 }}>
          <div>
            <div style={{ display: "flex", gap: 4, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 4, width: "fit-content", marginBottom: 16 }}>
              {(["pending","reviewed","actioned"] as Tab[]).map(t => (
                <button key={t} onClick={() => setTab(t)} style={{ padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: tab === t ? "#7c3aed" : "transparent", color: tab === t ? "#fff" : "var(--muted)", textTransform: "capitalize" }}>
                  {t} ({reports.filter(r=>r.status===t).length})
                </button>
              ))}
            </div>

            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
              {filtered.length === 0 && <div style={{ padding: "48px 0", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>No {tab} reports</div>}
              {filtered.sort((a,b) => (b.priority === "critical" ? 1 : 0) - (a.priority === "critical" ? 1 : 0)).map(r => (
                <div key={r.id} onClick={() => setSelected(selected?.id === r.id ? null : r)}
                  style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "14px 20px", borderBottom: "1px solid var(--border)", cursor: "pointer", background: selected?.id === r.id ? "rgba(124,58,237,0.05)" : r.priority === "critical" ? "rgba(239,68,68,0.03)" : "transparent", borderLeft: r.priority === "critical" ? "3px solid #ef4444" : "3px solid transparent" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, color: TYPE_COLORS[r.type], background: `${TYPE_COLORS[r.type]}18` }}>{r.type}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, color: PRIORITY_COLORS[r.priority], background: `${PRIORITY_COLORS[r.priority]}18`, textTransform: "uppercase" }}>{r.priority}</span>
                      {r.report_count > 1 && <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 700 }}>🚩 {r.report_count} reports</span>}
                      <span style={{ fontSize: 11, color: "rgba(240,242,255,0.2)" }}>{tAgo(r.created_at)}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 3 }}>{r.reason} — {r.target_name}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>Reported by {r.reporter} · {r.detail.slice(0, 80)}…</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, color: STATUS_COLORS[r.status], background: `${STATUS_COLORS[r.status]}18`, flexShrink: 0, textTransform: "capitalize" }}>{r.status}</span>
                </div>
              ))}
            </div>
          </div>

          {selected && (
            <div style={{ background: "var(--surface)", border: `1px solid ${PRIORITY_COLORS[selected.priority]}33`, borderRadius: 16, padding: 22, position: "sticky", top: 90, height: "fit-content" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>Report #{selected.id}</div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, color: PRIORITY_COLORS[selected.priority], background: `${PRIORITY_COLORS[selected.priority]}18`, textTransform: "uppercase" }}>{selected.priority} priority</span>

              <div style={{ marginTop: 16 }}>
                {[
                  { label: "Target", val: selected.target_name },
                  { label: "Type", val: selected.type },
                  { label: "Reported by", val: selected.reporter },
                  { label: "Report count", val: `${selected.report_count} reports` },
                ].map(r => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>{r.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", textTransform: "capitalize" }}>{r.val}</span>
                  </div>
                ))}
              </div>

              <div style={{ margin: "14px 0", padding: "12px", background: "var(--bg)", borderRadius: 8, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>DETAIL</div>
                <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>{selected.detail}</div>
              </div>

              {selected.action_taken && (
                <div style={{ marginBottom: 14, padding: "10px 12px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: "#10b981", fontWeight: 700, marginBottom: 3 }}>ACTION TAKEN</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{selected.action_taken}</div>
                </div>
              )}

              {selected.status === "pending" && (
                <>
                  <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add action notes…" rows={3}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13, resize: "none", marginBottom: 10 }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <button onClick={() => takeAction(selected.id, note || "Warning issued to account.", "reviewed")} style={{ padding: "9px", borderRadius: 9, border: "1px solid rgba(245,158,11,0.4)", background: "rgba(245,158,11,0.1)", color: "#fcd34d", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>⚠️ Issue Warning</button>
                    <button onClick={() => takeAction(selected.id, note || "Content removed.", "actioned")} style={{ padding: "9px", borderRadius: 9, border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.1)", color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>🗑 Remove Content</button>
                    <button onClick={() => takeAction(selected.id, note || "Account suspended pending investigation.", "actioned")} style={{ padding: "9px", borderRadius: 9, border: "none", background: "#ef4444", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>🔒 Suspend Account</button>
                    <button onClick={() => dismiss(selected.id)} style={{ padding: "9px", borderRadius: 9, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Dismiss — No Violation</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
