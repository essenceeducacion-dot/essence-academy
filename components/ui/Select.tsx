import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  etiqueta?: string;
  opciones: { valor: string; etiqueta: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, etiqueta, id, opciones, ...props }, ref) => (
    <div className="space-y-1.5">
      {etiqueta && (
        <label htmlFor={id} className="block text-sm text-crema/80">
          {etiqueta}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        className={cn(
          "w-full rounded-lg border border-white/10 bg-marino-700 px-3.5 py-2.5 text-sm text-crema",
          "focus:border-dorado/60",
          className
        )}
        {...props}
      >
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor} className="bg-marino-700 text-crema">
            {o.etiqueta}
          </option>
        ))}
      </select>
    </div>
  )
);
Select.displayName = "Select";
