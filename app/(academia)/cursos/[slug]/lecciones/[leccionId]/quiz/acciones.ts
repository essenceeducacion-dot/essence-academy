"use server";

import { createClienteServidor } from "@/lib/supabase/server";
import { createClienteAdmin } from "@/lib/supabase/admin";
import { requerirSesion } from "@/lib/auth/guards";

export type ResultadoIntento =
  | { error: string }
  | {
      ok: true;
      puntaje: number;
      aprobado: boolean;
      correctas: number;
      total: number;
    }
  | null;

export async function corregirQuiz(
  _prev: ResultadoIntento,
  formData: FormData
): Promise<ResultadoIntento> {
  const perfil = await requerirSesion();

  const quizId = String(formData.get("quiz_id") ?? "");
  if (!quizId) return { error: "Falta el quiz." };

  const supabase = createClienteServidor();

  // Quiz + preguntas visibles al alumno (RLS gatea por inscripción + publicada).
  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, puntaje_minimo_aprobar")
    .eq("id", quizId)
    .maybeSingle();
  if (!quiz) return { error: "No encontramos el quiz o no tenés acceso." };

  const { data: preguntas } = await supabase
    .from("preguntas_quiz")
    .select("id")
    .eq("quiz_id", quizId);

  const listaPreguntas = preguntas ?? [];
  if (listaPreguntas.length === 0)
    return { error: "El quiz todavía no tiene preguntas." };

  // Opciones correctas: se leen con el cliente admin para NUNCA exponer
  // es_correcta al alumno. Solo se usan en el servidor para corregir.
  const admin = createClienteAdmin();
  const { data: opciones } = await admin
    .from("opciones_pregunta")
    .select("id, pregunta_id, es_correcta")
    .in(
      "pregunta_id",
      listaPreguntas.map((p) => p.id)
    );

  const correctasPorPregunta = new Map<string, Set<string>>();
  for (const o of opciones ?? []) {
    if (!correctasPorPregunta.has(o.pregunta_id))
      correctasPorPregunta.set(o.pregunta_id, new Set());
    if (o.es_correcta) correctasPorPregunta.get(o.pregunta_id)!.add(o.id);
  }

  const respuestas: Record<string, string[]> = {};
  let correctas = 0;
  for (const pregunta of listaPreguntas) {
    const seleccionadas = formData
      .getAll(`pregunta_${pregunta.id}`)
      .map((v) => String(v))
      .filter(Boolean);
    respuestas[pregunta.id] = seleccionadas;

    const correctaSet = correctasPorPregunta.get(pregunta.id) ?? new Set<string>();
    const elegidaSet = new Set(seleccionadas);
    const acerto =
      correctaSet.size > 0 &&
      correctaSet.size === elegidaSet.size &&
      [...correctaSet].every((id) => elegidaSet.has(id));
    if (acerto) correctas += 1;
  }

  const total = listaPreguntas.length;
  const puntaje = Math.round((correctas / total) * 100);
  const aprobado = puntaje >= quiz.puntaje_minimo_aprobar;

  // El intento lo guarda el propio alumno (RLS: intentos_alumno).
  await supabase.from("intentos_quiz").insert({
    alumno_id: perfil.id,
    quiz_id: quizId,
    puntaje,
    aprobado,
    respuestas,
  });

  return { ok: true, puntaje, aprobado, correctas, total };
}
