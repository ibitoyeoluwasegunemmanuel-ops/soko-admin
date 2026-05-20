interface Props { title: string; sub?: string; children?: React.ReactNode; }
export function PageHeader({ title, sub, children }: Props) {
  return (
    <div className="flex items-center justify-between px-6 py-5 border-b border-[#1e1e2e]">
      <div>
        <h1 className="text-[18px] font-black text-white">{title}</h1>
        {sub && <p className="text-[12px] text-white/40 mt-0.5">{sub}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
