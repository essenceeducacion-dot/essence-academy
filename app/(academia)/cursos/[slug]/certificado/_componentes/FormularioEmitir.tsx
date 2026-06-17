"use client";

import { useFormState } from "react-dom";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { emitirCertificado } from "../acciones";
import type { EstadoFormulario } from "@/lib/validations/auth";

export function FormularioEmitir({ slug }: { slug: string }) {
  const [estado, formAction] = useFormState<EstadoFormulario, FormData>(
    emitirCertificado,
    null
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="slug" value={slug} />
      {estado?.error && <Alert tono="error">{estado.error}</Alert>}
      {estado?.ok && <Alert tono="exito">{estado.ok}</Alert>}
      <SubmitButton>Emitir mi certificado</SubmitButton>
    </form>
  );
}
