interface CalloutProps {
  children: React.ReactNode;
}

export function Callout({ children }: CalloutProps) {
  return (
    <div className="my-4 rounded-sm border-l-2 border-gold/40 bg-muted/30 px-4 py-3 text-sm not-prose">
      {children}
    </div>
  );
}
