import { z } from "zod";

export const estadosCurso = ["borrador", "publicado", "archivado"] as const;
export type EstadoCurso = (typeof estadosCurso)[number];

export const esquemaCurso = z.object({
  titulo: z.string().trim().min(2, "El título es muy corto."),
  // Si viene vacío lo derivamos del título en el server action.
  slug: z.string().trim().optional(),
  descripcion: z.string().trim().max(2000, "La descripción es muy larga.").optional(),
  es_insignia: z.boolean().default(false),
  estado: z.enum(estadosCurso).default("borrador"),
  orden: z.coerce.number().int().min(0, "El orden no puede ser negativo.").default(0),
});

export type DatosCurso = z.infer<typeof esquemaCurso>;
