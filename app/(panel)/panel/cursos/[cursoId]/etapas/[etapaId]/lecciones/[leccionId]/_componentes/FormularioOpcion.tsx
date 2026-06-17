"use client";

import { useFormState } from "react-dom";
import { Alert } from "@/components/ui/Alert";
import type { EstadoFormulario } from "@/lib/validations/auth";

export function FormularioOpcion({
  accion,
  cursoId,
  etapaId,
  leccionId,
  preguntaId,
}: {
  accion: (prev: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
  cursoId: string;
  etapaId: string;
  leccionId: string;
  preguntaId: string;
}) {
  const [estado, formAction] = useFormState(accion, null);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="curso_id" value={cursoId} />
      <input type="hidden" name="etapa_id" value={etapaId} />
      <input type="hidden" name="leccion_id" value={leccionId} />
      <input type="hidden" name="pregunta_id" value={preguntaId} />

      {estado?.error && <Alert tono="error">{estado.error}</Alert>}

      <div className="flex items-center gap-2">
        <input
          name="texto"
          placeholder="Texto de la opción"
          required
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-marino-700 px-3 py-2 text-sm text-crema focus:border-dorado/60"
        />
        <label className="flex items-center gap-1.5 whitespace-nowrap text-xs text-crema/70">
          <input
            type="checkbox"
            name="es_correcta"
            className="h-4 w-4 rounded border-white/20 bg-marino-700 accent-dorado"
          />
          Correcta
        </label>
        <button
          type="submit"
          className="rounded-lg border border-white/15 px-2.5 py-2 text-xs text-crema/70 hover:bg-white/5 hover:text-crema"
        >
          Agregar
        </button>
      </div>
    </form>
  );
}
