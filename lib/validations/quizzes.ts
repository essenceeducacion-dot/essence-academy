import { z } from "zod";

export const tiposPregunta = [
  "opcion_unica",
  "opcion_multiple",
  "verdadero_falso",
] as const;

export const etiquetasTipoPregunta: Record<
  (typeof tiposPregunta)[number],
  string
> = {
  opcion_unica: "Opción única",
  opcion_multiple: "Opción múltiple",
  verdadero_falso: "Verdadero / Falso",
};

export const esquemaQuiz = z.object({
  titulo: z.string().trim().min(2, "El título es muy corto."),
  puntaje_minimo_aprobar: z.coerce
    .number()
    .int()
    .min(0, "Mínimo 0.")
    .max(100, "Máximo 100.")
    .default(60),
});

export const esquemaPregunta = z.object({
  enunciado: z.string().trim().min(2, "El enunciado es muy corto."),
  tipo: z.enum(tiposPregunta),
});

export const esquemaOpcion = z.object({
  texto: z.string().trim().min(1, "Escribí el texto de la opción."),
  es_correcta: z.boolean().default(false),
});

export type DatosQuiz = z.infer<typeof esquemaQuiz>;
export type DatosPregunta = z.infer<typeof esquemaPregunta>;
export type DatosOpcion = z.infer<typeof esquemaOpcion>;
