import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { PageHeader } from "../../components/PageHeader";
import { Globe, DollarSign, Percent, Bell, Shield, Save, CheckCircle, ShoppingBag } from "lucide-react";

type Tab = "commission" | "countries" | "currencies" | "withdrawal" | "payouts" | "notifications" | "content" | "live_shop";

const COUNTRIES = [
  { code: "NG", name: "Nigeria",      flag: "🇳🇬", currency: "NGN" },
  { code: "GH", name: "Ghana",        flag: "🇬🇭", currency: "GHS" },
  { code: "KE", name: "Kenya",        flag: "🇰🇪", currency: "KES" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", currency: "ZAR" },
  { code: "UG", name: "Uganda",       flag: "🇺🇬", currency: "UGX" },
  { code: "TZ", name: "Tanzania",     flag: "🇹🇿", currency: "TZS" },
  { code: "RW", name: "Rwanda",       flag: "🇷🇼", currency: "RWF" },
  { code: "ET", name: "Ethiopia",     flag: "🇪🇹", currency: "ETB" },
  { code: "CM", name: "Cameroon",     flag: "🇨🇲", currency: "XAF" },
  { code: "SN", name: "Senegal",      flag: "🇸🇳", currency: "XOF" },
  { code: "GB", name: "UK",           flag: "🇬🇧", currency: "GBP" },
  { code: "US", name: "USA",          flag: "🇺🇸", currency: "USD" },
];

const inputSt = { width: "100%", height: 42, padding: "0 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 14, outline: "none" } as React.CSSProperties;

export function AppSettings() {
  const [tab, setTab]       = useState<Tab>("commission");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [enabledCountries, setEnabledCountries] = useState<string[]>(["NG"]);
  const [baseCurrency, setBaseCurrency] = useState("NGN");
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({ USD: 0.00065, GBP: 0.00053, GHS: 0.0089 });

  const [commission, setCommission] = useState({
    marketplace: 10, services: 15, auctions: 8,
    live_gifts: 30, subscriptions: 20, ads: 100,
  });

  const [withdrawal, setWithdrawal] = useState({
    min_ngn: 1000, max_ngn: 5000000,
    pending_days: 3, kyc_threshold: 50000,
    daily_limit: 500000, weekly_limit: 2000000,
  });

  const [countryPayouts, setCountryPayouts] = useState<Record<string, { provider: string; method: string; minPayout: number; fee: number; enabled: boolean }>>({
    NG: { provider: "Paystack",      method: "Bank Transfer (NGN)",         minPayout: 1000,   fee: 1.5,  enabled: true  },
    GH: { provider: "Flutterwave",   method: "Mobile Money (GHS)",          minPayout: 50,     fee: 1.5,  enabled: true  },
    KE: { provider: "Flutterwave",   method: "M-Pesa / Bank (KES)",         minPayout: 500,    fee: 1.5,  enabled: true  },
    ZA: { provider: "Flutterwave",   method: "Bank Transfer (ZAR)",         minPayout: 100,    fee: 1.8,  enabled: true  },
    UG: { provider: "Flutterwave",   method: "Mobile Money (UGX)",          minPayout: 5000,   fee: 1.5,  enabled: true  },
    TZ: { provider: "Flutterwave",   method: "Mobile Money (TZS)",          minPayout: 5000,   fee: 1.5,  enabled: false },
    RW: { provider: "Flutterwave",   method: "Mobile Money (RWF)",          minPayout: 2000,   fee: 1.5,  enabled: false },
    ET: { provider: "Flutterwave",   method: "Bank Transfer (ETB)",         minPayout: 500,    fee: 2.0,  enabled: false },
    CM: { provider: "Flutterwave",   method: "Mobile Money (XAF)",          minPayout: 1000,   fee: 2.0,  enabled: false },
    SN: { provider: "Flutterwave",   method: "Mobile Money (XOF)",          minPayout: 1000,   fee: 2.0,  enabled: false },
    GB: { provider: "Wise",          method: "Bank Transfer (GBP)",         minPayout: 10,     fee: 0.5,  enabled: true  },
    US: { provider: "Stripe",        method: "ACH Bank Transfer (USD)",     minPayout: 10,     fee: 0.3,  enabled: true  },
  });

  const [notifications, setNotifications] = useState({
    push_enabled: true, email_enabled: true, sms_enabled: false,
    order_updates: true, live_alerts: true, promo_messages: true,
    payment_alerts: true, security_alerts: true,
  });

  const [content, setContent] = useState({
    min_age: 13, adult_content: false,
    max_video_mb: 500, max_image_mb: 20,
    auto_moderation: true, nsfw_detection: true,
    max_live_hours: 8, max_caption_length: 2200,
  });

  const [liveShop, setLiveShop] = useState({
    enabled: true,
    product_card_enabled: true,
    auto_popup_enabled: true,
    ai_question_detection: true,
    require_seller_approval: false,
    commission_live_sales: 8,
    max_products_per_live: 20,
    flash_deal_allowed: true,
    free_gift_allowed: true,
    live_deal_max_discount: 80,
    service_booking_enabled: true,
    guest_can_buy: true,
    auto_show_card_on_pin: true,
  });

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("app_config").select("key,value")
        .in("key", ["enabled_countries","base_currency","exchange_rates","commission_config","withdrawal_config","notification_config","content_config"]);
      for (const c of data ?? []) {
        try {
          const v = JSON.parse(c.value);
          if (c.key === "enabled_countries") setEnabledCountries(v);
          if (c.key === "base_currency") setBaseCurrency(c.value);
          if (c.key === "exchange_rates") setExchangeRates(v);
          if (c.key === "commission_config") setCommission(v);
          if (c.key === "withdrawal_config") setWithdrawal(v);
          if (c.key === "notification_config") setNotifications(v);
          if (c.key === "content_config") setContent(v);
        } catch {}
      }
      setLoading(false);
    }
    load();
  }, []);

  async function save(key: string, value: any, label: string) {
    setSaving(true);
    await supabase.from("app_config").upsert({ key, value: typeof value === "string" ? value : JSON.stringify(value) });
    setSaving(false); setSaved(label); setTimeout(() => setSaved(null), 2500);
  }

  function toggleCountry(code: string) {
    setEnabledCountries(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
  }

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "commission",    label: "Commission",    icon: <Percent size={14} /> },
    { key: "countries",     label: "Countries",     icon: <Globe size={14} /> },
    { key: "currencies",    label: "Currencies",    icon: <DollarSign size={14} /> },
    { key: "withdrawal",    label: "Withdrawals",   icon: <DollarSign size={14} /> },
    { key: "payouts",       label: "Payout Rails",  icon: <Globe size={14} /> },
    { key: "notifications", label: "Notifications", icon: <Bell size={14} /> },
    { key: "content",       label: "Content Rules", icon: <Shield size={14} /> },
    { key: "live_shop",     label: "Live Shopping", icon: <ShoppingBag size={14} /> },
  ];

  const SaveBtn = ({ configKey, value, label }: { configKey: string; value: any; label: string }) => (
    <button onClick={() => save(configKey, value, label)} disabled={saving}
      style={{ padding: "8px 18px", borderRadius: 10, border: "none", display: "flex", alignItems: "center", gap: 6, background: saved === label ? "#10b981" : "#7c3aed", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "background 0.2s" }}>
      {saved === label ? <><CheckCircle size={13} /> Saved!</> : saving ? "Saving…" : <><Save size={13} /> Save</>}
    </button>
  );

  const NumField = ({ label, hint, value, onChange, prefix }: { label: string; hint?: string; value: number; onChange: (v: number) => void; prefix?: string }) => (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{label}</label>
      <div style={{ position: "relative" }}>
        {prefix && <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", fontSize: 13, pointerEvents: "none" }}>{prefix}</span>}
        <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} style={{ ...inputSt, paddingLeft: prefix ? 30 : 14 }} />
      </div>
      {hint && <p style={{ fontSize: 11, color: "rgba(240,242,255,0.2)", marginTop: 4 }}>{hint}</p>}
    </div>
  );

  const Toggle = ({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 12, background: "var(--bg)", border: "1px solid var(--border)" }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{hint}</div>}
      </div>
      <button onClick={() => onChange(!value)} style={{
        width: 44, height: 24, borderRadius: 99, border: "none", cursor: "pointer",
        background: value ? "#7c3aed" : "rgba(255,255,255,0.1)",
        position: "relative", transition: "background 0.2s",
      }}>
        <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: value ? 23 : 3, transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
      </button>
    </div>
  );

  const Card = ({ title, children, onSave, configKey, value, label }: { title: string; children: React.ReactNode; onSave?: () => void; configKey?: string; value?: any; label?: string }) => (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{title}</p>
        {configKey && <SaveBtn configKey={configKey} value={value} label={label!} />}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{children}</div>
    </div>
  );

  return (
    <div>
      <PageHeader title="App Settings" sub="Countries, currencies, commission rates, withdrawal rules and content policies" />

      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Tab bar */}
        <div style={{ display: "flex", gap: 4, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 4, width: "fit-content", flexWrap: "wrap" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
              background: tab === t.key ? "#7c3aed" : "transparent",
              color: tab === t.key ? "#fff" : "var(--muted)",
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* COMMISSION */}
        {tab === "commission" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card title="Platform Commission Rates (%)" configKey="commission_config" value={commission} label="Commission">
              {[
                { key: "marketplace" as const, label: "Marketplace Sales",     hint: "% taken from every product sold" },
                { key: "services"   as const, label: "Service Payments",       hint: "% taken from service transactions" },
                { key: "auctions"   as const, label: "Auction Winnings",       hint: "% taken from winning bid amount" },
                { key: "live_gifts" as const, label: "Live Gifts (Platform)",  hint: "% Soko retains from all gifts" },
                { key: "subscriptions" as const, label: "Subscriptions",       hint: "% Soko takes from subscription revenue" },
              ].map(f => (
                <div key={f.key}>
                  <NumField label={f.label} hint={f.hint} value={commission[f.key]} onChange={v => setCommission(p => ({ ...p, [f.key]: v }))} />
                  <div style={{ marginTop: 6, height: 4, background: "var(--bg)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 99, background: "#7c3aed", width: `${Math.min(100, commission[f.key])}%`, transition: "width 0.3s" }} />
                  </div>
                </div>
              ))}
            </Card>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>Revenue Preview</p>
              {[
                { label: "Sell ₦10,000 product", result: `₦${(10000 * commission.marketplace / 100).toLocaleString()} to Soko`, color: "#7c3aed" },
                { label: "Send 1,000 coin gift", result: `${commission.live_gifts}% platform split`, color: "#ec4899" },
                { label: "Book ₦5,000 service", result: `₦${(5000 * commission.services / 100).toLocaleString()} to Soko`, color: "#3b82f6" },
                { label: "Win ₦50,000 auction", result: `₦${(50000 * commission.auctions / 100).toLocaleString()} to Soko`, color: "#f59e0b" },
                { label: "₦2,000/mo subscription", result: `₦${(2000 * commission.subscriptions / 100).toLocaleString()} to Soko`, color: "#10b981" },
              ].map(r => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "11px 14px", borderRadius: 10, background: "var(--bg)", border: "1px solid var(--border)", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>{r.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: r.color }}>{r.result}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COUNTRIES */}
        {tab === "countries" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Enabled Countries</p>
                  <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{enabledCountries.length} of {COUNTRIES.length} countries active</p>
                </div>
                <SaveBtn configKey="enabled_countries" value={enabledCountries} label="Countries" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                {COUNTRIES.map(c => {
                  const on = enabledCountries.includes(c.code);
                  return (
                    <button key={c.code} onClick={() => toggleCountry(c.code)} style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                      borderRadius: 12, border: `1px solid ${on ? "rgba(124,58,237,0.35)" : "var(--border)"}`,
                      background: on ? "rgba(124,58,237,0.08)" : "var(--bg)",
                      cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                    }}>
                      <span style={{ fontSize: 22 }}>{c.flag}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: on ? "var(--text)" : "var(--muted)" }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>{c.currency}</div>
                      </div>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${on ? "#7c3aed" : "var(--border)"}`, background: on ? "#7c3aed" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {on && <CheckCircle size={10} style={{ color: "#fff" }} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* CURRENCIES */}
        {tab === "currencies" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card title="Base Currency" configKey="base_currency" value={baseCurrency} label="Base Currency">
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Base Currency</label>
                <select value={baseCurrency} onChange={e => setBaseCurrency(e.target.value)} style={{ ...inputSt, height: 44 }}>
                  {["NGN","GHS","KES","ZAR","USD","GBP"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <p style={{ fontSize: 11, color: "rgba(240,242,255,0.2)", marginTop: 4 }}>All prices and payouts are in this currency</p>
              </div>
            </Card>
            <Card title="Exchange Rates (to {baseCurrency})" configKey="exchange_rates" value={exchangeRates} label="Exchange Rates">
              {Object.entries(exchangeRates).map(([cur, rate]) => (
                <div key={cur}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>1 {baseCurrency} = ? {cur}</label>
                  <input type="number" step="0.000001" value={rate}
                    onChange={e => setExchangeRates(p => ({ ...p, [cur]: Number(e.target.value) }))}
                    style={inputSt} />
                </div>
              ))}
            </Card>
          </div>
        )}

        {/* WITHDRAWAL */}
        {tab === "withdrawal" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card title="Withdrawal Limits" configKey="withdrawal_config" value={withdrawal} label="Withdrawal">
              <NumField label="Minimum Withdrawal (₦)" hint="Users can't withdraw below this amount" value={withdrawal.min_ngn} onChange={v => setWithdrawal(p => ({ ...p, min_ngn: v }))} prefix="₦" />
              <NumField label="Maximum Single Withdrawal (₦)" hint="Cap per withdrawal request" value={withdrawal.max_ngn} onChange={v => setWithdrawal(p => ({ ...p, max_ngn: v }))} prefix="₦" />
              <NumField label="Daily Withdrawal Limit (₦)" hint="Total user can withdraw in 24h" value={withdrawal.daily_limit} onChange={v => setWithdrawal(p => ({ ...p, daily_limit: v }))} prefix="₦" />
              <NumField label="Weekly Withdrawal Limit (₦)" hint="Total user can withdraw in 7 days" value={withdrawal.weekly_limit} onChange={v => setWithdrawal(p => ({ ...p, weekly_limit: v }))} prefix="₦" />
            </Card>
            <Card title="Payout Timing" configKey="withdrawal_config" value={withdrawal} label="Timing">
              <NumField label="Pending Period (days)" hint="Days funds are held before available to withdraw" value={withdrawal.pending_days} onChange={v => setWithdrawal(p => ({ ...p, pending_days: v }))} />
              <NumField label="KYC Required Above (₦)" hint="KYC/ID verification required above this earnings" value={withdrawal.kyc_threshold} onChange={v => setWithdrawal(p => ({ ...p, kyc_threshold: v }))} prefix="₦" />
              <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}>
                <p style={{ fontSize: 12, color: "#a78bfa", lineHeight: 1.6 }}>
                  Funds earned are held for {withdrawal.pending_days} days before becoming withdrawable. Users earning above ₦{withdrawal.kyc_threshold.toLocaleString()} must complete KYC before withdrawing.
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {tab === "notifications" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card title="Notification Channels" configKey="notification_config" value={notifications} label="Notification Channels">
              <Toggle label="Push Notifications" hint="Firebase/APNs push to mobile devices" value={notifications.push_enabled} onChange={v => setNotifications(p => ({ ...p, push_enabled: v }))} />
              <Toggle label="Email Notifications" hint="Transactional emails via SMTP/SendGrid" value={notifications.email_enabled} onChange={v => setNotifications(p => ({ ...p, email_enabled: v }))} />
              <Toggle label="SMS Notifications" hint="SMS via Termii or Twilio (costs apply)" value={notifications.sms_enabled} onChange={v => setNotifications(p => ({ ...p, sms_enabled: v }))} />
            </Card>
            <Card title="Notification Types" configKey="notification_config" value={notifications} label="Notification Types">
              <Toggle label="Order Updates" hint="Shipped, delivered, confirmed" value={notifications.order_updates} onChange={v => setNotifications(p => ({ ...p, order_updates: v }))} />
              <Toggle label="Live Alerts" hint="Creator went live, invited to live" value={notifications.live_alerts} onChange={v => setNotifications(p => ({ ...p, live_alerts: v }))} />
              <Toggle label="Promotional Messages" hint="Flash sales, featured drops" value={notifications.promo_messages} onChange={v => setNotifications(p => ({ ...p, promo_messages: v }))} />
              <Toggle label="Payment Alerts" hint="Wallet credits, payouts, purchases" value={notifications.payment_alerts} onChange={v => setNotifications(p => ({ ...p, payment_alerts: v }))} />
              <Toggle label="Security Alerts" hint="Login from new device, password change" value={notifications.security_alerts} onChange={v => setNotifications(p => ({ ...p, security_alerts: v }))} />
            </Card>
          </div>
        )}

        {/* PAYOUT RAILS */}
        {tab === "payouts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)", fontSize: 13, color: "rgba(240,242,255,0.6)", lineHeight: 1.6 }}>
              Configure which payment provider handles withdrawals for each country. Flutterwave covers all African markets. Wise/Stripe handle UK & USA.
            </div>
            {COUNTRIES.map(c => {
              const cfg = countryPayouts[c.code];
              if (!cfg) return null;
              return (
                <div key={c.code} style={{ background: "var(--surface)", border: `1px solid ${cfg.enabled ? "rgba(16,185,129,0.15)" : "var(--border)"}`, borderRadius: 16, padding: "16px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <span style={{ fontSize: 24 }}>{c.flag}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>{c.currency}</div>
                    </div>
                    <div onClick={() => setCountryPayouts(prev => ({ ...prev, [c.code]: { ...prev[c.code], enabled: !prev[c.code].enabled } }))}
                      style={{ width: 40, height: 22, borderRadius: 11, background: cfg.enabled ? "#10b981" : "rgba(255,255,255,0.1)", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                      <div style={{ position: "absolute", top: 3, left: cfg.enabled ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                    </div>
                  </div>
                  {cfg.enabled && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Provider</label>
                        <select value={cfg.provider} onChange={e => setCountryPayouts(prev => ({ ...prev, [c.code]: { ...prev[c.code], provider: e.target.value } }))}
                          style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13 }}>
                          {["Paystack","Flutterwave","Wise","Stripe","Chipper Cash"].map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Min Payout</label>
                        <input type="number" value={cfg.minPayout} onChange={e => setCountryPayouts(prev => ({ ...prev, [c.code]: { ...prev[c.code], minPayout: Number(e.target.value) } }))}
                          style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13 }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Fee (%)</label>
                        <input type="number" step="0.1" value={cfg.fee} onChange={e => setCountryPayouts(prev => ({ ...prev, [c.code]: { ...prev[c.code], fee: Number(e.target.value) } }))}
                          style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13 }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <button onClick={() => { supabase.from("app_config").upsert({ key: "country_payout_rails", value: countryPayouts }); }}
              style={{ padding: "12px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#7c3aed,#ec4899)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Save Payout Configuration
            </button>
          </div>
        )}

        {/* CONTENT */}
        {tab === "content" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card title="Content Policies" configKey="content_config" value={content} label="Content Policies">
              <NumField label="Minimum Age (years)" hint="Users below this age cannot register" value={content.min_age} onChange={v => setContent(p => ({ ...p, min_age: v }))} />
              <NumField label="Max Video Upload (MB)" hint="Maximum file size for video uploads" value={content.max_video_mb} onChange={v => setContent(p => ({ ...p, max_video_mb: v }))} />
              <NumField label="Max Image Upload (MB)" hint="Maximum file size for image uploads" value={content.max_image_mb} onChange={v => setContent(p => ({ ...p, max_image_mb: v }))} />
              <NumField label="Max Caption Length" hint="Max characters in post captions" value={content.max_caption_length} onChange={v => setContent(p => ({ ...p, max_caption_length: v }))} />
              <NumField label="Max Live Duration (hours)" hint="Maximum hours a stream can run before auto-end" value={content.max_live_hours} onChange={v => setContent(p => ({ ...p, max_live_hours: v }))} />
            </Card>
            <Card title="Moderation Automation" configKey="content_config" value={content} label="Moderation">
              <Toggle label="Auto Moderation" hint="AI scans posts and live streams automatically" value={content.auto_moderation} onChange={v => setContent(p => ({ ...p, auto_moderation: v }))} />
              <Toggle label="NSFW Detection" hint="Block explicit images and videos automatically" value={content.nsfw_detection} onChange={v => setContent(p => ({ ...p, nsfw_detection: v }))} />
              <Toggle label="Adult Content" hint="Allow adult (18+) verified content on platform" value={content.adult_content} onChange={v => setContent(p => ({ ...p, adult_content: v }))} />
              <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                <p style={{ fontSize: 12, color: "#fca5a5", lineHeight: 1.6 }}>
                  Disabling auto moderation increases exposure to harmful content. Ensure manual moderation team is active before disabling.
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* LIVE SHOPPING */}
        {tab === "live_shop" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card title="Live Shopping Core" configKey="live_shop_config" value={liveShop} label="Live Shopping">
              <Toggle label="Enable Live Shopping" hint="Allow vendors to sell during any live stream type" value={liveShop.enabled} onChange={v => setLiveShop(p => ({ ...p, enabled: v }))} />
              <Toggle label="Product Card Overlay" hint="Show floating product card on viewer screen" value={liveShop.product_card_enabled} onChange={v => setLiveShop(p => ({ ...p, product_card_enabled: v }))} />
              <Toggle label="Auto Pop-up on Pin" hint="Product card auto-shows when host pins a product" value={liveShop.auto_show_card_on_pin} onChange={v => setLiveShop(p => ({ ...p, auto_show_card_on_pin: v }))} />
              <Toggle label="Auto Pop-up from Questions" hint='Card appears when viewer asks "how much?" or similar' value={liveShop.auto_popup_enabled} onChange={v => setLiveShop(p => ({ ...p, auto_popup_enabled: v }))} />
              <Toggle label="AI Question Detection" hint="Soko AI detects buy-intent keywords in chat" value={liveShop.ai_question_detection} onChange={v => setLiveShop(p => ({ ...p, ai_question_detection: v }))} />
              <Toggle label="Require Seller Approval" hint="Sellers must be approved before live shopping" value={liveShop.require_seller_approval} onChange={v => setLiveShop(p => ({ ...p, require_seller_approval: v }))} />
              <Toggle label="Guest Checkout" hint="Non-registered users can still buy from live" value={liveShop.guest_can_buy} onChange={v => setLiveShop(p => ({ ...p, guest_can_buy: v }))} />
            </Card>
            <Card title="Deals & Commerce Rules" configKey="live_shop_config" value={liveShop} label="Live Shop Rules">
              <NumField label="Live Sales Commission (%)" hint="Soko fee on each order placed inside a live stream" value={liveShop.commission_live_sales} onChange={v => setLiveShop(p => ({ ...p, commission_live_sales: v }))} />
              <NumField label="Max Products Per Live" hint="Maximum number of products a host can list" value={liveShop.max_products_per_live} onChange={v => setLiveShop(p => ({ ...p, max_products_per_live: v }))} />
              <NumField label="Max Flash Deal Discount (%)" hint="Cap on how much sellers can discount in a flash deal" value={liveShop.live_deal_max_discount} onChange={v => setLiveShop(p => ({ ...p, live_deal_max_discount: v }))} />
              <Toggle label="Flash Deals Allowed" hint="Sellers can run time-limited flash discounts during live" value={liveShop.flash_deal_allowed} onChange={v => setLiveShop(p => ({ ...p, flash_deal_allowed: v }))} />
              <Toggle label="Free Gift Promotions" hint="Sellers can offer free gifts with purchases during live" value={liveShop.free_gift_allowed} onChange={v => setLiveShop(p => ({ ...p, free_gift_allowed: v }))} />
              <Toggle label="Service Booking in Live" hint="Service providers can accept bookings inside live" value={liveShop.service_booking_enabled} onChange={v => setLiveShop(p => ({ ...p, service_booking_enabled: v }))} />
              <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
                <p style={{ fontSize: 12, color: "#6ee7b7", lineHeight: 1.6 }}>
                  Live shopping works across all stream types — camera, product, service, voice, and streaming. It only appears if the host has products or services attached to their account.
                </p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
