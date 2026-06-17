"use client";

import { useFormState } from "react-dom";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { crearPublicacion } from "../acciones";
import type { EstadoFormulario } from "@/lib/validations/auth";

export function FormularioPublicacion() {
  const [estado, formAction] = useFormState<EstadoFormulario, FormData>(
    crearPublicacion,
    null
  );

  return (
    <form action={formAction} className="space-y-3">
      {estado?.error && <Alert tono="error">{estado.error}</Alert>}
      {estado?.ok && <Alert tono="exito">{estado.ok}</Alert>}

      <Textarea
        id="contenido"
        name="contenido"
        etiqueta="Compartí algo con la comunidad"
        rows={3}
        placeholder="Una duda, un logro, una foto de tu trabajo..."
        required
      />
      <SubmitButton>Publicar</SubmitButton>
    </form>
  );
}
