"use server";

import { revalidatePath } from "next/cache";
import { createClienteServidor } from "@/lib/supabase/server";
import { requerirStaff } from "@/lib/auth/guards";
import type { EstadoFormulario } from "@/lib/validations/auth";

const RUTA = "/panel/alumnos";
const estadosValidos = ["activa", "pausada", "revocada"] as const;

export async function crearInscripcion(
  _prev: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const perfil = await requerirStaff();

  const alumnoId = String(formData.get("alumno_id") ?? "");
  const cursoId = String(formData.get("curso_id") ?? "");
  if (!alumnoId || !cursoId) return { error: "Elegí un alumno y un curso." };

  const supabase = createClienteServidor();
  const { error } = await supabase
    .from("inscripciones")
    .upsert(
      {
        alumno_id: alumnoId,
        curso_id: cursoId,
        estado: "activa",
        inscripto_por: perfil.id,
      },
      { onConflict: "alumno_id,curso_id" }
    );
  if (error) return { error: "No pudimos inscribir al alumno. Intentá de nuevo." };

  revalidatePath(RUTA);
  return { ok: "Alumno inscripto." };
}

export async function cambiarEstadoInscripcion(formData: FormData): Promise<void> {
  await requerirStaff();

  const id = String(formData.get("id") ?? "");
  const estado = String(formData.get("estado") ?? "");
  if (!id || !estadosValidos.includes(estado as (typeof estadosValidos)[number]))
    return;

  const supabase = createClienteServidor();
  await supabase.from("inscripciones").update({ estado }).eq("id", id);

  revalidatePath(RUTA);
}

export async function eliminarInscripcion(formData: FormData): Promise<void> {
  await requerirStaff();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = createClienteServidor();
  await supabase.from("inscripciones").delete().eq("id", id);

  revalidatePath(RUTA);
}
