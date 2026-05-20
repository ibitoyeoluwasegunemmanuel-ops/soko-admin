import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

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
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 16, padding: "20px 22px",
      position: "relative", overflow: "hidden",
      transition: "transform 0.15s, box-shadow 0.15s",
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 32px rgba(0,0,0,0.3)`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = "none";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* Background glow */}
      <div style={{
        position: "absolute", top: -20, right: -20,
        width: 100, height: 100, borderRadius: "50%",
        background: color, opacity: 0.07, filter: "blur(30px)",
        pointerEvents: "none",
      }} />

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: `${color}18`, border: `1px solid ${color}28`,
        }}>
          <Icon size={19} style={{ color }} />
        </div>

        {change && (
          <div style={{
            display: "flex", alignItems: "center", gap: 4,
            fontSize: 11, fontWeight: 600, padding: "4px 8px", borderRadius: 8,
            color: up ? "#10b981" : "#ef4444",
            background: up ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
          }}>
            {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {change}
          </div>
        )}
      </div>

      {/* Value */}
      <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.5px", lineHeight: 1, marginBottom: 6 }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>

      {/* Label */}
      <div style={{ fontSize: 12, fontWeight: 500, color: "var(--muted)" }}>{label}</div>

      {/* Sub */}
      {sub && (
        <div style={{ fontSize: 11, fontWeight: 500, color, marginTop: 4, opacity: 0.7 }}>{sub}</div>
      )}
    </div>
  );
}
