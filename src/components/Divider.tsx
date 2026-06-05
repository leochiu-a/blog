import { DividerOrnament } from "@/components/icons";

/** Gold gradient lines flanking a small concentric-circle ornament. */
export function Divider({ className = "" }: { className?: string }) {
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
