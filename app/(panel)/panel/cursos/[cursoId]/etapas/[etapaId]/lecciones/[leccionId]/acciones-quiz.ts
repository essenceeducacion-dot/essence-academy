"use server";

import { revalidatePath } from "next/cache";
import { createClienteServidor } from "@/lib/supabase/server";
import { requerirStaff } from "@/lib/auth/guards";
import {
  esquemaQuiz,
  esquemaPregunta,
  esquemaOpcion,
} from "@/lib/validations/quizzes";
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

function rutaLeccion(cursoId: string, etapaId: string, leccionId: string) {
  return `/panel/cursos/${cursoId}/etapas/${etapaId}/lecciones/${leccionId}`;
}

function ctx(formData: FormData) {
  return {
    cursoId: String(formData.get("curso_id") ?? ""),
    etapaId: String(formData.get("etapa_id") ?? ""),
    leccionId: String(formData.get("leccion_id") ?? ""),
  };
}

// --- QUIZ ---------------------------------------------------------------
export async function crearQuiz(
  _prev: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  await requerirStaff();
  const { cursoId, etapaId, leccionId } = ctx(formData);
  if (!cursoId || !etapaId || !leccionId)
    return { error: "Faltan datos de la lección." };

  const datos = esquemaQuiz.safeParse({
    titulo: formData.get("titulo"),
    puntaje_minimo_aprobar: formData.get("puntaje_minimo_aprobar"),
  });
  if (!datos.success) return { error: primerError(datos.error) };

  const supabase = createClienteServidor();
  const { error } = await supabase.from("quizzes").insert({
    leccion_id: leccionId,
    titulo: datos.data.titulo,
    puntaje_minimo_aprobar: datos.data.puntaje_minimo_aprobar,
  });
  if (error) return { error: "No pudimos crear el quiz. Intentá de nuevo." };

  revalidatePath(rutaLeccion(cursoId, etapaId, leccionId));
  return { ok: "Quiz creado." };
}

export async function eliminarQuiz(formData: FormData): Promise<void> {
  await requerirStaff();
  const { cursoId, etapaId, leccionId } = ctx(formData);
  const id = String(formData.get("id") ?? "");
  if (!id || !cursoId || !etapaId || !leccionId) return;

  const supabase = createClienteServidor();
  await supabase.from("quizzes").delete().eq("id", id);
  revalidatePath(rutaLeccion(cursoId, etapaId, leccionId));
}

// --- PREGUNTA -----------------------------------------------------------
export async function crearPregunta(
  _prev: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  await requerirStaff();
  const { cursoId, etapaId, leccionId } = ctx(formData);
  const quizId = String(formData.get("quiz_id") ?? "");
  if (!quizId) return { error: "Falta el quiz." };

  const datos = esquemaPregunta.safeParse({
    enunciado: formData.get("enunciado"),
    tipo: formData.get("tipo"),
  });
  if (!datos.success) return { error: primerError(datos.error) };

  const supabase = createClienteServidor();
  const { data: ultima } = await supabase
    .from("preguntas_quiz")
    .select("orden")
    .eq("quiz_id", quizId)
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: pregunta, error } = await supabase
    .from("preguntas_quiz")
    .insert({
      quiz_id: quizId,
      enunciado: datos.data.enunciado,
      tipo: datos.data.tipo,
      orden: (ultima?.orden ?? -1) + 1,
    })
    .select("id")
    .single();
  if (error || !pregunta)
    return { error: "No pudimos crear la pregunta. Intentá de nuevo." };

  // Para verdadero/falso, sembramos las dos opciones automáticamente.
  if (datos.data.tipo === "verdadero_falso") {
    await supabase.from("opciones_pregunta").insert([
      { pregunta_id: pregunta.id, texto: "Verdadero", es_correcta: false, orden: 0 },
      { pregunta_id: pregunta.id, texto: "Falso", es_correcta: false, orden: 1 },
    ]);
  }

  revalidatePath(rutaLeccion(cursoId, etapaId, leccionId));
  return { ok: "Pregunta agregada." };
}

export async function eliminarPregunta(formData: FormData): Promise<void> {
  await requerirStaff();
  const { cursoId, etapaId, leccionId } = ctx(formData);
  const id = String(formData.get("id") ?? "");
  if (!id || !cursoId || !etapaId || !leccionId) return;

  const supabase = createClienteServidor();
  await supabase.from("preguntas_quiz").delete().eq("id", id);
  revalidatePath(rutaLeccion(cursoId, etapaId, leccionId));
}

// --- OPCION -------------------------------------------------------------
export async function crearOpcion(
  _prev: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  await requerirStaff();
  const { cursoId, etapaId, leccionId } = ctx(formData);
  const preguntaId = String(formData.get("pregunta_id") ?? "");
  if (!preguntaId) return { error: "Falta la pregunta." };

  const datos = esquemaOpcion.safeParse({
    texto: formData.get("texto"),
    es_correcta: formData.get("es_correcta") === "on",
  });
  if (!datos.success) return { error: primerError(datos.error) };

  const supabase = createClienteServidor();
  const { data: ultima } = await supabase
    .from("opciones_pregunta")
    .select("orden")
    .eq("pregunta_id", preguntaId)
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("opciones_pregunta").insert({
    pregunta_id: preguntaId,
    texto: datos.data.texto,
    es_correcta: datos.data.es_correcta,
    orden: (ultima?.orden ?? -1) + 1,
  });
  if (error) return { error: "No pudimos agregar la opción. Intentá de nuevo." };

  revalidatePath(rutaLeccion(cursoId, etapaId, leccionId));
  return { ok: "Opción agregada." };
}

export async function alternarOpcionCorrecta(formData: FormData): Promise<void> {
  await requerirStaff();
  const { cursoId, etapaId, leccionId } = ctx(formData);
  const id = String(formData.get("id") ?? "");
  const correcta = formData.get("es_correcta") === "true";
  if (!id || !cursoId || !etapaId || !leccionId) return;

  const supabase = createClienteServidor();
  await supabase
    .from("opciones_pregunta")
    .update({ es_correcta: correcta })
    .eq("id", id);
  revalidatePath(rutaLeccion(cursoId, etapaId, leccionId));
}

export async function eliminarOpcion(formData: FormData): Promise<void> {
  await requerirStaff();
  const { cursoId, etapaId, leccionId } = ctx(formData);
  const id = String(formData.get("id") ?? "");
  if (!id || !cursoId || !etapaId || !leccionId) return;

  const supabase = createClienteServidor();
  await supabase.from("opciones_pregunta").delete().eq("id", id);
  revalidatePath(rutaLeccion(cursoId, etapaId, leccionId));
}
