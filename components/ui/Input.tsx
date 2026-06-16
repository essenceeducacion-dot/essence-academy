import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  etiqueta?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, etiqueta, id, ...props }, ref) => (
    <div className="space-y-1.5">
      {etiqueta && (
        <label htmlFor={id} className="block text-sm text-crema/80">
          {etiqueta}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          "w-full rounded-lg border border-white/10 bg-marino-700 px-3.5 py-2.5 text-sm text-crema placeholder:text-crema/40",
          "focus:border-dorado/60",
          className
        )}
        {...props}
      />
    </div>
  )
);
Input.displayName = "Input";
