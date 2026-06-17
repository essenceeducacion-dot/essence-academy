"use client";

import { useFormState } from "react-dom";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { EstadoFormulario } from "@/lib/validations/auth";
import { estadosCurso } from "@/lib/validations/cursos";

type Curso = {
  id: string;
  titulo: string;
  slug: string;
  descripcion: string | null;
  es_insignia: boolean;
  estado: string;
  orden: number;
};

const etiquetasEstado: Record<string, string> = {
  borrador: "Borrador",
  publicado: "Publicado",
  archivado: "Archivado",
};

const opcionesEstado = estadosCurso.map((e) => ({
  valor: e,
  etiqueta: etiquetasEstado[e],
}));

export function FormularioCurso({
  accion,
  curso,
  textoEnvio,
}: {
  accion: (prev: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
  curso?: Curso;
  textoEnvio: string;
}) {
  const [estado, formAction] = useFormState(accion, null);

  return (
    <form action={formAction} className="space-y-5">
      {curso && <input type="hidden" name="id" value={curso.id} />}

      {estado?.error && <Alert tono="error">{estado.error}</Alert>}
      {estado?.ok && <Alert tono="exito">{estado.ok}</Alert>}

      <Input
        id="titulo"
        name="titulo"
        etiqueta="Título"
        defaultValue={curso?.titulo}
        placeholder="Programa 0 a 100"
        required
      />

      <Input
        id="slug"
        name="slug"
        etiqueta="Identificador (slug)"
        defaultValue={curso?.slug}
        placeholder="Se genera del título si lo dejás vacío"
      />

      <Textarea
        id="descripcion"
        name="descripcion"
        etiqueta="Descripción"
        rows={4}
        defaultValue={curso?.descripcion ?? ""}
        placeholder="De qué se trata el curso"
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Select
          id="estado"
          name="estado"
          etiqueta="Estado"
          opciones={opcionesEstado}
          defaultValue={curso?.estado ?? "borrador"}
        />
        <Input
          id="orden"
          name="orden"
          type="number"
          min={0}
          etiqueta="Orden"
          defaultValue={curso?.orden ?? 0}
        />
      </div>

      <label className="flex items-center gap-2.5 text-sm text-crema/80">
        <input
          type="checkbox"
          name="es_insignia"
          defaultChecked={curso?.es_insignia ?? false}
          className="h-4 w-4 rounded border-white/20 bg-marino-700 accent-dorado"
        />
        Curso insignia (destacado del catálogo)
      </label>

      <SubmitButton>{textoEnvio}</SubmitButton>
    </form>
  );
}
