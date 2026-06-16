import { cn } from "@/lib/utils";

// Wordmark de Essence Academy. Tipografía display + acento dorado.
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("font-display text-xl tracking-tight", className)}>
      <span className="text-crema">Essence</span>{" "}
      <span className="text-dorado">Academy</span>
    </span>
  );
}
