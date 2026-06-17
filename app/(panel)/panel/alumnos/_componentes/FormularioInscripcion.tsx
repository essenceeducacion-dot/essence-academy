"use client";

import { useFormState } from "react-dom";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { EstadoFormulario } from "@/lib/validations/auth";

export function FormularioInscripcion({
  accion,
  alumnos,
  cursos,
}: {
  accion: (prev: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
  alumnos: { id: string; etiqueta: string }[];
  cursos: { id: string; titulo: string }[];
}) {
  const [estado, formAction] = useFormState(accion, null);

  return (
    <form action={formAction} className="space-y-4">
      {estado?.error && <Alert tono="error">{estado.error}</Alert>}
      {estado?.ok && <Alert tono="exito">{estado.ok}</Alert>}

      <Select
        id="alumno_id"
        name="alumno_id"
        etiqueta="Alumno"
        opciones={[
          { valor: "", etiqueta: "Elegí un alumno" },
          ...alumnos.map((a) => ({ valor: a.id, etiqueta: a.etiqueta })),
        ]}
      />
      <Select
        id="curso_id"
        name="curso_id"
        etiqueta="Curso"
        opciones={[
          { valor: "", etiqueta: "Elegí un curso" },
          ...cursos.map((c) => ({ valor: c.id, etiqueta: c.titulo })),
        ]}
      />
      <SubmitButton>Inscribir</SubmitButton>
    </form>
  );
}
