"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClienteServidor } from "@/lib/supabase/server";
import { requerirStaff } from "@/lib/auth/guards";
import { esquemaEtapa } from "@/lib/validations/etapas";
import type { EstadoFormulario } from "@/lib/validations/auth";

function primerError(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "issues" in error &&
    Array.isArray((error as { issues: { message: string }[] }).issues)
  ) {
    return (error as { issues: { message: string }[] }).issues[0].message;
  }
  return "Revisá los datos e intentá de nuevo.";
}

function revalidarCurso(cursoId: string) {
  revalidatePath(`/panel/cursos/${cursoId}`);
}

export async function crearEtapa(
  _prev: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  await requerirStaff();

  const cursoId = String(formData.get("curso_id") ?? "");
  if (!cursoId) return { error: "Falta el curso." };

  const datos = esquemaEtapa.safeParse({
    nombre: formData.get("nombre"),
    descripcion: formData.get("descripcion"),
    orden: formData.get("orden"),
  });
  if (!datos.success) return { error: primerError(datos.error) };

  const supabase = createClienteServidor();

  // Si no mandan orden explícito, la ponemos al final.
  let orden = datos.data.orden;
  if (!formData.get("orden")) {
    const { data: ultima } = await supabase
      .from("etapas")
      .select("orden")
      .eq("curso_id", cursoId)
      .order("orden", { ascending: false })
      .limit(1)
      .maybeSingle();
    orden = (ultima?.orden ?? -1) + 1;
  }

  const { error } = await supabase.from("etapas").insert({
    curso_id: cursoId,
    nombre: datos.data.nombre,
    descripcion: datos.data.descripcion || null,
    orden,
  });
  if (error) return { error: "No pudimos crear la etapa. Intentá de nuevo." };

  revalidarCurso(cursoId);
  return { ok: "Etapa creada." };
}

export async function actualizarEtapa(
  _prev: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  await requerirStaff();

  const id = String(formData.get("id") ?? "");
  const cursoId = String(formData.get("curso_id") ?? "");
  if (!id || !cursoId) return { error: "Faltan datos de la etapa." };

  const datos = esquemaEtapa.safeParse({
    nombre: formData.get("nombre"),
    descripcion: formData.get("descripcion"),
    orden: formData.get("orden"),
  });
  if (!datos.success) return { error: primerError(datos.error) };

  const supabase = createClienteServidor();
  const { error } = await supabase
    .from("etapas")
    .update({
      nombre: datos.data.nombre,
      descripcion: datos.data.descripcion || null,
      orden: datos.data.orden,
    })
    .eq("id", id);
  if (error) return { error: "No pudimos guardar la etapa. Intentá de nuevo." };

  revalidarCurso(cursoId);
  revalidatePath(`/panel/cursos/${cursoId}/etapas/${id}`);
  return { ok: "Cambios guardados." };
}

export async function eliminarEtapa(formData: FormData): Promise<void> {
  await requerirStaff();

  const id = String(formData.get("id") ?? "");
  const cursoId = String(formData.get("curso_id") ?? "");
  if (!id || !cursoId) return;

  const supabase = createClienteServidor();
  await supabase.from("etapas").delete().eq("id", id);

  revalidarCurso(cursoId);
  redirect(`/panel/cursos/${cursoId}`);
}

// Reordena una etapa intercambiando su `orden` con el vecino (subir/bajar).
export async function moverEtapa(formData: FormData): Promise<void> {
  await requerirStaff();

  const id = String(formData.get("id") ?? "");
  const cursoId = String(formData.get("curso_id") ?? "");
  const direccion = String(formData.get("direccion") ?? "");
  if (!id || !cursoId || (direccion !== "subir" && direccion !== "bajar")) return;

  const supabase = createClienteServidor();
  const { data: etapas } = await supabase
    .from("etapas")
    .select("id, orden")
    .eq("curso_id", cursoId)
    .order("orden", { ascending: true })
    .order("created_at", { ascending: true });
  if (!etapas) return;

  const i = etapas.findIndex((e) => e.id === id);
  if (i === -1) return;
  const j = direccion === "subir" ? i - 1 : i + 1;
  if (j < 0 || j >= etapas.length) return;

  const a = etapas[i];
  const b = etapas[j];

  // Intercambiar órdenes. Si empatan, forzamos un desempate por índice.
  const ordenA = a.orden === b.orden ? j : b.orden;
  const ordenB = a.orden === b.orden ? i : a.orden;

  await supabase.from("etapas").update({ orden: ordenA }).eq("id", a.id);
  await supabase.from("etapas").update({ orden: ordenB }).eq("id", b.id);

  revalidarCurso(cursoId);
}
