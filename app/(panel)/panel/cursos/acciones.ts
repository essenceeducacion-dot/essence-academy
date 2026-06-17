"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClienteServidor } from "@/lib/supabase/server";
import { requerirStaff, requerirAdmin } from "@/lib/auth/guards";
import { slugify } from "@/lib/utils";
import { esquemaCurso, estadosCurso, type EstadoCurso } from "@/lib/validations/cursos";
import type { EstadoFormulario } from "@/lib/validations/auth";

// Devuelve el primer mensaje de error de un parseo Zod fallido.
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

function leerFormulario(formData: FormData) {
  return {
    titulo: formData.get("titulo"),
    slug: formData.get("slug"),
    descripcion: formData.get("descripcion"),
    es_insignia: formData.get("es_insignia") === "on",
    estado: formData.get("estado"),
    orden: formData.get("orden"),
  };
}

export async function crearCurso(
  _prev: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  await requerirStaff();

  const datos = esquemaCurso.safeParse(leerFormulario(formData));
  if (!datos.success) return { error: primerError(datos.error) };

  const { titulo, descripcion, es_insignia, estado, orden } = datos.data;
  const slug = slugify(datos.data.slug || titulo);
  if (!slug) return { error: "No pudimos generar un identificador a partir del título." };

  const supabase = createClienteServidor();
  const { data, error } = await supabase
    .from("cursos")
    .insert({
      titulo,
      slug,
      descripcion: descripcion || null,
      es_insignia,
      estado,
      orden,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505")
      return { error: "Ya existe un curso con ese identificador (slug)." };
    return { error: "No pudimos crear el curso. Intentá de nuevo." };
  }

  revalidatePath("/panel/cursos");
  redirect(`/panel/cursos/${data.id}`);
}

export async function actualizarCurso(
  _prev: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  await requerirStaff();

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Falta el identificador del curso." };

  const datos = esquemaCurso.safeParse(leerFormulario(formData));
  if (!datos.success) return { error: primerError(datos.error) };

  const { titulo, descripcion, es_insignia, estado, orden } = datos.data;
  const slug = slugify(datos.data.slug || titulo);
  if (!slug) return { error: "No pudimos generar un identificador a partir del título." };

  const supabase = createClienteServidor();
  const { error } = await supabase
    .from("cursos")
    .update({
      titulo,
      slug,
      descripcion: descripcion || null,
      es_insignia,
      estado,
      orden,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505")
      return { error: "Ya existe un curso con ese identificador (slug)." };
    return { error: "No pudimos guardar los cambios. Intentá de nuevo." };
  }

  revalidatePath("/panel/cursos");
  revalidatePath(`/panel/cursos/${id}`);
  return { ok: "Cambios guardados." };
}

export async function cambiarEstadoCurso(formData: FormData): Promise<void> {
  await requerirStaff();

  const id = String(formData.get("id") ?? "");
  const estado = String(formData.get("estado") ?? "");
  if (!id || !estadosCurso.includes(estado as EstadoCurso)) return;

  const supabase = createClienteServidor();
  await supabase.from("cursos").update({ estado }).eq("id", id);

  revalidatePath("/panel/cursos");
  revalidatePath(`/panel/cursos/${id}`);
}

export async function eliminarCurso(formData: FormData): Promise<void> {
  // Borrar un curso completo arrastra todo su contenido: solo admin.
  await requerirAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = createClienteServidor();
  await supabase.from("cursos").delete().eq("id", id);

  revalidatePath("/panel/cursos");
  redirect("/panel/cursos");
}
