"use client";

import { useFormState } from "react-dom";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { EstadoFormulario } from "@/lib/validations/auth";

export function FormularioQuiz({
  accion,
  cursoId,
  etapaId,
  leccionId,
}: {
  accion: (prev: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
  cursoId: string;
  etapaId: string;
  leccionId: string;
}) {
  const [estado, formAction] = useFormState(accion, null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="curso_id" value={cursoId} />
      <input type="hidden" name="etapa_id" value={etapaId} />
      <input type="hidden" name="leccion_id" value={leccionId} />

      {estado?.error && <Alert tono="error">{estado.error}</Alert>}
      {estado?.ok && <Alert tono="exito">{estado.ok}</Alert>}

      <Input
        id="titulo-quiz"
        name="titulo"
        etiqueta="Título del quiz"
        placeholder="Autoevaluación de la lección"
        required
      />
      <Input
        id="puntaje_minimo_aprobar"
        name="puntaje_minimo_aprobar"
        type="number"
        min={0}
        max={100}
        etiqueta="Puntaje mínimo para aprobar (%)"
        defaultValue={60}
      />
      <SubmitButton>Crear quiz</SubmitButton>
    </form>
  );
}
