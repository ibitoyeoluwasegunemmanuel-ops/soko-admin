import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { Code, Key, Webhook, Smartphone, AlertTriangle, Plus, Trash2, Copy, CheckCircle, ToggleLeft, ToggleRight } from "lucide-react";

type Tab = "api-keys" | "webhooks" | "versions" | "maintenance";

const inputSt = { width: "100%", height: 40, padding: "0 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 14, outline: "none" } as React.CSSProperties;

function generateKey(prefix = "sk"): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const random = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => chars[b % chars.length]).join("");
  return `${prefix}_${random}`;
}

export function DeveloperTools() {
  const [tab, setTab] = useState<Tab>("api-keys");
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [maintenance, setMaintenance] = useState({ enabled: false, message: "Soko is undergoing scheduled maintenance. We'll be back shortly.", eta: "" });
  const [versions, setVersions] = useState({ min_ios: "1.0.0", min_android: "1.0.0", force_update_ios: false, force_update_android: false, latest_ios: "2.0.0", latest_android: "2.0.0" });

  const [kForm, setKForm] = useState({ name: "", permissions: "read", expires_days: 365 });
  const [wForm, setWForm] = useState({ url: "", events: [] as string[], is_active: true });

  const WEBHOOK_EVENTS = ["order.created", "order.completed", "payment.received", "user.registered", "creator.monetized", "withdrawal.approved", "live.started", "product.approved"];

  useEffect(() => {
    async function load() {
      const [keyR, whR, cfgR] = await Promise.all([
        supabase.from("api_keys").select("*").order("created_at", { ascending: false }),
        supabase.from("webhooks").select("*").order("created_at", { ascending: false }),
        supabase.from("app_config").select("key,value").in("key", ["maintenance_mode", "app_versions"]),
      ]);
      setApiKeys(keyR.data ?? []);
      setWebhooks(whR.data ?? []);
      for (const c of cfgR.data ?? []) {
        try {
          if (c.key === "maintenance_mode") setMaintenance(JSON.parse(c.value));
          if (c.key === "app_versions") setVersions(JSON.parse(c.value));
        } catch {}
      }
    }
    load();
  }, []);

  async function createKey() {
    setSaving(true);
    const key = generateKey("sk_soko");
    const expires_at = new Date(Date.now() + kForm.expires_days * 86400000).toISOString();
    const { data } = await supabase.from("api_keys").insert({ name: kForm.name, key_prefix: key.slice(0, 12) + "…", key_hash: key, permissions: kForm.permissions, expires_at }).select().single();
    if (data) { setApiKeys(prev => [data, ...prev]); setNewKey(key); }
    setKForm({ name: "", permissions: "read", expires_days: 365 });
    setSaving(false);
  }

  async function revokeKey(id: string) {
    await supabase.from("api_keys").delete().eq("id", id);
    setApiKeys(prev => prev.filter(k => k.id !== id));
  }

  async function addWebhook() {
    const { data } = await supabase.from("webhooks").insert(wForm).select().single();
    if (data) setWebhooks(prev => [data, ...prev]);
    setWForm({ url: "", events: [], is_active: true });
  }

  async function toggleWebhook(id: string, active: boolean) {
    await supabase.from("webhooks").update({ is_active: !active }).eq("id", id);
    setWebhooks(prev => prev.map(w => w.id === id ? { ...w, is_active: !active } : w));
  }

  async function saveMaintenance() {
    await supabase.from("app_config").upsert({ key: "maintenance_mode", value: JSON.stringify(maintenance) });
  }

  async function saveVersions() {
    await supabase.from("app_config").upsert({ key: "app_versions", value: JSON.stringify(versions) });
  }

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id); setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div>
      <PageHeader title="Developer Tools" sub="API keys, webhooks, app version management and maintenance mode" />
      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", gap: 4, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 4, width: "fit-content" }}>
          {[{ key: "api-keys", label: "API Keys", icon: <Key size={13} /> }, { key: "webhooks", label: "Webhooks", icon: <Webhook size={13} /> }, { key: "versions", label: "App Versions", icon: <Smartphone size={13} /> }, { key: "maintenance", label: "Maintenance", icon: <AlertTriangle size={13} /> }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as Tab)} style={{ padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: tab === t.key ? "#7c3aed" : "transparent", color: tab === t.key ? "#fff" : "var(--muted)", display: "flex", alignItems: "center", gap: 5 }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* API KEYS */}
        {tab === "api-keys" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {newKey && (
              <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 14, padding: 18 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#10b981", marginBottom: 8 }}>⚠ Copy this key now — it won't be shown again</p>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <code style={{ flex: 1, fontFamily: "monospace", fontSize: 13, color: "var(--text)", background: "var(--bg)", padding: "10px 14px", borderRadius: 10, wordBreak: "break-all" }}>{newKey}</code>
                  <button onClick={() => copy(newKey, "new")} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: copied === "new" ? "#10b981" : "var(--muted)", cursor: "pointer", flexShrink: 0 }}>
                    {copied === "new" ? <CheckCircle size={15} /> : <Copy size={15} />}
                  </button>
                </div>
                <button onClick={() => setNewKey(null)} style={{ marginTop: 10, background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--muted)" }}>Dismiss</button>
              </div>
            )}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 22 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>Create API Key</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div><label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 5 }}>Key Name</label><input value={kForm.name} onChange={e => setKForm(p => ({ ...p, name: e.target.value }))} placeholder="Partner Integration" style={inputSt} /></div>
                <div><label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 5 }}>Permissions</label>
                  <select value={kForm.permissions} onChange={e => setKForm(p => ({ ...p, permissions: e.target.value }))} style={{ ...inputSt, height: 42 }}>
                    <option value="read">Read Only</option>
                    <option value="write">Read + Write</option>
                    <option value="admin">Full Admin</option>
                  </select>
                </div>
                <div><label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 5 }}>Expires (days)</label><input type="number" value={kForm.expires_days} onChange={e => setKForm(p => ({ ...p, expires_days: Number(e.target.value) }))} style={inputSt} /></div>
              </div>
              <button onClick={createKey} disabled={!kForm.name || saving} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "#7c3aed", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <Plus size={13} /> Generate Key
              </button>
            </div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
              {apiKeys.map(k => (
                <div key={k.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 18px", borderBottom: "1px solid var(--border)" }}>
                  <Key size={14} style={{ color: "#a78bfa", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{k.name}</div>
                    <code style={{ fontSize: 11, color: "var(--muted)" }}>{k.key_prefix}</code>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, color: k.permissions === "admin" ? "#ef4444" : k.permissions === "write" ? "#f59e0b" : "#10b981", background: k.permissions === "admin" ? "rgba(239,68,68,0.1)" : k.permissions === "write" ? "rgba(245,158,11,0.1)" : "rgba(16,185,129,0.1)" }}>{k.permissions}</span>
                  <button onClick={() => revokeKey(k.id)} style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.08)", color: "#ef4444", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Revoke</button>
                </div>
              ))}
              {apiKeys.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)", fontSize: 13 }}>No API keys</div>}
            </div>
          </div>
        )}

        {/* WEBHOOKS */}
        {tab === "webhooks" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 22 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>Add Webhook</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
                <div><label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 5 }}>Endpoint URL</label><input value={wForm.url} onChange={e => setWForm(p => ({ ...p, url: e.target.value }))} placeholder="https://yourserver.com/webhook" style={inputSt} /></div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 8 }}>Events to Subscribe</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {WEBHOOK_EVENTS.map(ev => {
                      const on = wForm.events.includes(ev);
                      return (
                        <button key={ev} onClick={() => setWForm(p => ({ ...p, events: on ? p.events.filter(e => e !== ev) : [...p.events, ev] }))}
                          style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${on ? "rgba(167,139,250,0.4)" : "var(--border)"}`, background: on ? "rgba(167,139,250,0.12)" : "transparent", color: on ? "#a78bfa" : "var(--muted)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                          {ev}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <button onClick={addWebhook} disabled={!wForm.url || wForm.events.length === 0} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "#7c3aed", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Add Webhook</button>
            </div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
              {webhooks.map(w => (
                <div key={w.id} style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <code style={{ fontSize: 12, color: "var(--text)" }}>{w.url}</code>
                    <button onClick={() => toggleWebhook(w.id, w.is_active)} style={{ background: "none", border: "none", cursor: "pointer", color: w.is_active ? "#10b981" : "var(--muted)", display: "flex" }}>
                      {w.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                    </button>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {(w.events ?? []).map((ev: string) => (
                      <span key={ev} style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: "rgba(167,139,250,0.1)", color: "#a78bfa" }}>{ev}</span>
                    ))}
                  </div>
                </div>
              ))}
              {webhooks.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)", fontSize: 13 }}>No webhooks configured</div>}
            </div>
          </div>
        )}

        {/* VERSIONS */}
        {tab === "versions" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[{ platform: "iOS" as const, icon: "🍎" }, { platform: "Android" as const, icon: "🤖" }].map(({ platform, icon }) => {
              const p = platform.toLowerCase() as "ios" | "android";
              return (
                <div key={platform} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 18 }}>{icon} {platform}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div><label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 5 }}>Latest Version</label><input value={(versions as any)[`latest_${p}`]} onChange={e => setVersions(pv => ({ ...pv, [`latest_${p}`]: e.target.value }))} placeholder="2.0.0" style={inputSt} /></div>
                    <div><label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 5 }}>Minimum Supported Version</label><input value={(versions as any)[`min_${p}`]} onChange={e => setVersions(pv => ({ ...pv, [`min_${p}`]: e.target.value }))} placeholder="1.0.0" style={inputSt} /></div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 10, background: "var(--bg)", border: "1px solid var(--border)" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Force Update</div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>Users below min version must update</div>
                      </div>
                      <button onClick={() => setVersions(pv => ({ ...pv, [`force_update_${p}`]: !(pv as any)[`force_update_${p}`] }))}
                        style={{ width: 44, height: 24, borderRadius: 99, border: "none", cursor: "pointer", background: (versions as any)[`force_update_${p}`] ? "#ef4444" : "rgba(255,255,255,0.1)", position: "relative", transition: "background 0.2s" }}>
                        <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: (versions as any)[`force_update_${p}`] ? 23 : 3, transition: "left 0.2s" }} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            <div style={{ gridColumn: "1/-1" }}>
              <button onClick={saveVersions} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "#7c3aed", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Save Version Settings</button>
            </div>
          </div>
        )}

        {/* MAINTENANCE */}
        {tab === "maintenance" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 18 }}>Maintenance Mode</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: 12, background: maintenance.enabled ? "rgba(239,68,68,0.08)" : "var(--bg)", border: `1px solid ${maintenance.enabled ? "rgba(239,68,68,0.3)" : "var(--border)"}`, transition: "all 0.2s" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: maintenance.enabled ? "#ef4444" : "var(--text)" }}>Maintenance Mode {maintenance.enabled ? "ON" : "OFF"}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>All users will see the maintenance screen</div>
                  </div>
                  <button onClick={() => setMaintenance(p => ({ ...p, enabled: !p.enabled }))}
                    style={{ width: 50, height: 28, borderRadius: 99, border: "none", cursor: "pointer", background: maintenance.enabled ? "#ef4444" : "rgba(255,255,255,0.1)", position: "relative", transition: "background 0.2s" }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: maintenance.enabled ? 25 : 3, transition: "left 0.2s" }} />
                  </button>
                </div>
                <div><label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 5 }}>Message to Users</label><textarea value={maintenance.message} onChange={e => setMaintenance(p => ({ ...p, message: e.target.value }))} rows={3} style={{ ...inputSt, height: "auto", padding: "10px 12px" }} /></div>
                <div><label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 5 }}>ETA (optional)</label><input value={maintenance.eta} onChange={e => setMaintenance(p => ({ ...p, eta: e.target.value }))} placeholder="Back in 2 hours..." style={inputSt} /></div>
                <button onClick={saveMaintenance} style={{ height: 42, borderRadius: 10, border: "none", background: maintenance.enabled ? "#ef4444" : "#7c3aed", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  {maintenance.enabled ? "🔴 Activate Maintenance Mode" : "Save Settings"}
                </button>
              </div>
            </div>
            <div style={{ background: maintenance.enabled ? "rgba(239,68,68,0.06)" : "var(--surface)", border: `1px solid ${maintenance.enabled ? "rgba(239,68,68,0.25)" : "var(--border)"}`, borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🔧</div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>User will see:</p>
              <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>{maintenance.message}</p>
              {maintenance.eta && <p style={{ fontSize: 12, color: "#f59e0b", marginTop: 10 }}>ETA: {maintenance.eta}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
