import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tono = "error" | "exito" | "info";

const estilos: Record<Tono, string> = {
  error: "border-red-400/30 bg-red-500/10 text-red-200",
  exito: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  info: "border-dorado/30 bg-dorado/10 text-dorado-300",
};

export function Alert({ tono = "info", children }: { tono?: Tono; children: ReactNode }) {
  return (
    <div
      role={tono === "error" ? "alert" : "status"}
      className={cn("rounded-lg border px-3.5 py-2.5 text-sm", estilos[tono])}
    >
      {children}
    </div>
  );
}
