import { cn } from "@/lib/utils";
import { inlineContent } from "./inline-content";

interface CalloutProps {
  children: React.ReactNode;
}

export function Callout({ children }: CalloutProps) {
  return (
    <div
      className={cn(
        "my-4 rounded-sm border-l-2 border-blog-accent/50 bg-muted/30 px-4 py-3 text-sm not-prose",
        inlineContent,
      )}
    >
      {children}
    </div>
  );
}
