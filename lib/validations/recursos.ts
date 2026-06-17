import { z } from "zod";

export const tiposRecurso = ["video", "pdf", "imagen", "texto"] as const;
export const fuentesVideo = ["upload", "embed"] as const;
export const proveedoresEmbed = ["youtube", "vimeo"] as const;

export const esquemaRecurso = z
  .object({
    tipo: z.enum(tiposRecurso),
    titulo: z.string().trim().min(2, "El título es muy corto."),
    // Solo aplica a video.
    tipo_fuente: z.enum(fuentesVideo).optional(),
    proveedor_embed: z.enum(proveedoresEmbed).optional(),
    // URL del embed (video) o del archivo externo.
    url: z.string().trim().optional(),
    // HTML/markdown para tipo texto.
    contenido_texto: z.string().trim().optional(),
  })
  .superRefine((datos, ctx) => {
    if (datos.tipo === "video") {
      if (!datos.tipo_fuente) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tipo_fuente"],
          message: "Indicá si el video es subido o embebido.",
        });
      }
      if (datos.tipo_fuente === "embed") {
        if (!datos.proveedor_embed) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["proveedor_embed"],
            message: "Elegí el proveedor del video.",
          });
        }
        if (!datos.url) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["url"],
            message: "Pegá la URL del video.",
          });
        }
      }
    }
    if (datos.tipo === "texto" && !datos.contenido_texto) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["contenido_texto"],
        message: "Escribí el contenido del texto.",
      });
    }
  });

export type DatosRecurso = z.infer<typeof esquemaRecurso>;
