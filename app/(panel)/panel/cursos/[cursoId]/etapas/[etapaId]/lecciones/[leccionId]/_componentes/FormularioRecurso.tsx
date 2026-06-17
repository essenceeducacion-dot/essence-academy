"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { EstadoFormulario } from "@/lib/validations/auth";

type Tipo = "video" | "pdf" | "imagen" | "texto";
type Fuente = "upload" | "embed";

export function FormularioRecurso({
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
  const [tipo, setTipo] = useState<Tipo>("video");
  const [fuente, setFuente] = useState<Fuente>("embed");

  const aceptaArchivo =
    tipo === "pdf"
      ? "application/pdf"
      : tipo === "imagen"
      ? "image/*"
      : "video/*";

  const esSubida =
    tipo === "pdf" || tipo === "imagen" || (tipo === "video" && fuente === "upload");

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="curso_id" value={cursoId} />
      <input type="hidden" name="etapa_id" value={etapaId} />
      <input type="hidden" name="leccion_id" value={leccionId} />

      {estado?.error && <Alert tono="error">{estado.error}</Alert>}
      {estado?.ok && <Alert tono="exito">{estado.ok}</Alert>}

      <Select
        id="tipo"
        name="tipo"
        etiqueta="Tipo de recurso"
        value={tipo}
        onChange={(e) => setTipo(e.target.value as Tipo)}
        opciones={[
          { valor: "video", etiqueta: "Video" },
          { valor: "pdf", etiqueta: "PDF" },
          { valor: "imagen", etiqueta: "Imagen" },
          { valor: "texto", etiqueta: "Texto" },
        ]}
      />

      <Input
        id="titulo-recurso"
        name="titulo"
        etiqueta="Título"
        placeholder="Video de bienvenida"
        required
      />

      {tipo === "video" && (
        <Select
          id="tipo_fuente"
          name="tipo_fuente"
          etiqueta="Origen del video"
          value={fuente}
          onChange={(e) => setFuente(e.target.value as Fuente)}
          opciones={[
            { valor: "embed", etiqueta: "Embebido (YouTube/Vimeo)" },
            { valor: "upload", etiqueta: "Subir archivo" },
          ]}
        />
      )}

      {tipo === "video" && fuente === "embed" && (
        <>
          <Select
            id="proveedor_embed"
            name="proveedor_embed"
            etiqueta="Proveedor"
            opciones={[
              { valor: "youtube", etiqueta: "YouTube" },
              { valor: "vimeo", etiqueta: "Vimeo" },
            ]}
          />
          <Input
            id="url"
            name="url"
            etiqueta="URL del video"
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </>
      )}

      {esSubida && (
        <div>
          <label
            htmlFor="archivo"
            className="mb-1.5 block text-sm text-crema/80"
          >
            Archivo
          </label>
          <input
            id="archivo"
            name="archivo"
            type="file"
            accept={aceptaArchivo}
            className="block w-full text-sm text-crema/70 file:mr-3 file:rounded-lg file:border-0 file:bg-dorado/90 file:px-3 file:py-2 file:text-sm file:text-marino-900 hover:file:bg-dorado"
          />
          <p className="mt-1 text-xs text-crema/40">Hasta 200 MB.</p>
        </div>
      )}

      {tipo === "texto" && (
        <Textarea
          id="contenido_texto"
          name="contenido_texto"
          etiqueta="Contenido"
          rows={5}
          placeholder="Texto, instrucciones o material de lectura."
        />
      )}

      <SubmitButton>Agregar recurso</SubmitButton>
    </form>
  );
}
