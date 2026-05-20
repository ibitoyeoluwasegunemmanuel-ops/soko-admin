import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { RefreshCw, Activity } from "lucide-react";

interface LogEntry {
  id: string;
  action: string;
  target_id: string | null;
  reason: string | null;
  created_at: string;
  admin_id: string | null;
  details: any;
}

const ACTION_COLORS: Record<string, string> = {
  ban:           "text-red-400 bg-red-500/10",
  unban:         "text-emerald-400 bg-emerald-500/10",
  suspend:       "text-orange-400 bg-orange-500/10",
  verify:        "text-blue-400 bg-blue-500/10",
  end_stream:    "text-amber-400 bg-amber-500/10",
  approve:       "text-emerald-400 bg-emerald-500/10",
  reject:        "text-red-400 bg-red-500/10",
  delete:        "text-red-400 bg-red-500/10",
  update:        "text-purple-400 bg-purple-500/10",
  login:         "text-blue-400 bg-blue-500/10",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

export function SystemLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("moderation_log")
      .select("id,action,target_id,reason,created_at,admin_id,details")
      .order("created_at", { ascending: false })
      .limit(100);

    if (typeFilter !== "all") q = q.eq("action", typeFilter);

    const { data } = await q;
    setLogs((data as LogEntry[]) ?? []);
    setLastRefreshed(new Date());
    setLoading(false);
  }, [typeFilter]);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [autoRefresh, load]);

  // Gather unique action types
  const actionTypes = Array.from(new Set(logs.map(l => l.action)));

  return (
    <div>
      <PageHeader title="System Logs" sub="Admin actions & platform events">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(p => !p)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all ${
              autoRefresh
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-[#1e1e2e] text-white/40 border-[#2a2a3e]"
            }`}
          >
            <Activity className="w-3 h-3" />
            Auto-refresh {autoRefresh ? "ON" : "OFF"}
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-[#1e1e2e] text-white/50 border border-[#2a2a3e] hover:border-purple-500/30 hover:text-purple-300 transition-all"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </PageHeader>

      <div className="p-6 space-y-4">
        {/* Stats bar */}
        <div className="flex items-center gap-4">
          <div className="bg-[#12121c] border border-[#1e1e2e] rounded-lg px-4 py-2.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[12px] text-white/50">{logs.length} entries</span>
          </div>
          <div className="bg-[#12121c] border border-[#1e1e2e] rounded-lg px-4 py-2.5">
            <span className="text-[12px] text-white/30">
              Last refreshed: {lastRefreshed.toLocaleTimeString("en-NG")}
            </span>
          </div>
          {autoRefresh && (
            <div className="bg-[#12121c] border border-emerald-500/20 rounded-lg px-4 py-2.5">
              <span className="text-[12px] text-emerald-400/60">Refreshes every 30s</span>
            </div>
          )}
        </div>

        {/* Type filter */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setTypeFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
              typeFilter === "all" ? "bg-[#7c3aed] text-white" : "bg-[#12121c] border border-[#1e1e2e] text-white/40 hover:text-white/60"
            }`}
          >
            All
          </button>
          {actionTypes.map(a => (
            <button
              key={a}
              onClick={() => setTypeFilter(a)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                typeFilter === a ? "bg-[#7c3aed] text-white" : "bg-[#12121c] border border-[#1e1e2e] text-white/40 hover:text-white/60"
              }`}
            >
              {a}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e1e2e]">
                {["Action", "Target", "Reason / Details", "Admin", "Timestamp"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-black text-white/30 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e2e]">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-3 bg-[#1e1e2e] rounded w-3/4" /></td>
                    ))}
                  </tr>
                ))
                : logs.length === 0
                ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <Activity className="w-8 h-8 text-white/10 mx-auto mb-3" />
                      <p className="text-[12px] text-white/20">No log entries found</p>
                      <p className="text-[11px] text-white/10 mt-1">Logs appear when admins take actions</p>
                    </td>
                  </tr>
                )
                : logs.map(l => (
                  <tr key={l.id} className="hover:bg-[#1a1a2a] transition-colors">
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${ACTION_COLORS[l.action] ?? "text-white/40 bg-white/5"}`}>
                        {l.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] font-mono text-white/40">
                      {l.target_id ? l.target_id.slice(0, 14) + "…" : "—"}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-white/50 max-w-[240px]">
                      <p className="truncate">{l.reason ?? (l.details ? JSON.stringify(l.details).slice(0, 60) : "—")}</p>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-white/30">
                      {l.admin_id ? l.admin_id.slice(0, 10) + "…" : "system"}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-white/25 whitespace-nowrap">
                      {fmtDate(l.created_at)}
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
