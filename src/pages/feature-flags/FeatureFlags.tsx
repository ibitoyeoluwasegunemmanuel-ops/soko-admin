import { useState } from "react";
import { PageHeader } from "../../components/PageHeader";
import { Zap } from "lucide-react";

interface Flag {
  key: string;
  label: string;
  description: string;
  group: string;
}

const FLAGS: Flag[] = [
  // Live
  { key: "live_streaming",  label: "Live Streaming",        description: "Master toggle for all live features",  group: "Live" },
  { key: "voice_live",      label: "Voice Live",            description: "Audio-only live streams",              group: "Live" },
  { key: "camera_live",     label: "Camera Live",           description: "Video camera live streams",            group: "Live" },
  { key: "products_live",   label: "Products Live",         description: "Sell products during a live stream",   group: "Live" },
  { key: "obs_rtmp",        label: "OBS / RTMP",            description: "External encoder streaming",           group: "Live" },
  { key: "watch_party",     label: "Watch Party",           description: "Watch videos together live",           group: "Live" },
  { key: "cast_screen",     label: "Cast / Screen Share",   description: "Share device screen live",             group: "Live" },
  { key: "mobile_game",     label: "Mobile Game Live",      description: "Stream mobile gameplay",               group: "Live" },
  { key: "reaction_live",   label: "Reaction Live",         description: "React to videos in real-time",         group: "Live" },
  { key: "battle",          label: "Battle Mode",           description: "Creator vs creator gift battles",      group: "Live" },
  // Commerce
  { key: "marketplace",     label: "Marketplace",           description: "Product buying & selling platform",    group: "Commerce" },
  { key: "services",        label: "Services",              description: "Service listings & bookings",          group: "Commerce" },
  { key: "auctions",        label: "Auctions",              description: "Time-limited bidding auctions",        group: "Commerce" },
  { key: "withdrawals",     label: "Withdrawals",           description: "Allow users to withdraw earnings",     group: "Commerce" },
  // Social
  { key: "ai_assistant",    label: "AI Assistant",          description: "In-app AI chat & recommendations",     group: "Social" },
  { key: "subscriptions",   label: "Subscriptions",         description: "Creator subscription tiers",           group: "Social" },
  { key: "ads_boost",       label: "Ads & Boost",           description: "Paid promotion for content/products",  group: "Social" },
  // Platform
  { key: "kyc_required",    label: "KYC Required",          description: "Force identity verification for payouts", group: "Platform" },
];

const GROUPS = ["Live", "Commerce", "Social", "Platform"];
const GROUP_COLOR: Record<string, string> = {
  Live:     "#ef4444",
  Commerce: "#10b981",
  Social:   "#3b82f6",
  Platform: "#7c3aed",
};

export function FeatureFlags() {
  const [flags, setFlags] = useState<Record<string, boolean>>(
    Object.fromEntries(FLAGS.map(f => [f.key, true]))
  );
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  function toggle(key: string) {
    setFlags(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function save() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }, 600);
  }

  const enabledCount = Object.values(flags).filter(Boolean).length;

  return (
    <div>
      <PageHeader title="Feature Flags" sub={`${enabledCount} of ${FLAGS.length} features enabled`}>
        <button
          onClick={save}
          disabled={saving}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all ${
            saved
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "bg-[#7c3aed] text-white hover:bg-purple-600"
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          {saving ? "Saving..." : saved ? "Saved!" : "Save All Changes"}
        </button>
      </PageHeader>

      <div className="p-6 space-y-6">
        {GROUPS.map(group => {
          const groupFlags = FLAGS.filter(f => f.group === group);
          const color = GROUP_COLOR[group];
          return (
            <div key={group}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <p className="text-[13px] font-black text-white">{group}</p>
                <div className="flex-1 h-px bg-[#1e1e2e]" />
                <p className="text-[11px] text-white/25">
                  {groupFlags.filter(f => flags[f.key]).length}/{groupFlags.length} on
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {groupFlags.map(flag => (
                  <div
                    key={flag.key}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      flags[flag.key]
                        ? "bg-[#12121c] border-[#2a2a3e]"
                        : "bg-[#0d0d16] border-[#1e1e2e] opacity-70"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-white/80 leading-tight">{flag.label}</p>
                      <p className="text-[11px] text-white/25 mt-0.5 leading-tight">{flag.description}</p>
                    </div>
                    <button
                      onClick={() => toggle(flag.key)}
                      className={`relative w-11 h-6 rounded-full transition-all flex-shrink-0 ml-4 ${
                        flags[flag.key] ? "bg-[#7c3aed]" : "bg-[#1e1e2e]"
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                          flags[flag.key] ? "left-6" : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
