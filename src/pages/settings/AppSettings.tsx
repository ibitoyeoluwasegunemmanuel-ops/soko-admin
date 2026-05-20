import { useState } from "react";
import { PageHeader } from "../../components/PageHeader";
import { Save, Settings } from "lucide-react";

interface Toast { id: string; msg: string; }

interface CommissionConfig {
  marketplace_pct: string;
  gift_platform_split: string;
  live_earning_split: string;
}

interface WithdrawalConfig {
  min_amount: string;
  pending_period_days: string;
}

interface PlatformRules {
  max_live_duration_hours: string;
  max_products_per_seller: string;
  max_auction_days: string;
  kyc_threshold_naira: string;
}

export function AppSettings() {
  const [commission, setCommission] = useState<CommissionConfig>({
    marketplace_pct:    "10",
    gift_platform_split:"30",
    live_earning_split: "20",
  });

  const [withdrawal, setWithdrawal] = useState<WithdrawalConfig>({
    min_amount:          "1000",
    pending_period_days: "3",
  });

  const [rules, setRules] = useState<PlatformRules>({
    max_live_duration_hours: "8",
    max_products_per_seller: "200",
    max_auction_days:        "7",
    kyc_threshold_naira:     "50000",
  });

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [saving, setSaving] = useState(false);

  function addToast(msg: string) {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, msg }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }

  async function save(section: string) {
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    setSaving(false);
    addToast(`${section} saved successfully`);
  }

  return (
    <div>
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className="px-4 py-3 rounded-xl border bg-emerald-900/80 border-emerald-500/30 text-emerald-300 text-[12px] font-semibold shadow-2xl">
            {t.msg}
          </div>
        ))}
      </div>

      <PageHeader title="App Settings" sub="Platform configuration & rules">
        <div className="flex items-center gap-1.5 text-[11px] text-white/30">
          <Settings className="w-3.5 h-3.5" />
          Super Admin only
        </div>
      </PageHeader>

      <div className="p-6 space-y-6 max-w-3xl">
        {/* Commission Rates */}
        <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[14px] font-black text-white">Commission Rates</p>
              <p className="text-[12px] text-white/30 mt-0.5">Platform revenue share settings</p>
            </div>
            <button
              onClick={() => save("Commission rates")}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold bg-[#7c3aed] text-white hover:bg-purple-600 transition-all disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5" />
              Save
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-black text-white/40 uppercase tracking-wider mb-1.5">
                Marketplace Commission (%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0} max={100}
                  value={commission.marketplace_pct}
                  onChange={e => setCommission(p => ({ ...p, marketplace_pct: e.target.value }))}
                  className="w-28 bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg px-3 py-2 text-[14px] font-black text-white focus:outline-none focus:border-purple-500/50 text-center"
                />
                <div className="flex-1 h-2 bg-[#1e1e2e] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#7c3aed] rounded-full transition-all"
                    style={{ width: `${Math.min(100, Number(commission.marketplace_pct))}%` }}
                  />
                </div>
                <span className="text-[13px] font-black text-white/60">{commission.marketplace_pct}%</span>
              </div>
              <p className="text-[11px] text-white/25 mt-1">Soko takes this % from every product sale</p>
            </div>

            <div>
              <label className="block text-[11px] font-black text-white/40 uppercase tracking-wider mb-1.5">
                Gift Platform Split (%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0} max={100}
                  value={commission.gift_platform_split}
                  onChange={e => setCommission(p => ({ ...p, gift_platform_split: e.target.value }))}
                  className="w-28 bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg px-3 py-2 text-[14px] font-black text-white focus:outline-none focus:border-purple-500/50 text-center"
                />
                <div className="flex-1 h-2 bg-[#1e1e2e] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-pink-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, Number(commission.gift_platform_split))}%` }}
                  />
                </div>
                <span className="text-[13px] font-black text-white/60">{commission.gift_platform_split}%</span>
              </div>
              <p className="text-[11px] text-white/25 mt-1">Soko retains this % of all gifts sent</p>
            </div>

            <div>
              <label className="block text-[11px] font-black text-white/40 uppercase tracking-wider mb-1.5">
                Live Earning Split (%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0} max={100}
                  value={commission.live_earning_split}
                  onChange={e => setCommission(p => ({ ...p, live_earning_split: e.target.value }))}
                  className="w-28 bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg px-3 py-2 text-[14px] font-black text-white focus:outline-none focus:border-purple-500/50 text-center"
                />
                <div className="flex-1 h-2 bg-[#1e1e2e] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, Number(commission.live_earning_split))}%` }}
                  />
                </div>
                <span className="text-[13px] font-black text-white/60">{commission.live_earning_split}%</span>
              </div>
              <p className="text-[11px] text-white/25 mt-1">Soko takes this % of live stream earnings</p>
            </div>
          </div>
        </div>

        {/* Withdrawal Limits */}
        <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[14px] font-black text-white">Withdrawal Limits</p>
              <p className="text-[12px] text-white/30 mt-0.5">Payout restrictions & holding periods</p>
            </div>
            <button
              onClick={() => save("Withdrawal limits")}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold bg-[#7c3aed] text-white hover:bg-purple-600 transition-all disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5" />
              Save
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black text-white/40 uppercase tracking-wider mb-1.5">
                Minimum Withdrawal (₦)
              </label>
              <input
                type="number"
                min={0}
                value={withdrawal.min_amount}
                onChange={e => setWithdrawal(p => ({ ...p, min_amount: e.target.value }))}
                className="w-full bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg px-3 py-2.5 text-[14px] font-black text-white focus:outline-none focus:border-purple-500/50"
              />
              <p className="text-[11px] text-white/25 mt-1">Minimum amount users can withdraw</p>
            </div>
            <div>
              <label className="block text-[11px] font-black text-white/40 uppercase tracking-wider mb-1.5">
                Pending Period (days)
              </label>
              <input
                type="number"
                min={0}
                value={withdrawal.pending_period_days}
                onChange={e => setWithdrawal(p => ({ ...p, pending_period_days: e.target.value }))}
                className="w-full bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg px-3 py-2.5 text-[14px] font-black text-white focus:outline-none focus:border-purple-500/50"
              />
              <p className="text-[11px] text-white/25 mt-1">Days funds are held before withdrawal</p>
            </div>
          </div>
        </div>

        {/* Platform Rules */}
        <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[14px] font-black text-white">Platform Rules</p>
              <p className="text-[12px] text-white/30 mt-0.5">Operational limits & thresholds</p>
            </div>
            <button
              onClick={() => save("Platform rules")}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold bg-[#7c3aed] text-white hover:bg-purple-600 transition-all disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5" />
              Save
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { key: "max_live_duration_hours", label: "Max Live Duration (hours)", hint: "Maximum hours a single live stream can run" },
              { key: "max_products_per_seller", label: "Max Products Per Seller",   hint: "Product listing limit per vendor account" },
              { key: "max_auction_days",         label: "Max Auction Duration (days)", hint: "Maximum days an auction can run" },
              { key: "kyc_threshold_naira",      label: "KYC Required Threshold (₦)", hint: "Require KYC above this earnings amount" },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-[11px] font-black text-white/40 uppercase tracking-wider mb-1.5">
                  {field.label}
                </label>
                <input
                  type="number"
                  min={0}
                  value={(rules as any)[field.key]}
                  onChange={e => setRules(p => ({ ...p, [field.key]: e.target.value }))}
                  className="w-full bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg px-3 py-2.5 text-[14px] font-black text-white focus:outline-none focus:border-purple-500/50"
                />
                <p className="text-[11px] text-white/25 mt-1">{field.hint}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
