"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClienteServidor } from "@/lib/supabase/server";
import { requerirStaff } from "@/lib/auth/guards";
import { esquemaModulo, esquemaLeccion } from "@/lib/validations/lecciones";
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

function rutaEtapa(cursoId: string, etapaId: string) {
  return `/panel/cursos/${cursoId}/etapas/${etapaId}`;
}

// ---------------------------------------------------------------------------
// MÓDULOS (agrupador opcional dentro de la etapa)
// ---------------------------------------------------------------------------
export async function crearModulo(
  _prev: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  await requerirStaff();

  const etapaId = String(formData.get("etapa_id") ?? "");
  const cursoId = String(formData.get("curso_id") ?? "");
  if (!etapaId || !cursoId) return { error: "Faltan datos de la etapa." };

  const datos = esquemaModulo.safeParse({
    titulo: formData.get("titulo"),
    orden: formData.get("orden"),
  });
  if (!datos.success) return { error: primerError(datos.error) };

  const supabase = createClienteServidor();
  const { data: ultimo } = await supabase
    .from("modulos")
    .select("orden")
    .eq("etapa_id", etapaId)
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("modulos").insert({
    etapa_id: etapaId,
    titulo: datos.data.titulo,
    orden: (ultimo?.orden ?? -1) + 1,
  });
  if (error) return { error: "No pudimos crear el módulo. Intentá de nuevo." };

  revalidatePath(rutaEtapa(cursoId, etapaId));
  return { ok: "Módulo creado." };
}

export async function eliminarModulo(formData: FormData): Promise<void> {
  await requerirStaff();

  const id = String(formData.get("id") ?? "");
  const etapaId = String(formData.get("etapa_id") ?? "");
  const cursoId = String(formData.get("curso_id") ?? "");
  if (!id || !etapaId || !cursoId) return;

  // Las lecciones del módulo quedan sin módulo (FK on delete set null).
  const supabase = createClienteServidor();
  await supabase.from("modulos").delete().eq("id", id);

  revalidatePath(rutaEtapa(cursoId, etapaId));
}

// ---------------------------------------------------------------------------
// LECCIONES
// ---------------------------------------------------------------------------
export async function crearLeccion(
  _prev: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  await requerirStaff();

  const etapaId = String(formData.get("etapa_id") ?? "");
  const cursoId = String(formData.get("curso_id") ?? "");
  if (!etapaId || !cursoId) return { error: "Faltan datos de la etapa." };

  const datos = esquemaLeccion.safeParse({
    titulo: formData.get("titulo"),
    descripcion: formData.get("descripcion"),
    modulo_id: formData.get("modulo_id"),
    publicada: formData.get("publicada") === "on",
    orden: formData.get("orden"),
  });
  if (!datos.success) return { error: primerError(datos.error) };

  const supabase = createClienteServidor();
  const { data: ultima } = await supabase
    .from("lecciones")
    .select("orden")
    .eq("etapa_id", etapaId)
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("lecciones").insert({
    etapa_id: etapaId,
    modulo_id: datos.data.modulo_id || null,
    titulo: datos.data.titulo,
    descripcion: datos.data.descripcion || null,
    publicada: datos.data.publicada,
    orden: (ultima?.orden ?? -1) + 1,
  });
  if (error) return { error: "No pudimos crear la lección. Intentá de nuevo." };

  revalidatePath(rutaEtapa(cursoId, etapaId));
  return { ok: "Lección creada." };
}

export async function actualizarLeccion(
  _prev: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  await requerirStaff();

  const id = String(formData.get("id") ?? "");
  const etapaId = String(formData.get("etapa_id") ?? "");
  const cursoId = String(formData.get("curso_id") ?? "");
  if (!id || !etapaId || !cursoId) return { error: "Faltan datos de la lección." };

  const datos = esquemaLeccion.safeParse({
    titulo: formData.get("titulo"),
    descripcion: formData.get("descripcion"),
    modulo_id: formData.get("modulo_id"),
    publicada: formData.get("publicada") === "on",
    orden: formData.get("orden"),
  });
  if (!datos.success) return { error: primerError(datos.error) };

  const supabase = createClienteServidor();
  const { error } = await supabase
    .from("lecciones")
    .update({
      modulo_id: datos.data.modulo_id || null,
      titulo: datos.data.titulo,
      descripcion: datos.data.descripcion || null,
      publicada: datos.data.publicada,
      orden: datos.data.orden,
    })
    .eq("id", id);
  if (error) return { error: "No pudimos guardar la lección. Intentá de nuevo." };

  revalidatePath(rutaEtapa(cursoId, etapaId));
  revalidatePath(`${rutaEtapa(cursoId, etapaId)}/lecciones/${id}`);
  return { ok: "Cambios guardados." };
}

export async function eliminarLeccion(formData: FormData): Promise<void> {
  await requerirStaff();

  const id = String(formData.get("id") ?? "");
  const etapaId = String(formData.get("etapa_id") ?? "");
  const cursoId = String(formData.get("curso_id") ?? "");
  if (!id || !etapaId || !cursoId) return;

  const supabase = createClienteServidor();
  await supabase.from("lecciones").delete().eq("id", id);

  revalidatePath(rutaEtapa(cursoId, etapaId));
  redirect(rutaEtapa(cursoId, etapaId));
}

export async function alternarPublicacionLeccion(formData: FormData): Promise<void> {
  await requerirStaff();

  const id = String(formData.get("id") ?? "");
  const etapaId = String(formData.get("etapa_id") ?? "");
  const cursoId = String(formData.get("curso_id") ?? "");
  const publicada = formData.get("publicada") === "true";
  if (!id || !etapaId || !cursoId) return;

  const supabase = createClienteServidor();
  await supabase.from("lecciones").update({ publicada }).eq("id", id);

  revalidatePath(rutaEtapa(cursoId, etapaId));
  revalidatePath(`${rutaEtapa(cursoId, etapaId)}/lecciones/${id}`);
}

// Reordena una lección intercambiando su `orden` con el vecino (subir/bajar).
export async function moverLeccion(formData: FormData): Promise<void> {
  await requerirStaff();

  const id = String(formData.get("id") ?? "");
  const etapaId = String(formData.get("etapa_id") ?? "");
  const cursoId = String(formData.get("curso_id") ?? "");
  const direccion = String(formData.get("direccion") ?? "");
  if (!id || !etapaId || !cursoId || (direccion !== "subir" && direccion !== "bajar"))
    return;

  const supabase = createClienteServidor();
  const { data: lecciones } = await supabase
    .from("lecciones")
    .select("id, orden")
    .eq("etapa_id", etapaId)
    .order("orden", { ascending: true })
    .order("created_at", { ascending: true });
  if (!lecciones) return;

  const i = lecciones.findIndex((l) => l.id === id);
  if (i === -1) return;
  const j = direccion === "subir" ? i - 1 : i + 1;
  if (j < 0 || j >= lecciones.length) return;

  const a = lecciones[i];
  const b = lecciones[j];
  const ordenA = a.orden === b.orden ? j : b.orden;
  const ordenB = a.orden === b.orden ? i : a.orden;

  await supabase.from("lecciones").update({ orden: ordenA }).eq("id", a.id);
  await supabase.from("lecciones").update({ orden: ordenB }).eq("id", b.id);

  revalidatePath(rutaEtapa(cursoId, etapaId));
}
