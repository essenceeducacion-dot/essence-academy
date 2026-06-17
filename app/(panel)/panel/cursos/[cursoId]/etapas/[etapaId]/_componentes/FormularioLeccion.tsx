"use client";

import { useFormState } from "react-dom";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { EstadoFormulario } from "@/lib/validations/auth";

type Leccion = {
  id: string;
  titulo: string;
  descripcion: string | null;
  modulo_id: string | null;
  publicada: boolean;
  orden: number;
};

export function FormularioLeccion({
  accion,
  cursoId,
  etapaId,
  modulos,
  leccion,
  mostrarOrden = false,
  textoEnvio,
}: {
  accion: (prev: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
  cursoId: string;
  etapaId: string;
  modulos: { id: string; titulo: string }[];
  leccion?: Leccion;
  mostrarOrden?: boolean;
  textoEnvio: string;
}) {
  const [estado, formAction] = useFormState(accion, null);

  const opcionesModulo = [
    { valor: "", etiqueta: "Sin módulo" },
    ...modulos.map((m) => ({ valor: m.id, etiqueta: m.titulo })),
  ];

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="curso_id" value={cursoId} />
      <input type="hidden" name="etapa_id" value={etapaId} />
      {leccion && <input type="hidden" name="id" value={leccion.id} />}

      {estado?.error && <Alert tono="error">{estado.error}</Alert>}
      {estado?.ok && <Alert tono="exito">{estado.ok}</Alert>}

      <Input
        id="titulo"
        name="titulo"
        etiqueta="Título de la lección"
        defaultValue={leccion?.titulo}
        placeholder="Introducción al corte"
        required
      />

      <Textarea
        id="descripcion"
        name="descripcion"
        etiqueta="Descripción"
        rows={3}
        defaultValue={leccion?.descripcion ?? ""}
        placeholder="Resumen breve de la lección"
      />

      {modulos.length > 0 && (
        <Select
          id="modulo_id"
          name="modulo_id"
          etiqueta="Módulo (opcional)"
          opciones={opcionesModulo}
          defaultValue={leccion?.modulo_id ?? ""}
        />
      )}

      {mostrarOrden && (
        <Input
          id="orden"
          name="orden"
          type="number"
          min={0}
          etiqueta="Orden"
          defaultValue={leccion?.orden ?? 0}
        />
      )}

      <label className="flex items-center gap-2.5 text-sm text-crema/80">
        <input
          type="checkbox"
          name="publicada"
          defaultChecked={leccion?.publicada ?? false}
          className="h-4 w-4 rounded border-white/20 bg-marino-700 accent-dorado"
        />
        Publicada (visible para alumnos inscriptos)
      </label>

      <SubmitButton>{textoEnvio}</SubmitButton>
    </form>
  );
}
