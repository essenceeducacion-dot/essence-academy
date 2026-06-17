"use client";

import { useFormState } from "react-dom";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { crearCodigo } from "../acciones";
import type { EstadoFormulario } from "@/lib/validations/auth";

const rolesOpciones = [
  { valor: "alumno", etiqueta: "Alumno" },
  { valor: "educador", etiqueta: "Educador" },
];

export function FormularioCodigo({
  cursos,
}: {
  cursos: { id: string; titulo: string }[];
}) {
  const [estado, formAction] = useFormState<EstadoFormulario, FormData>(
    crearCodigo,
    null
  );

  const cursosOpciones = [
    { valor: "", etiqueta: "Sin curso (solo rol)" },
    ...cursos.map((c) => ({ valor: c.id, etiqueta: c.titulo })),
  ];

  return (
    <form action={formAction} className="space-y-4">
      {estado?.error && <Alert tono="error">{estado.error}</Alert>}
      {estado?.ok && <Alert tono="exito">{estado.ok}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="codigo"
          name="codigo"
          etiqueta="Código"
          placeholder="ESSENCE-2026"
          required
        />
        <Select
          id="rol_destino"
          name="rol_destino"
          etiqueta="Rol que otorga"
          opciones={rolesOpciones}
        />
        <Select
          id="curso_id"
          name="curso_id"
          etiqueta="Inscribir al curso (opcional)"
          opciones={cursosOpciones}
        />
        <Input
          id="usos_maximos"
          name="usos_maximos"
          etiqueta="Usos máximos (opcional)"
          type="number"
          min={1}
          placeholder="Sin límite"
        />
        <Input
          id="expira_en"
          name="expira_en"
          etiqueta="Expira el (opcional)"
          type="date"
        />
      </div>

      <SubmitButton>Crear código</SubmitButton>
    </form>
  );
}
