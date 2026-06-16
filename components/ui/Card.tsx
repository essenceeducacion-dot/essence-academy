import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-marino-700/60 p-6 shadow-xl shadow-black/20",
        className
      )}
      {...props}
    />
  );
}
