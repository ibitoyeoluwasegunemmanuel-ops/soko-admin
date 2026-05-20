interface Props { title: string; sub?: string; children?: React.ReactNode; }

export function PageHeader({ title, sub, children }: Props) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "24px 28px 20px",
      borderBottom: "1px solid var(--border)",
    }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.3px", lineHeight: 1.2 }}>
          {title}
        </h1>
        {sub && (
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>{sub}</p>
        )}
      </div>
      {children && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>{children}</div>
      )}
    </div>
  );
}
