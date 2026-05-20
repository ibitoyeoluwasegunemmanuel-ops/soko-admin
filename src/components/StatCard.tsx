import { type LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  label: string;
  value: string | number;
  change?: string;
  up?: boolean;
  icon: LucideIcon;
  color?: string;
  sub?: string;
}

export function StatCard({ label, value, change, up, icon: Icon, color = "#7c3aed", sub }: Props) {
  return (
    <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl p-4 hover:border-[#2a2a3e] transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-[11px] font-bold ${up ? "text-emerald-400" : "text-red-400"}`}>
            {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {change}
          </div>
        )}
      </div>
      <p className="text-[22px] font-black text-white leading-none mb-0.5">{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p className="text-[11px] text-white/40 font-medium">{label}</p>
      {sub && <p className="text-[10px] text-white/20 mt-0.5">{sub}</p>}
    </div>
  );
}
