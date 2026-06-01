interface PagePlaceholderProps {
  title: string;
  description?: string;
  phase?: string;
}

export function PagePlaceholder({
  title,
  description,
  phase,
}: PagePlaceholderProps) {
  return (
    <div className="mx-auto max-w-3xl p-6 md:p-10">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      )}
      <div className="mt-8 rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        <p>This screen is scaffolded and ready to build.</p>
        {phase && <p className="mt-1 text-xs">Planned in {phase}.</p>}
      </div>
    </div>
  );
}
