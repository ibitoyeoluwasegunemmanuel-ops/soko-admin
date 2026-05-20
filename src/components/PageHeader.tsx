interface Props { title: string; sub?: string; children?: React.ReactNode; }
export function PageHeader({ title, sub, children }: Props) {
  return (
    <div className="flex items-center justify-between px-7 py-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div>
        <h1 className="text-[20px] font-bold text-white tracking-[-0.3px]">{title}</h1>
        {sub && <p className="text-[13px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{sub}</p>}
      </div>
      {children && <div className="flex items-center gap-2.5">{children}</div>}
    </div>
  );
}
