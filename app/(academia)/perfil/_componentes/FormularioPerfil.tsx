"use client";

import { useFormState } from "react-dom";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { actualizarPerfil } from "../acciones";
import type { EstadoFormulario } from "@/lib/validations/auth";

export function FormularioPerfil({ nombreActual }: { nombreActual: string }) {
  const [estado, formAction] = useFormState<EstadoFormulario, FormData>(
    actualizarPerfil,
    null
  );

  return (
    <form action={formAction} className="space-y-4">
      {estado?.error && <Alert tono="error">{estado.error}</Alert>}
      {estado?.ok && <Alert tono="exito">{estado.ok}</Alert>}
      <Input
        id="nombre"
        name="nombre"
        etiqueta="Nombre"
        defaultValue={nombreActual}
        required
        maxLength={60}
      />
      <SubmitButton>Guardar cambios</SubmitButton>
    </form>
  );
}
