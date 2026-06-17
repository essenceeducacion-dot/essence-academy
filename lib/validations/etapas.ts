import { z } from "zod";

export const esquemaEtapa = z.object({
  nombre: z.string().trim().min(2, "El nombre es muy corto."),
  descripcion: z.string().trim().max(2000, "La descripción es muy larga.").optional(),
  orden: z.coerce.number().int().min(0, "El orden no puede ser negativo.").default(0),
});

export type DatosEtapa = z.infer<typeof esquemaEtapa>;
