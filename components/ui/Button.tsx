import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variante = "primario" | "secundario" | "fantasma";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
}

const estilos: Record<Variante, string> = {
  primario:
    "bg-dorado text-marino-900 hover:bg-dorado-400 disabled:opacity-50",
  secundario:
    "border border-dorado/60 text-dorado hover:bg-dorado/10 disabled:opacity-50",
  fantasma: "text-crema/80 hover:text-crema hover:bg-white/5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variante = "primario", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed",
        estilos[variante],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
