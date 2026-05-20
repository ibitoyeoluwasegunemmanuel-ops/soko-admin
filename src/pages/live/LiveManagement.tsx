import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { Radio, StopCircle, Ban } from "lucide-react";

type LiveTab = "active" | "all" | "settings";

interface LiveStream {
  id: string;
  title: string;
  type: string;
  viewer_count: number;
  status: string;
  is_active: boolean;
  created_at: string;
  host_id: string;
  host?: { username: string };
}

const LIVE_MODES = [
  { key: "voice_live",     label: "Voice Live",        group: "Live" },
  { key: "camera_live",    label: "Camera Live",        group: "Live" },
  { key: "products_live",  label: "Products Live",      group: "Live" },
  { key: "obs_rtmp",       label: "OBS / RTMP",         group: "Live" },
  { key: "watch_party",    label: "Watch Party",        group: "Live" },
  { key: "cast",           label: "Cast / Screen Share",group: "Live" },
  { key: "reaction_live",  label: "Reaction Live",      group: "Live" },
  { key: "battle",         label: "Battle",             group: "Live" },
];

function durationStr(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function LiveManagement() {
  const [tab, setTab] = useState<LiveTab>("active");
  const [activeStreams, setActiveStreams] = useState<LiveStream[]>([]);
  const [allStreams, setAllStreams] = useState<LiveStream[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Record<string, boolean>>(
    Object.fromEntries(LIVE_MODES.map(m => [m.key, true]))
  );
  const [saved, setSaved] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadActive = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("active_lives")
      .select("id,title,type,viewer_count,status,is_active,created_at,host_id,host:profiles!host_id(username)")
      .eq("status", "live")
      .order("created_at", { ascending: false });
    setActiveStreams((data as unknown as LiveStream[]) ?? []);
    setLoading(false);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("active_lives")
      .select("id,title,type,viewer_count,status,is_active,created_at,host_id,host:profiles!host_id(username)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    const { data } = await q;
    setAllStreams((data as unknown as LiveStream[]) ?? []);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    if (tab === "active") loadActive();
    if (tab === "all") loadAll();
  }, [tab, loadActive, loadAll]);

  // Real-time for active streams
  useEffect(() => {
    if (tab !== "active") return;
    const ch = supabase.channel("live-mgmt")
      .on("postgres_changes", { event: "*", schema: "public", table: "active_lives" }, () => loadActive())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [tab, loadActive]);

  async function endStream(id: string) {
    setActionLoading(id + "_end");
    await supabase.from("active_lives").update({ status: "ended", is_active: false }).eq("id", id);
    setActiveStreams(prev => prev.filter(s => s.id !== id));
    setActionLoading(null);
  }

  async function banHost(hostId: string, liveId: string) {
    setActionLoading(liveId + "_ban");
    await Promise.all([
      supabase.from("profiles").update({ can_use_camera_live: false }).eq("id", hostId),
      supabase.from("active_lives").update({ status: "ended", is_active: false }).eq("id", liveId),
    ]);
    setActiveStreams(prev => prev.filter(s => s.id !== liveId));
    setActionLoading(null);
  }

  function saveSettings() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const streams = tab === "active" ? activeStreams : allStreams;

  return (
    <div>
      <PageHeader title="Live Management" sub={`${activeStreams.length} streams active`}>
        <span className="flex items-center gap-1.5 text-[11px] text-red-400 font-bold bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full">
          <Radio className="w-3 h-3 animate-pulse" />
          {activeStreams.length} Live
        </span>
      </PageHeader>

      <div className="p-6 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 bg-[#12121c] border border-[#1e1e2e] rounded-lg p-1 w-fit">
          {[
            { id: "active", label: "Active Streams" },
            { id: "all",    label: "All Streams" },
            { id: "settings", label: "Settings" },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as LiveTab)}
              className={`px-4 py-1.5 rounded-md text-[12px] font-semibold transition-all ${
                tab === t.id ? "bg-[#7c3aed] text-white" : "text-white/40 hover:text-white/70"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* All Streams filter */}
        {tab === "all" && (
          <div className="flex items-center gap-2">
            {["all", "live", "ended", "scheduled"].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                  statusFilter === s
                    ? "bg-[#7c3aed]/20 text-purple-300 border border-purple-500/30"
                    : "bg-[#12121c] border border-[#1e1e2e] text-white/40 hover:text-white/60"
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Streams Table */}
        {(tab === "active" || tab === "all") && (
          <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e1e2e]">
                  {["Host", "Title", "Type", "Viewers", "Duration", "Status", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-black text-white/30 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e2e]">
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-3 bg-[#1e1e2e] rounded w-3/4" /></td>
                      ))}
                    </tr>
                  ))
                  : streams.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-[12px] text-white/20">
                        {tab === "active" ? "No active streams right now" : "No streams found"}
                      </td>
                    </tr>
                  )
                  : streams.map(s => (
                    <tr key={s.id} className="hover:bg-[#1a1a2a] transition-colors">
                      <td className="px-4 py-3 text-[12px] font-semibold text-white/80">
                        @{(s.host as any)?.username ?? s.host_id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-white/60 max-w-[180px] truncate">{s.title ?? "Untitled"}</td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-semibold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full">
                          {s.type ?? "camera"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-white/50">{(s.viewer_count ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-[12px] text-white/40">{durationStr(s.created_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          s.status === "live"
                            ? "text-red-400 bg-red-500/10 border border-red-500/20"
                            : s.status === "ended"
                            ? "text-white/25 bg-white/5"
                            : "text-amber-400 bg-amber-500/10"
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {s.status === "live" && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => endStream(s.id)}
                              disabled={actionLoading === s.id + "_end"}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
                            >
                              <StopCircle className="w-3 h-3" />
                              End
                            </button>
                            <button
                              onClick={() => banHost(s.host_id, s.id)}
                              disabled={actionLoading === s.id + "_ban"}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                            >
                              <Ban className="w-3 h-3" />
                              Ban Host
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}

        {/* Settings Tab */}
        {tab === "settings" && (
          <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[14px] font-black text-white">Live Mode Settings</p>
                <p className="text-[12px] text-white/30 mt-0.5">Toggle live stream types platform-wide</p>
              </div>
              <button
                onClick={saveSettings}
                className="px-4 py-2 rounded-lg text-[12px] font-semibold bg-[#7c3aed] text-white hover:bg-purple-600 transition-all"
              >
                {saved ? "Saved!" : "Save Changes"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {LIVE_MODES.map(mode => (
                <div
                  key={mode.key}
                  className="flex items-center justify-between p-4 bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl hover:border-[#2a2a3e] transition-all"
                >
                  <span className="text-[13px] font-semibold text-white/70">{mode.label}</span>
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, [mode.key]: !prev[mode.key] }))}
                    className={`relative w-10 h-5 rounded-full transition-all flex-shrink-0 ${
                      settings[mode.key] ? "bg-[#7c3aed]" : "bg-[#1e1e2e]"
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                      settings[mode.key] ? "left-5" : "left-0.5"
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
