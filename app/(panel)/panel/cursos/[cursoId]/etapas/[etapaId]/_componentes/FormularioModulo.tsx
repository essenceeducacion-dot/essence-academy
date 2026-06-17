"use client";

import { useFormState } from "react-dom";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { EstadoFormulario } from "@/lib/validations/auth";

export function FormularioModulo({
  accion,
  cursoId,
  etapaId,
}: {
  accion: (prev: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
  cursoId: string;
  etapaId: string;
}) {
  const [estado, formAction] = useFormState(accion, null);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="curso_id" value={cursoId} />
      <input type="hidden" name="etapa_id" value={etapaId} />

      {estado?.error && <Alert tono="error">{estado.error}</Alert>}
      {estado?.ok && <Alert tono="exito">{estado.ok}</Alert>}

      <Input
        id="titulo-modulo"
        name="titulo"
        etiqueta="Nuevo módulo"
        placeholder="Fundamentos"
        required
      />
      <SubmitButton>Agregar módulo</SubmitButton>
    </form>
  );
}
