import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { Bot, Shield, MessageSquare, Search, TrendingUp, Save, ToggleLeft, ToggleRight, AlertTriangle } from "lucide-react";

interface AIModule {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  enabled: boolean;
  threshold?: number;
  prompt?: string;
}

const DEFAULT_MODULES: AIModule[] = [
  { key: "ai_moderation",       label: "AI Chat Moderation",     description: "Real-time filtering of live stream chat messages for hate speech, spam, and violations.", icon: <Shield className="w-4 h-4" />,        color: "#ef4444", enabled: true,  threshold: 0.7 },
  { key: "ai_recommendations",  label: "Product Recommendations", description: "ML-based product suggestions on marketplace, live streams, and user feeds.",              icon: <TrendingUp className="w-4 h-4" />,    color: "#7c3aed", enabled: true  },
  { key: "ai_fraud_detection",  label: "Fraud Detection",         description: "Anomaly detection on payment patterns, fake reviews, and suspicious account activity.",   icon: <AlertTriangle className="w-4 h-4" />, color: "#f97316", enabled: true,  threshold: 0.85 },
  { key: "ai_search",           label: "Semantic Search",         description: "Vector-based product and creator search for better relevance and discovery.",              icon: <Search className="w-4 h-4" />,        color: "#3b82f6", enabled: false },
  { key: "ai_caption_assist",   label: "Caption Assistant",       description: "Auto-suggests captions and hashtags when creators post products or go live.",              icon: <MessageSquare className="w-4 h-4" />, color: "#10b981", enabled: false },
  { key: "ai_support_bot",      label: "Support Bot",             description: "Automated first-line responses to buyer/seller support tickets.",                         icon: <Bot className="w-4 h-4" />,           color: "#06b6d4", enabled: false },
];

export function AISettings() {
  const [modules, setModules] = useState<AIModule[]>(DEFAULT_MODULES);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [systemPrompt, setSystemPrompt] = useState("You are Soko AI, a helpful assistant for the Soko live commerce platform. You help buyers find products, assist creators with their streams, and moderate platform interactions professionally.");

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("app_config").select("key,value").in("key", DEFAULT_MODULES.map(m => m.key).concat(["ai_system_prompt"]));
      if (!data) return;
      setModules(prev => prev.map(m => {
        const row = data.find(d => d.key === m.key);
        if (!row) return m;
        try {
          const parsed = JSON.parse(row.value);
          return { ...m, enabled: parsed.enabled ?? m.enabled, threshold: parsed.threshold ?? m.threshold, prompt: parsed.prompt ?? m.prompt };
        } catch { return m; }
      }));
      const promptRow = data.find(d => d.key === "ai_system_prompt");
      if (promptRow) setSystemPrompt(promptRow.value);
    }
    load();
  }, []);

  async function toggle(key: string) {
    setModules(prev => prev.map(m => m.key === key ? { ...m, enabled: !m.enabled } : m));
  }

  async function save(key: string) {
    setSaving(key);
    const mod = modules.find(m => m.key === key);
    if (mod) {
      await supabase.from("app_config").upsert({ key, value: JSON.stringify({ enabled: mod.enabled, threshold: mod.threshold, prompt: mod.prompt }) });
    }
    setSaving(null);
    setSaved(key);
    setTimeout(() => setSaved(null), 2000);
  }

  async function saveSystemPrompt() {
    setSaving("system_prompt");
    await supabase.from("app_config").upsert({ key: "ai_system_prompt", value: systemPrompt });
    setSaving(null);
    setSaved("system_prompt");
    setTimeout(() => setSaved(null), 2000);
  }

  function updateThreshold(key: string, val: number) {
    setModules(prev => prev.map(m => m.key === key ? { ...m, threshold: val } : m));
  }

  return (
    <div>
      <PageHeader title="AI Settings" sub="Configure AI modules, moderation thresholds, and system prompts" />

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-3 gap-4">
          {modules.map(mod => (
            <div key={mod.key} className="bg-[#12121c] border border-[#1e1e2e] rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${mod.color}15`, color: mod.color }}>
                    {mod.icon}
                  </div>
                  <div>
                    <p className="text-[13px] font-black text-white">{mod.label}</p>
                    <span className={`text-[10px] font-bold ${mod.enabled ? "text-emerald-400" : "text-white/25"}`}>
                      {mod.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
                <button onClick={() => toggle(mod.key)} className="text-white/30 hover:text-white/70 transition-colors">
                  {mod.enabled
                    ? <ToggleRight className="w-6 h-6" style={{ color: mod.color }} />
                    : <ToggleLeft className="w-6 h-6" />}
                </button>
              </div>

              <p className="text-[11px] text-white/40 mb-3 leading-relaxed">{mod.description}</p>

              {mod.threshold !== undefined && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-white/30">Confidence Threshold</label>
                    <span className="text-[10px] font-bold" style={{ color: mod.color }}>{(mod.threshold * 100).toFixed(0)}%</span>
                  </div>
                  <input type="range" min={0.5} max={0.99} step={0.01} value={mod.threshold}
                    onChange={e => updateThreshold(mod.key, Number(e.target.value))}
                    className="w-full h-1 rounded-full appearance-none cursor-pointer bg-[#1e1e2e]"
                    style={{ accentColor: mod.color }} />
                  <div className="flex justify-between text-[9px] text-white/20 mt-0.5">
                    <span>50% (permissive)</span><span>99% (strict)</span>
                  </div>
                </div>
              )}

              <button onClick={() => save(mod.key)} disabled={saving === mod.key}
                className={`w-full py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 border transition-all ${saved === mod.key ? "text-emerald-400 border-emerald-500/25 bg-emerald-500/10" : "text-white/40 border-white/10 hover:border-white/20 hover:text-white/70"}`}>
                {saved === mod.key ? <><CheckIcon /> Saved</> : saving === mod.key ? "Saving…" : <><Save className="w-3 h-3" /> Save</>}
              </button>
            </div>
          ))}
        </div>

        <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="w-4 h-4 text-purple-400" />
            <p className="text-[14px] font-black text-white">AI System Prompt</p>
          </div>
          <p className="text-[11px] text-white/30 mb-3">Base instructions given to all AI modules. Be specific about tone, platform context, and limitations.</p>
          <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} rows={5}
            className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-4 py-3 text-[12px] text-white/70 focus:outline-none focus:border-purple-500/50 resize-none leading-relaxed" />
          <div className="flex items-center justify-between mt-3">
            <span className="text-[10px] text-white/20">{systemPrompt.length} chars</span>
            <button onClick={saveSystemPrompt} disabled={saving === "system_prompt"}
              className={`px-4 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all ${saved === "system_prompt" ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/25" : "bg-[#7c3aed] text-white hover:bg-[#6d28d9]"}`}>
              {saved === "system_prompt" ? <><CheckIcon /> Saved</> : saving === "system_prompt" ? "Saving…" : <><Save className="w-3 h-3" /> Save Prompt</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
