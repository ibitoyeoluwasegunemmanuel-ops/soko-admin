import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { AlertTriangle, CheckCircle, Clock, XCircle, MessageSquare } from "lucide-react";

type Tab = "open" | "reviewing" | "resolved" | "escalated";
type DisputeType = "order" | "service" | "auction" | "refund" | "scam";

interface Dispute {
  id: string; order_id: string; type: DisputeType;
  complainant: string; respondent: string;
  reason: string; description: string; amount: number;
  status: "open" | "reviewing" | "resolved" | "escalated";
  resolution?: string; created_at: string; updated_at: string;
  evidence_count: number;
}

const MOCK: Dispute[] = [
  { id: "d1", order_id: "ORD-8821", type: "order", complainant: "@amaka_c", respondent: "@seller_kola", reason: "Item not delivered", description: "Paid for a dress 2 weeks ago. Seller says shipped but no tracking.", amount: 18500, status: "open", created_at: "2026-05-19", updated_at: "2026-05-20", evidence_count: 3 },
  { id: "d2", order_id: "ORD-7743", type: "refund", complainant: "@tunde_b", respondent: "@electronicshub", reason: "Wrong item sent", description: "Ordered iPhone 15 case, received Android case.", amount: 4200, status: "reviewing", created_at: "2026-05-18", updated_at: "2026-05-20", evidence_count: 5 },
  { id: "d3", order_id: "SVC-3312", type: "service", complainant: "@ngozi_w", respondent: "@designerpro", reason: "Work not completed", description: "Paid for logo design. Designer delivered incomplete work and stopped responding.", amount: 25000, status: "escalated", created_at: "2026-05-15", updated_at: "2026-05-19", evidence_count: 8 },
  { id: "d4", order_id: "AUC-1102", type: "auction", complainant: "@emeka_t", respondent: "@auctionhub_ng", reason: "Won auction but seller refused to sell", description: "Won auction bid of ₦45,000. Seller claims technical issue.", amount: 45000, status: "open", created_at: "2026-05-20", updated_at: "2026-05-20", evidence_count: 2 },
  { id: "d5", order_id: "ORD-6654", type: "scam", complainant: "@faith_a", respondent: "@newuser991", reason: "Scam listing", description: "Paid for luxury bag. Received empty box. Seller account now deleted.", amount: 120000, status: "escalated", created_at: "2026-05-14", updated_at: "2026-05-18", evidence_count: 12 },
];

const TYPE_COLORS: Record<DisputeType, string> = { order: "#3b82f6", service: "#7c3aed", auction: "#f59e0b", refund: "#10b981", scam: "#ef4444" };
const STATUS_COLORS = { open: "#f59e0b", reviewing: "#3b82f6", resolved: "#10b981", escalated: "#ef4444" };

export function DisputeManagement() {
  const [tab, setTab] = useState<Tab>("open");
  const [disputes, setDisputes] = useState<Dispute[]>(MOCK);
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [resolution, setResolution] = useState("");
  const [action, setAction] = useState<"refund_buyer" | "release_seller" | "partial" | "escalate">("refund_buyer");

  const filtered = disputes.filter(d => d.status === tab);
  const open = disputes.filter(d => d.status === "open").length;
  const reviewing = disputes.filter(d => d.status === "reviewing").length;
  const escalated = disputes.filter(d => d.status === "escalated").length;
  const resolved = disputes.filter(d => d.status === "resolved").length;

  function resolve(id: string) {
    setDisputes(prev => prev.map(d => d.id === id ? { ...d, status: "resolved", resolution } : d));
    setSelected(null); setResolution("");
  }
  function escalateDispute(id: string) {
    setDisputes(prev => prev.map(d => d.id === id ? { ...d, status: "escalated" } : d));
    setSelected(null);
  }
  function startReview(id: string) {
    setDisputes(prev => prev.map(d => d.id === id ? { ...d, status: "reviewing" } : d));
  }

  function tAgo(iso: string) {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    return d === 0 ? "Today" : d === 1 ? "Yesterday" : `${d}d ago`;
  }

  return (
    <div>
      <PageHeader title="Dispute Management" sub="Review and resolve buyer-seller disputes, service complaints and fraud reports" />
      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          <StatCard label="Open Disputes"     value={open}      icon={Clock}         color="#f59e0b" />
          <StatCard label="Under Review"      value={reviewing}  icon={MessageSquare} color="#3b82f6" />
          <StatCard label="Escalated"         value={escalated}  icon={AlertTriangle} color="#ef4444" />
          <StatCard label="Resolved (all)"    value={resolved}   icon={CheckCircle}   color="#10b981" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 380px" : "1fr", gap: 16 }}>
          <div>
            <div style={{ display: "flex", gap: 4, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 4, width: "fit-content", marginBottom: 16 }}>
              {(["open","reviewing","escalated","resolved"] as Tab[]).map(t => (
                <button key={t} onClick={() => setTab(t)} style={{ padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: tab === t ? (t === "escalated" ? "#ef4444" : t === "resolved" ? "#10b981" : "#7c3aed") : "transparent", color: tab === t ? "#fff" : "var(--muted)", textTransform: "capitalize" }}>
                  {t} {t !== "resolved" && disputes.filter(d => d.status === t).length > 0 && `(${disputes.filter(d => d.status === t).length})`}
                </button>
              ))}
            </div>

            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
              {filtered.length === 0 ? (
                <div style={{ padding: "48px 0", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>No {tab} disputes</div>
              ) : filtered.map(d => (
                <div key={d.id} onClick={() => setSelected(selected?.id === d.id ? null : d)} style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "16px 20px", borderBottom: "1px solid var(--border)", cursor: "pointer", background: selected?.id === d.id ? "rgba(124,58,237,0.05)" : "transparent" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 20, color: TYPE_COLORS[d.type], background: `${TYPE_COLORS[d.type]}18` }}>{d.type}</span>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>{d.order_id}</span>
                      <span style={{ fontSize: 11, color: "rgba(240,242,255,0.2)" }}>{tAgo(d.created_at)}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 3 }}>{d.reason}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{d.complainant} vs {d.respondent} · {d.evidence_count} pieces of evidence</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#ef4444" }}>₦{d.amount.toLocaleString()}</div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, color: STATUS_COLORS[d.status], background: `${STATUS_COLORS[d.status]}18`, textTransform: "capitalize" }}>{d.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selected && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 22, position: "sticky", top: 90, height: "fit-content" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>Dispute #{selected.id}</div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 3 }}>DESCRIPTION</div>
                <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6, padding: "10px 12px", background: "var(--bg)", borderRadius: 8, border: "1px solid var(--border)" }}>{selected.description}</div>
              </div>
              {[
                { label: "Complainant", val: selected.complainant },
                { label: "Respondent", val: selected.respondent },
                { label: "Amount at Stake", val: `₦${selected.amount.toLocaleString()}` },
                { label: "Evidence", val: `${selected.evidence_count} files attached` },
              ].map(r => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>{r.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{r.val}</span>
                </div>
              ))}

              {selected.status !== "resolved" && (
                <>
                  <div style={{ marginTop: 16, marginBottom: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>Resolution Action</div>
                    {[
                      { val: "refund_buyer", label: "Refund buyer in full" },
                      { val: "release_seller", label: "Release funds to seller" },
                      { val: "partial", label: "Partial refund (split)" },
                      { val: "escalate", label: "Escalate to senior team" },
                    ].map(opt => (
                      <div key={opt.val} onClick={() => setAction(opt.val as any)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, cursor: "pointer", marginBottom: 4, background: action === opt.val ? "rgba(124,58,237,0.1)" : "transparent", border: `1px solid ${action === opt.val ? "rgba(124,58,237,0.3)" : "transparent"}` }}>
                        <div style={{ width: 14, height: 14, borderRadius: "50%", background: action === opt.val ? "#7c3aed" : "transparent", border: `2px solid ${action === opt.val ? "#7c3aed" : "rgba(255,255,255,0.2)"}` }} />
                        <span style={{ fontSize: 12, color: "var(--text)" }}>{opt.label}</span>
                      </div>
                    ))}
                  </div>
                  <textarea value={resolution} onChange={e => setResolution(e.target.value)} placeholder="Write resolution notes…" rows={3}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13, resize: "none", marginBottom: 12 }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    {selected.status === "open" && (
                      <button onClick={() => startReview(selected.id)} style={{ flex: 1, padding: "9px", borderRadius: 9, border: "1px solid rgba(59,130,246,0.4)", background: "rgba(59,130,246,0.1)", color: "#60a5fa", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Start Review</button>
                    )}
                    <button onClick={() => resolve(selected.id)} style={{ flex: 1, padding: "9px", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#7c3aed,#ec4899)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Resolve</button>
                  </div>
                </>
              )}
              {selected.resolution && (
                <div style={{ marginTop: 14, padding: "10px 12px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: "#10b981", fontWeight: 700, marginBottom: 4 }}>RESOLUTION</div>
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>{selected.resolution}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
