import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { Bell, Send, CheckCircle, Clock, Megaphone, Target } from "lucide-react";

type Tab = "compose" | "history" | "scheduled";

interface NotifTemplate {
  id: string;
  label: string;
  body: string;
  target: string;
}

const TEMPLATES: NotifTemplate[] = [
  { id: "flash_sale",    label: "Flash Sale Alert",     body: "🔥 Flash Sale is LIVE! Shop limited deals before they're gone on Soko.",                         target: "all_users" },
  { id: "new_live",      label: "Creator Went Live",    body: "{{creator}} just went live! Tap to join and shop exclusive deals.",                               target: "followers" },
  { id: "order_shipped", label: "Order Shipped",        body: "Your order #{{order_ref}} has been shipped. Track your delivery in the app.",                    target: "buyer" },
  { id: "payout_done",   label: "Payout Processed",     body: "Your payout of ₦{{amount}} has been processed. Check your wallet.",                              target: "seller" },
  { id: "weekly_recap",  label: "Weekly Recap",         body: "📊 Your Soko week in review: {{views}} views, {{sales}} sales. Keep the momentum going!",        target: "creators" },
  { id: "feature_promo", label: "Feature Announcement", body: "🚀 New feature alert! {{feature_name}} is now live on Soko. Try it today.",                      target: "all_users" },
];

const TARGET_LABELS: Record<string, string> = {
  all_users:  "All Users",
  creators:   "Creators Only",
  sellers:    "Sellers Only",
  buyers:     "Buyers Only",
  followers:  "Followers of Creator",
  buyer:      "Specific Buyer",
  seller:     "Specific Seller",
};

export function Notifications() {
  const [tab, setTab] = useState<Tab>("compose");
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ sent: 0, scheduled: 0, opens: 0 });

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState("all_users");
  const [scheduledAt, setScheduledAt] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("push_notifications")
        .select("id,title,body,target,status,sent_at,opens,created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      const list = data ?? [];
      setHistory(list);
      setStats({
        sent: list.filter(n => n.status === "sent").length,
        scheduled: list.filter(n => n.status === "scheduled").length,
        opens: list.reduce((s: number, n: any) => s + Number(n.opens ?? 0), 0),
      });
      setLoading(false);
    }
    load();
  }, []);

  async function send() {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    const payload: any = { title, body, target, status: scheduledAt ? "scheduled" : "sent", created_at: new Date().toISOString() };
    if (scheduledAt) payload.scheduled_at = new Date(scheduledAt).toISOString();
    else payload.sent_at = new Date().toISOString();
    const { data } = await supabase.from("push_notifications").insert(payload).select().single();
    if (data) {
      setHistory(prev => [data, ...prev]);
      setStats(prev => ({ ...prev, [scheduledAt ? "scheduled" : "sent"]: prev[scheduledAt ? "scheduled" : "sent"] + 1 }));
    }
    setSending(false);
    setSent(true);
    setTitle(""); setBody(""); setScheduledAt("");
    setTimeout(() => setSent(false), 3000);
  }

  function useTemplate(t: NotifTemplate) {
    setTitle(t.label);
    setBody(t.body);
    setTarget(t.target);
  }

  function tAgo(iso: string) {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }

  const historyByTab = history.filter(n => {
    if (tab === "history") return n.status === "sent";
    if (tab === "scheduled") return n.status === "scheduled";
    return false;
  });

  return (
    <div>
      <PageHeader title="Notifications" sub="Compose and manage push notifications to platform users" />

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Sent Notifications" value={stats.sent}      icon={Send}     color="#7c3aed" />
          <StatCard label="Scheduled"          value={stats.scheduled} icon={Clock}    color="#f59e0b" />
          <StatCard label="Total Opens"        value={stats.opens}     icon={Bell}     color="#10b981" />
        </div>

        <div className="flex gap-1 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg p-1 w-fit">
          {(["compose", "history", "scheduled"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-[12px] font-semibold capitalize transition-all ${tab === t ? "bg-[#7c3aed] text-white" : "text-white/40 hover:text-white/70"}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === "compose" && (
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 bg-[#12121c] border border-[#1e1e2e] rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Megaphone className="w-4 h-4 text-purple-400" />
                <p className="text-[14px] font-black text-white">Compose Notification</p>
              </div>

              <div>
                <label className="block text-[11px] text-white/40 mb-1.5">Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Notification title…"
                  className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-4 py-2.5 text-[12px] text-white focus:outline-none focus:border-purple-500/50" />
              </div>

              <div>
                <label className="block text-[11px] text-white/40 mb-1.5">Body</label>
                <textarea value={body} onChange={e => setBody(e.target.value)} rows={4} placeholder="Notification body…"
                  className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-4 py-2.5 text-[12px] text-white focus:outline-none focus:border-purple-500/50 resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-white/40 mb-1.5 flex items-center gap-1"><Target className="w-3 h-3" />Target Audience</label>
                  <select value={target} onChange={e => setTarget(e.target.value)}
                    className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2.5 text-[12px] text-white focus:outline-none focus:border-purple-500/50">
                    {Object.entries(TARGET_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 mb-1.5 flex items-center gap-1"><Clock className="w-3 h-3" />Schedule (optional)</label>
                  <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
                    className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2.5 text-[12px] text-white focus:outline-none focus:border-purple-500/50" />
                </div>
              </div>

              {sent && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <p className="text-[12px] text-emerald-400">{scheduledAt ? "Notification scheduled!" : "Notification sent successfully!"}</p>
                </div>
              )}

              <button onClick={send} disabled={sending || !title.trim() || !body.trim()}
                className="w-full py-2.5 rounded-lg text-[12px] font-black bg-[#7c3aed] text-white hover:bg-[#6d28d9] transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                <Send className="w-3.5 h-3.5" />
                {sending ? "Sending…" : scheduledAt ? "Schedule Notification" : "Send Now"}
              </button>
            </div>

            <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl p-4">
              <p className="text-[13px] font-black text-white mb-3">Quick Templates</p>
              <div className="space-y-2">
                {TEMPLATES.map(t => (
                  <button key={t.id} onClick={() => useTemplate(t)}
                    className="w-full text-left p-3 rounded-lg bg-[#0a0a0f] border border-[#1e1e2e] hover:border-purple-500/30 transition-all group">
                    <p className="text-[12px] font-semibold text-white group-hover:text-purple-400 transition-colors">{t.label}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">{TARGET_LABELS[t.target]}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {(tab === "history" || tab === "scheduled") && (
          <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl overflow-hidden">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[#1e1e2e] text-white/30 text-[11px] font-bold uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Notification</th>
                  <th className="px-4 py-3 text-left">Target</th>
                  <th className="px-4 py-3 text-left">Opens</th>
                  <th className="px-4 py-3 text-left">{tab === "history" ? "Sent" : "Scheduled For"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e2e]">
                {loading ? Array(4).fill(0).map((_, i) => (
                  <tr key={i}><td colSpan={4} className="px-4 py-3"><div className="h-4 bg-[#1e1e2e] rounded animate-pulse" /></td></tr>
                )) : historyByTab.map(n => (
                  <tr key={n.id} className="hover:bg-[#1a1a2a] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white">{n.title}</p>
                      <p className="text-[10px] text-white/30 max-w-[240px] truncate">{n.body}</p>
                    </td>
                    <td className="px-4 py-3 text-white/50">{TARGET_LABELS[n.target] ?? n.target}</td>
                    <td className="px-4 py-3 text-white/60">{n.opens ?? 0}</td>
                    <td className="px-4 py-3 text-white/30">{tAgo(n.sent_at ?? n.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && historyByTab.length === 0 && (
              <p className="text-center text-white/20 py-8 text-[12px]">No {tab === "history" ? "sent" : "scheduled"} notifications</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
