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
    <div className="relative rounded-2xl p-5 overflow-hidden transition-all duration-200 group hover:translate-y-[-1px]"
      style={{ background: "#111119", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="absolute top-0 right-0 w-28 h-28 rounded-full blur-3xl opacity-[0.08] pointer-events-none transition-opacity group-hover:opacity-[0.14]"
        style={{ background: color }} />

      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}16`, border: `1px solid ${color}25` }}>
          <Icon style={{ width: 18, height: 18, color }} />
        </div>
        {change && (
          <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg ${up ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"}`}>
            {up ? <TrendingUp style={{ width: 11, height: 11 }} /> : <TrendingDown style={{ width: 11, height: 11 }} />}
            {change}
          </span>
        )}
      </div>

      <p className="text-[26px] font-black text-white leading-none tracking-tight mb-1.5">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className="text-[12px] font-medium" style={{ color: "rgba(255,255,255,0.38)" }}>{label}</p>
      {sub && <p className="text-[11px] mt-1 font-medium" style={{ color: `${color}88` }}>{sub}</p>}
    </div>
  );
}
