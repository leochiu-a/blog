import { DividerOrnament } from "@/components/icons";

/**
 * Gold gradient lines flanking a small concentric-circle ornament.
 * `variant="minimal"` swaps that for a plain neutral rule, used on the blog
 * reading view where the warm portfolio palette doesn't apply.
 */
export function Divider({
  className = "",
  variant = "brand",
}: {
  className?: string;
  variant?: "brand" | "minimal";
}) {
  if (variant === "minimal") {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="h-px w-24 bg-border" />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex items-center gap-4">
        <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold" />
        <DividerOrnament className="text-gold" />
        <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold" />
      </div>
    </div>
  );
}
