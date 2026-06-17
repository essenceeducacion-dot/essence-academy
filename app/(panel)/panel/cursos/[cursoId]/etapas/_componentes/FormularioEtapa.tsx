"use client";

import { useFormState } from "react-dom";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { EstadoFormulario } from "@/lib/validations/auth";

type Etapa = {
  id: string;
  nombre: string;
  descripcion: string | null;
  orden: number;
};

export function FormularioEtapa({
  accion,
  cursoId,
  etapa,
  mostrarOrden = false,
  textoEnvio,
}: {
  accion: (prev: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
  cursoId: string;
  etapa?: Etapa;
  mostrarOrden?: boolean;
  textoEnvio: string;
}) {
  const [estado, formAction] = useFormState(accion, null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="curso_id" value={cursoId} />
      {etapa && <input type="hidden" name="id" value={etapa.id} />}

      {estado?.error && <Alert tono="error">{estado.error}</Alert>}
      {estado?.ok && <Alert tono="exito">{estado.ok}</Alert>}

      <Input
        id="nombre"
        name="nombre"
        etiqueta="Nombre de la etapa"
        defaultValue={etapa?.nombre}
        placeholder="Origen"
        required
      />

      <Textarea
        id="descripcion"
        name="descripcion"
        etiqueta="Descripción"
        rows={3}
        defaultValue={etapa?.descripcion ?? ""}
        placeholder="Qué se ve en esta etapa"
      />

      {mostrarOrden && (
        <Input
          id="orden"
          name="orden"
          type="number"
          min={0}
          etiqueta="Orden"
          defaultValue={etapa?.orden ?? 0}
        />
      )}

      <SubmitButton>{textoEnvio}</SubmitButton>
    </form>
  );
}
