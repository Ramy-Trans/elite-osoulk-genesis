export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={`max-w-2xl ${align === "center" ? "mx-auto text-center" : ""}`}>
      {eyebrow && (
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--gold)] font-medium">{eyebrow}</p>
      )}
      <h2 className="mt-3 font-display text-4xl md:text-5xl text-balance leading-[1.05]">{title}</h2>
      {align === "center" && <div className="gold-divider mx-auto mt-5" />}
      {description && (
        <p className="mt-5 text-base text-muted-foreground text-pretty">{description}</p>
      )}
    </div>
  );
}
