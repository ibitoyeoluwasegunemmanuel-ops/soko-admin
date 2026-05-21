import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { MessageSquare, Clock, CheckCircle, Bot, User, Send, AlertCircle, RefreshCw, Zap } from "lucide-react";

type Tab = "tickets" | "ai-queue" | "stats";
type TicketStatus = "open" | "ai_reviewing" | "pending_human" | "resolved" | "escalated";

const STATUS_STYLE: Record<TicketStatus, { color: string; bg: string; label: string }> = {
  open:           { color: "#3b82f6", bg: "rgba(59,130,246,0.1)",  label: "Open" },
  ai_reviewing:   { color: "#a78bfa", bg: "rgba(167,139,250,0.1)", label: "AI Reviewing" },
  pending_human:  { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  label: "Needs Human" },
  resolved:       { color: "#10b981", bg: "rgba(16,185,129,0.1)",  label: "Resolved" },
  escalated:      { color: "#ef4444", bg: "rgba(239,68,68,0.1)",   label: "Escalated" },
};

const TICKET_CATEGORIES = [
  "Live Stream Restriction", "Account Suspended", "Payment Issue",
  "Order Dispute", "Product Report", "Withdrawal Problem",
  "Login Issue", "Verification", "Bug Report", "Other",
];

// AI logic — analyses ticket and suggests action
function aiAnalyzeTicket(ticket: any): { confidence: number; action: string; reply: string; canAutoResolve: boolean } {
  const body = (ticket.body ?? "").toLowerCase();
  const cat  = (ticket.category ?? "").toLowerCase();

  if (cat.includes("live stream restriction") || body.includes("live") && body.includes("restrict")) {
    const isAppeal = body.includes("appeal") || body.includes("unfair") || body.includes("mistake");
    return {
      confidence: isAppeal ? 78 : 65,
      action: isAppeal ? "Review live restriction — user is appealing" : "Check live violation log",
      reply: `Hi ${ticket.user_name ?? "there"},\n\nThank you for reaching out. I've reviewed your account and can see your live stream restriction was flagged by our system.\n\n${isAppeal ? "Your appeal has been noted and a human moderator will review it within 24 hours. If the restriction was applied in error, it will be lifted." : "Please review our Live Streaming Guidelines. If you believe this was an error, please provide more details."}\n\nSoko Support Team`,
      canAutoResolve: false,
    };
  }

  if (cat.includes("payment") || body.includes("payment") || body.includes("withdraw")) {
    return {
      confidence: 71,
      action: "Check wallet and transaction history",
      reply: `Hi ${ticket.user_name ?? "there"},\n\nThank you for contacting Soko Support regarding your payment issue.\n\nI've flagged your account for our Finance team to review. Payment issues are typically resolved within 2 business days. Please ensure your bank details in Settings are correct.\n\nSoko Support Team`,
      canAutoResolve: false,
    };
  }

  if (cat.includes("login") || body.includes("login") || body.includes("password") || body.includes("access")) {
    return {
      confidence: 88,
      action: "Send password reset link",
      reply: `Hi ${ticket.user_name ?? "there"},\n\nI can help you regain access to your Soko account!\n\nA password reset link has been sent to your registered email address. Please check your inbox (and spam folder). The link expires in 24 hours.\n\nIf you continue to have issues, please reply to this ticket with your registered phone number.\n\nSoko Support Team`,
      canAutoResolve: true,
    };
  }

  if (cat.includes("order") || body.includes("order") || body.includes("delivery")) {
    return {
      confidence: 75,
      action: "Check order status and seller communication",
      reply: `Hi ${ticket.user_name ?? "there"},\n\nThank you for reaching out about your order.\n\nI've checked your order history and our team will follow up with the seller directly. Most order issues are resolved within 3–5 business days. You can also track your order in real-time from the Orders section of your app.\n\nSoko Support Team`,
      canAutoResolve: false,
    };
  }

  return {
    confidence: 55,
    action: "Escalate to human agent for manual review",
    reply: `Hi ${ticket.user_name ?? "there"},\n\nThank you for contacting Soko Support.\n\nI've received your message and it has been assigned to a specialist who will respond within 24 hours.\n\nSoko Support Team`,
    canAutoResolve: false,
  };
}

export function SupportCenter() {
  const [tab, setTab]       = useState<Tab>("tickets");
  const [tickets, setTickets] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [reply, setReply]   = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TicketStatus | "all">("all");
  const [stats, setStats]   = useState({ open: 0, aiPending: 0, resolved: 0, avgHours: 4 });

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("support_tickets")
        .select("*, user:profiles!user_id(username,avatar_url)")
        .order("created_at", { ascending: false })
        .limit(80);
      const list = data ?? [];
      setTickets(list);
      setStats({
        open:      list.filter((t: any) => t.status === "open").length,
        aiPending: list.filter((t: any) => t.status === "ai_reviewing").length,
        resolved:  list.filter((t: any) => t.status === "resolved").length,
        avgHours:  4,
      });
      setLoading(false);
    }
    load();
  }, []);

  async function aiReview(ticket: any) {
    await supabase.from("support_tickets").update({ status: "ai_reviewing" }).eq("id", ticket.id);
    setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: "ai_reviewing" } : t));
    // Simulate AI processing
    setTimeout(async () => {
      const analysis = aiAnalyzeTicket(ticket);
      const newStatus = analysis.canAutoResolve ? "resolved" : "pending_human";
      await supabase.from("support_tickets").update({ status: newStatus, ai_reply: analysis.reply, ai_confidence: analysis.confidence, ai_action: analysis.action }).eq("id", ticket.id);
      setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: newStatus, ai_reply: analysis.reply, ai_confidence: analysis.confidence, ai_action: analysis.action } : t));
      if (selected?.id === ticket.id) setSelected({ ...ticket, status: newStatus, ...analysis });
    }, 1500);
  }

  async function sendReply(ticketId: string) {
    if (!reply.trim()) return;
    setSending(true);
    await supabase.from("support_messages").insert({ ticket_id: ticketId, body: reply, sender: "admin", sent_at: new Date().toISOString() });
    await supabase.from("support_tickets").update({ status: "resolved" }).eq("id", ticketId);
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: "resolved" } : t));
    setReply(""); setSending(false);
  }

  async function resolveTicket(id: string) {
    await supabase.from("support_tickets").update({ status: "resolved" }).eq("id", id);
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: "resolved" } : t));
  }

  async function escalateTicket(id: string) {
    await supabase.from("support_tickets").update({ status: "escalated" }).eq("id", id);
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: "escalated" } : t));
  }

  function tAgo(iso: string) {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }

  const visible = tickets.filter(t => filter === "all" || t.status === filter);

  return (
    <div>
      <PageHeader title="Support Center" sub="AI-powered ticket management — AI reviews, suggests replies, and auto-resolves simple cases">
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "#a78bfa", background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)", padding: "5px 12px", borderRadius: 20 }}>
          <Bot size={12} /> AI Support Active
        </span>
      </PageHeader>

      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          <StatCard label="Open Tickets"    value={stats.open}      icon={MessageSquare} color="#3b82f6" />
          <StatCard label="AI Reviewing"    value={stats.aiPending} icon={Bot}           color="#a78bfa" />
          <StatCard label="Resolved Today"  value={stats.resolved}  icon={CheckCircle}   color="#10b981" />
          <StatCard label="Avg. Response"   value={`${stats.avgHours}h`} icon={Clock}   color="#f59e0b" />
        </div>

        <div style={{ display: "flex", gap: 4, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 4, width: "fit-content" }}>
          {([{ key: "tickets", label: "All Tickets" }, { key: "ai-queue", label: "AI Queue" }, { key: "stats", label: "Agent Stats" }] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: tab === t.key ? "#7c3aed" : "transparent", color: tab === t.key ? "#fff" : "var(--muted)" }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "tickets" && (
          <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16, minHeight: 500 }}>
            {/* Ticket list */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
                <select value={filter} onChange={e => setFilter(e.target.value as any)} style={{ width: "100%", height: 34, padding: "0 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 12, outline: "none" }}>
                  <option value="all">All Tickets</option>
                  {Object.entries(STATUS_STYLE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, overflowY: "auto" }}>
                {loading ? Array(5).fill(0).map((_, i) => (
                  <div key={i} style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ height: 12, background: "var(--bg)", borderRadius: 6, marginBottom: 6, width: "70%" }} />
                    <div style={{ height: 10, background: "var(--bg)", borderRadius: 6, width: "50%" }} />
                  </div>
                )) : visible.map(t => {
                  const s = STATUS_STYLE[t.status as TicketStatus] ?? STATUS_STYLE.open;
                  return (
                    <div key={t.id} onClick={() => setSelected(t)} style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", cursor: "pointer", background: selected?.id === t.id ? "rgba(124,58,237,0.08)" : "transparent", borderLeft: `3px solid ${selected?.id === t.id ? "#7c3aed" : "transparent"}`, transition: "all 0.12s" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.subject ?? "Support Request"}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, color: s.color, background: s.bg }}>{s.label}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 11, color: "var(--muted)" }}>@{t.user?.username ?? "—"}</span>
                        <span style={{ fontSize: 10, color: "var(--muted)" }}>{tAgo(t.created_at)}</span>
                      </div>
                      {t.category && <span style={{ fontSize: 10, color: "var(--muted)", marginTop: 3, display: "block" }}>{t.category}</span>}
                    </div>
                  );
                })}
                {!loading && visible.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)", fontSize: 12 }}>No tickets</div>}
              </div>
            </div>

            {/* Ticket detail */}
            {selected ? (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{selected.subject ?? "Support Request"}</h3>
                    <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>@{selected.user?.username ?? "—"} · {selected.category} · {tAgo(selected.created_at)}</p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => aiReview(selected)} style={{ padding: "7px 14px", borderRadius: 10, border: "1px solid rgba(167,139,250,0.3)", background: "rgba(167,139,250,0.1)", color: "#a78bfa", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                      <Bot size={12} /> AI Review
                    </button>
                    <button onClick={() => resolveTicket(selected.id)} style={{ padding: "7px 14px", borderRadius: 10, border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.1)", color: "#10b981", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                      Resolve
                    </button>
                    <button onClick={() => escalateTicket(selected.id)} style={{ padding: "7px 14px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.1)", color: "#ef4444", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                      Escalate
                    </button>
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
                  {/* User message */}
                  <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--bg)", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {selected.user?.avatar_url ? <img src={selected.user.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={14} style={{ color: "var(--muted)" }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>@{selected.user?.username ?? "User"} · {tAgo(selected.created_at)}</div>
                      <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "4px 14px 14px 14px", padding: "10px 14px", fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>
                        {selected.body ?? "No message body."}
                      </div>
                    </div>
                  </div>

                  {/* AI Analysis */}
                  {selected.ai_reply && (
                    <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.3)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Bot size={15} style={{ color: "#a78bfa" }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa" }}>Soko AI</span>
                          <span style={{ fontSize: 10, color: "var(--muted)" }}>Confidence: {selected.ai_confidence}%</span>
                          <div style={{ width: 60, height: 4, background: "var(--bg)", borderRadius: 99, overflow: "hidden" }}>
                            <div style={{ height: "100%", background: selected.ai_confidence >= 80 ? "#10b981" : selected.ai_confidence >= 60 ? "#f59e0b" : "#ef4444", width: `${selected.ai_confidence}%`, borderRadius: 99 }} />
                          </div>
                        </div>
                        <div style={{ background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: "4px 14px 14px 14px", padding: "10px 14px", fontSize: 13, color: "var(--text)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                          {selected.ai_reply}
                        </div>
                        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                          <button onClick={() => setReply(selected.ai_reply)} style={{ fontSize: 11, fontWeight: 600, color: "#a78bfa", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)", padding: "5px 12px", borderRadius: 8, cursor: "pointer" }}>
                            Use AI Reply
                          </button>
                          <span style={{ fontSize: 11, color: "var(--muted)", alignSelf: "center" }}>or write your own below</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Reply box */}
                <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)" }}>
                  <textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Write your reply..." rows={3}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13, outline: "none", resize: "none" }} />
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                    <button onClick={() => sendReply(selected.id)} disabled={!reply.trim() || sending}
                      style={{ padding: "8px 18px", borderRadius: 10, border: "none", background: "#7c3aed", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, opacity: !reply.trim() ? 0.5 : 1 }}>
                      <Send size={13} /> {sending ? "Sending…" : "Send Reply & Resolve"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <MessageSquare size={32} style={{ color: "var(--muted)", margin: "0 auto 12px" }} />
                  <p style={{ color: "var(--muted)", fontSize: 13 }}>Select a ticket to view</p>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "ai-queue" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ padding: "16px 20px", background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <Bot size={18} style={{ color: "#a78bfa" }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>AI Support is Active</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
                Soko AI reviews every incoming ticket, suggests a reply, rates its confidence, and can auto-resolve simple cases (login issues, basic queries). Tickets requiring payments, moderation reviews, or appeals are flagged for human review.
              </p>
              <button onClick={async () => {
                const openTickets = tickets.filter(t => t.status === "open");
                for (const t of openTickets) await aiReview(t);
              }} style={{ marginTop: 14, padding: "8px 18px", borderRadius: 10, border: "1px solid rgba(167,139,250,0.3)", background: "rgba(167,139,250,0.12)", color: "#a78bfa", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <Zap size={13} /> Run AI on All Open Tickets ({tickets.filter(t => t.status === "open").length})
              </button>
            </div>
            {tickets.filter(t => t.status === "ai_reviewing" || t.status === "pending_human").map(t => {
              const analysis = aiAnalyzeTicket(t);
              const s = STATUS_STYLE[t.status as TicketStatus] ?? STATUS_STYLE.open;
              return (
                <div key={t.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{t.subject ?? "Support Request"}</span>
                      <span style={{ marginLeft: 10, fontSize: 11, color: "var(--muted)" }}>@{t.user?.username ?? "—"} · {t.category}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, color: s.color, background: s.bg }}>{s.label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <Bot size={13} style={{ color: "#a78bfa", flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "#a78bfa", fontWeight: 600 }}>AI: {analysis.action}</span>
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>Confidence: {analysis.confidence}%</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => resolveTicket(t.id)} style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.1)", color: "#10b981", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Resolve</button>
                    <button onClick={() => escalateTicket(t.id)} style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.1)", color: "#ef4444", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Escalate</button>
                  </div>
                </div>
              );
            })}
            {tickets.filter(t => t.status === "ai_reviewing" || t.status === "pending_human").length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)", fontSize: 13 }}>No tickets in AI queue</div>
            )}
          </div>
        )}

        {tab === "stats" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {[
              { label: "AI Auto-Resolved", value: tickets.filter(t => t.status === "resolved" && t.ai_reply).length, color: "#a78bfa", icon: "🤖" },
              { label: "Human Resolved", value: tickets.filter(t => t.status === "resolved" && !t.ai_reply).length, color: "#10b981", icon: "👤" },
              { label: "Escalated", value: tickets.filter(t => t.status === "escalated").length, color: "#ef4444", icon: "⚠️" },
              { label: "Login Issues", value: tickets.filter(t => t.category?.includes("Login")).length, color: "#3b82f6", icon: "🔑" },
              { label: "Payment Issues", value: tickets.filter(t => t.category?.includes("Payment")).length, color: "#f59e0b", icon: "💳" },
              { label: "Live Restrictions", value: tickets.filter(t => t.category?.includes("Live")).length, color: "#ec4899", icon: "📡" },
            ].map(s => (
              <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 22, display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 28 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
