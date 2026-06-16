// Variables de entorno y feature flags, validadas con Zod.
// Falla temprano (al iniciar) si falta algo crítico.
import { z } from "zod";

const flag = z
  .string()
  .optional()
  .transform((v) => v === "true" || v === "1");

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  ENABLE_PAGOS: flag,
  ENABLE_COMUNIDAD: flag,
  ENABLE_CERTIFICADOS: flag,
});

const parsed = schema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  ENABLE_PAGOS: process.env.ENABLE_PAGOS,
  ENABLE_COMUNIDAD: process.env.ENABLE_COMUNIDAD,
  ENABLE_CERTIFICADOS: process.env.ENABLE_CERTIFICADOS,
});

if (!parsed.success) {
  throw new Error(
    "Faltan variables de entorno o son inválidas. Revisá tu .env.local:\n" +
      JSON.stringify(parsed.error.flatten().fieldErrors, null, 2)
  );
}

export const env = parsed.data;

export const flags = {
  pagos: env.ENABLE_PAGOS,
  comunidad: env.ENABLE_COMUNIDAD,
  certificados: env.ENABLE_CERTIFICADOS,
} as const;
