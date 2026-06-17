import { z } from "zod";

export const esquemaModulo = z.object({
  titulo: z.string().trim().min(2, "El título del módulo es muy corto."),
  orden: z.coerce.number().int().min(0).default(0),
});

export const esquemaLeccion = z.object({
  titulo: z.string().trim().min(2, "El título es muy corto."),
  descripcion: z.string().trim().max(2000, "La descripción es muy larga.").optional(),
  // "" significa sin módulo; lo convertimos a null en la acción.
  modulo_id: z.string().trim().optional(),
  publicada: z.boolean().default(false),
  orden: z.coerce.number().int().min(0).default(0),
});

export type DatosModulo = z.infer<typeof esquemaModulo>;
export type DatosLeccion = z.infer<typeof esquemaLeccion>;
