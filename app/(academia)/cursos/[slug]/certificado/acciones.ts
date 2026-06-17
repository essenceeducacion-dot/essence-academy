"use server";

import { revalidatePath } from "next/cache";
import { createClienteServidor } from "@/lib/supabase/server";
import { createClienteAdmin } from "@/lib/supabase/admin";
import { requerirSesion } from "@/lib/auth/guards";
import { flags } from "@/lib/env";
import { generarCodigoVerificacion } from "@/lib/utils";
import type { EstadoFormulario } from "@/lib/validations/auth";

// Emite el certificado del curso para el alumno actual.
// La inserción va por el cliente admin: la RLS solo deja escribir certificados a
// staff, pero acá el servidor valida que el curso esté 100% completo antes de
// emitir, así que es seguro. Idempotente: si ya existe, no duplica.
export async function emitirCertificado(
  _prev: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  if (!flags.certificados) return { error: "Los certificados no están habilitados." };
  const perfil = await requerirSesion();

  const slug = String(formData.get("slug") ?? "");
  if (!slug) return { error: "Falta el curso." };

  const supabase = createClienteServidor();
  const { data: curso } = await supabase
    .from("cursos")
    .select("id, slug")
    .eq("slug", slug)
    .maybeSingle();
  if (!curso) return { error: "No encontramos el curso." };

  // Acceso: inscripción activa.
  const { data: inscripcion } = await supabase
    .from("inscripciones")
    .select("id")
    .eq("alumno_id", perfil.id)
    .eq("curso_id", curso.id)
    .eq("estado", "activa")
    .maybeSingle();
  if (!inscripcion) return { error: "No tenés acceso a este curso." };

  // ¿Ya tiene certificado? (la RLS le deja leer el suyo)
  const { data: existente } = await supabase
    .from("certificados")
    .select("id")
    .eq("alumno_id", perfil.id)
    .eq("curso_id", curso.id)
    .maybeSingle();
  if (existente) {
    revalidatePath(`/cursos/${slug}/certificado`);
    return { ok: "Ya tenías tu certificado." };
  }

  // Validar 100% de lecciones publicadas completadas.
  const { data: etapas } = await supabase
    .from("etapas")
    .select("id")
    .eq("curso_id", curso.id);
  const etapaIds = (etapas ?? []).map((e) => e.id);
  if (etapaIds.length === 0) return { error: "El curso todavía no tiene contenido." };

  const { data: lecciones } = await supabase
    .from("lecciones")
    .select("id")
    .in("etapa_id", etapaIds)
    .eq("publicada", true);
  const leccionIds = (lecciones ?? []).map((l) => l.id);
  if (leccionIds.length === 0) return { error: "El curso todavía no tiene lecciones." };

  const { data: progreso } = await supabase
    .from("progreso_lecciones")
    .select("leccion_id")
    .eq("alumno_id", perfil.id)
    .eq("completada", true)
    .in("leccion_id", leccionIds);
  const completadas = (progreso ?? []).length;

  if (completadas < leccionIds.length) {
    return { error: "Completá todas las lecciones para obtener tu certificado." };
  }

  // Emisión: el servidor ya validó la condición, insertamos con admin.
  const admin = createClienteAdmin();
  // Reintenta ante una colisión (improbable) del código de verificación.
  for (let intento = 0; intento < 5; intento++) {
    const codigo = generarCodigoVerificacion();
    const { error } = await admin.from("certificados").insert({
      alumno_id: perfil.id,
      curso_id: curso.id,
      codigo_verificacion: codigo,
    });
    if (!error) {
      revalidatePath(`/cursos/${slug}/certificado`);
      revalidatePath(`/cursos/${slug}`);
      return { ok: "¡Felicitaciones! Tu certificado está listo." };
    }
    // 23505 = unique_violation. Si choca por (alumno,curso) ya existe → salir.
    if (error.code === "23505" && !error.message.includes("codigo_verificacion")) {
      revalidatePath(`/cursos/${slug}/certificado`);
      return { ok: "Ya tenías tu certificado." };
    }
  }

  return { error: "No pudimos emitir el certificado. Intentá de nuevo." };
}
