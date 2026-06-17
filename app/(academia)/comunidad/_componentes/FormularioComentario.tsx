"use client";

import { useFormState } from "react-dom";
import { crearComentario } from "../acciones";
import type { EstadoFormulario } from "@/lib/validations/auth";

export function FormularioComentario({
  publicacionId,
}: {
  publicacionId: string;
}) {
  const [estado, formAction] = useFormState<EstadoFormulario, FormData>(
    crearComentario,
    null
  );

  return (
    <form action={formAction} className="mt-2">
      <input type="hidden" name="publicacion_id" value={publicacionId} />
      {estado?.error && (
        <p className="mb-1 text-xs text-red-300">{estado.error}</p>
      )}
      <div className="flex items-center gap-2">
        <input
          name="contenido"
          placeholder="Escribí un comentario..."
          required
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-marino-700 px-3 py-2 text-sm text-crema focus:border-dorado/60"
        />
        <button
          type="submit"
          className="rounded-lg border border-white/15 px-3 py-2 text-sm text-crema/70 hover:bg-white/5 hover:text-crema"
        >
          Comentar
        </button>
      </div>
    </form>
  );
}
