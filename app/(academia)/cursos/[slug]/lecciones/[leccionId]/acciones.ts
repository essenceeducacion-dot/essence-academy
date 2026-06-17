"use server";

import { revalidatePath } from "next/cache";
import { createClienteServidor } from "@/lib/supabase/server";
import { requerirSesion } from "@/lib/auth/guards";

// Marca o desmarca una lección como completada para el alumno actual.
export async function alternarCompletada(formData: FormData): Promise<void> {
  const perfil = await requerirSesion();

  const leccionId = String(formData.get("leccion_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const completada = formData.get("completada") === "true";
  if (!leccionId || !slug) return;

  const supabase = createClienteServidor();
  await supabase.from("progreso_lecciones").upsert(
    {
      alumno_id: perfil.id,
      leccion_id: leccionId,
      completada,
      fecha_completada: completada ? new Date().toISOString() : null,
    },
    { onConflict: "alumno_id,leccion_id" }
  );

  revalidatePath(`/cursos/${slug}/lecciones/${leccionId}`);
  revalidatePath(`/cursos/${slug}`);
}
