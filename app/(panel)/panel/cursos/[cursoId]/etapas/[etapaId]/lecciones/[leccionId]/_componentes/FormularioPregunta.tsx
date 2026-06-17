"use client";

import { useFormState } from "react-dom";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { tiposPregunta, etiquetasTipoPregunta } from "@/lib/validations/quizzes";
import type { EstadoFormulario } from "@/lib/validations/auth";

export function FormularioPregunta({
  accion,
  cursoId,
  etapaId,
  leccionId,
  quizId,
}: {
  accion: (prev: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
  cursoId: string;
  etapaId: string;
  leccionId: string;
  quizId: string;
}) {
  const [estado, formAction] = useFormState(accion, null);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="curso_id" value={cursoId} />
      <input type="hidden" name="etapa_id" value={etapaId} />
      <input type="hidden" name="leccion_id" value={leccionId} />
      <input type="hidden" name="quiz_id" value={quizId} />

      {estado?.error && <Alert tono="error">{estado.error}</Alert>}
      {estado?.ok && <Alert tono="exito">{estado.ok}</Alert>}

      <Input
        id="enunciado"
        name="enunciado"
        etiqueta="Nueva pregunta"
        placeholder="¿Cuál es...?"
        required
      />
      <Select
        id="tipo-pregunta"
        name="tipo"
        etiqueta="Tipo"
        opciones={tiposPregunta.map((t) => ({
          valor: t,
          etiqueta: etiquetasTipoPregunta[t],
        }))}
      />
      <SubmitButton>Agregar pregunta</SubmitButton>
    </form>
  );
}
