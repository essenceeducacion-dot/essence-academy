import { createClienteServidor } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { etiquetasTipoPregunta } from "@/lib/validations/quizzes";
import {
  crearQuiz,
  eliminarQuiz,
  crearPregunta,
  eliminarPregunta,
  crearOpcion,
  alternarOpcionCorrecta,
  eliminarOpcion,
} from "../acciones-quiz";
import { FormularioQuiz } from "./FormularioQuiz";
import { FormularioPregunta } from "./FormularioPregunta";
import { FormularioOpcion } from "./FormularioOpcion";

export async function SeccionQuiz({
  cursoId,
  etapaId,
  leccionId,
}: {
  cursoId: string;
  etapaId: string;
  leccionId: string;
}) {
  const supabase = createClienteServidor();

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, titulo, puntaje_minimo_aprobar")
    .eq("leccion_id", leccionId)
    .maybeSingle();

  if (!quiz) {
    return (
      <Card>
        <h2 className="text-base text-crema">Quiz</h2>
        <p className="mb-4 mt-1 text-sm text-crema/50">
          Autoevaluación opcional al final de la lección.
        </p>
        <FormularioQuiz
          accion={crearQuiz}
          cursoId={cursoId}
          etapaId={etapaId}
          leccionId={leccionId}
        />
      </Card>
    );
  }

  const { data: preguntas } = await supabase
    .from("preguntas_quiz")
    .select("id, enunciado, tipo")
    .eq("quiz_id", quiz.id)
    .order("orden", { ascending: true })
    .order("created_at", { ascending: true });

  const listaPreguntas = preguntas ?? [];
  const preguntaIds = listaPreguntas.map((p) => p.id);

  const { data: opciones } = preguntaIds.length
    ? await supabase
        .from("opciones_pregunta")
        .select("id, pregunta_id, texto, es_correcta")
        .in("pregunta_id", preguntaIds)
        .order("orden", { ascending: true })
    : { data: [] as { id: string; pregunta_id: string; texto: string; es_correcta: boolean }[] };

  const opcionesPorPregunta = new Map<
    string,
    { id: string; pregunta_id: string; texto: string; es_correcta: boolean }[]
  >();
  for (const o of opciones ?? []) {
    const arr = opcionesPorPregunta.get(o.pregunta_id) ?? [];
    arr.push(o);
    opcionesPorPregunta.set(o.pregunta_id, arr);
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base text-crema">Quiz: {quiz.titulo}</h2>
          <p className="mt-1 text-sm text-crema/50">
            Aprueba con {quiz.puntaje_minimo_aprobar}%.
          </p>
        </div>
        <form action={eliminarQuiz}>
          <input type="hidden" name="id" value={quiz.id} />
          <input type="hidden" name="curso_id" value={cursoId} />
          <input type="hidden" name="etapa_id" value={etapaId} />
          <input type="hidden" name="leccion_id" value={leccionId} />
          <button
            type="submit"
            className="rounded px-2 py-1 text-xs text-red-300/70 hover:bg-red-500/10 hover:text-red-300"
          >
            Eliminar quiz
          </button>
        </form>
      </div>

      {listaPreguntas.length > 0 && (
        <ul className="mt-4 space-y-4">
          {listaPreguntas.map((pregunta, i) => {
            const ops = opcionesPorPregunta.get(pregunta.id) ?? [];
            const esVF = pregunta.tipo === "verdadero_falso";
            return (
              <li
                key={pregunta.id}
                className="rounded-lg border border-white/10 bg-marino-700/50 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-crema">
                    <span className="text-crema/40">{i + 1}. </span>
                    {pregunta.enunciado}
                    <span className="ml-2 text-xs text-crema/40">
                      ({etiquetasTipoPregunta[pregunta.tipo as keyof typeof etiquetasTipoPregunta]})
                    </span>
                  </p>
                  <form action={eliminarPregunta}>
                    <input type="hidden" name="id" value={pregunta.id} />
                    <input type="hidden" name="curso_id" value={cursoId} />
                    <input type="hidden" name="etapa_id" value={etapaId} />
                    <input type="hidden" name="leccion_id" value={leccionId} />
                    <button
                      type="submit"
                      aria-label="Eliminar pregunta"
                      className="rounded px-2 py-1 text-red-300/70 hover:bg-red-500/10 hover:text-red-300"
                    >
                      ✕
                    </button>
                  </form>
                </div>

                {ops.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {ops.map((op) => (
                      <li
                        key={op.id}
                        className="flex items-center justify-between gap-2 rounded border border-white/5 bg-marino-800/40 px-2.5 py-1.5"
                      >
                        <span className="flex items-center gap-2 text-sm text-crema/80">
                          <form action={alternarOpcionCorrecta}>
                            <input type="hidden" name="id" value={op.id} />
                            <input type="hidden" name="curso_id" value={cursoId} />
                            <input type="hidden" name="etapa_id" value={etapaId} />
                            <input type="hidden" name="leccion_id" value={leccionId} />
                            <input
                              type="hidden"
                              name="es_correcta"
                              value={(!op.es_correcta).toString()}
                            />
                            <button
                              type="submit"
                              aria-label={op.es_correcta ? "Marcar incorrecta" : "Marcar correcta"}
                              className={
                                op.es_correcta
                                  ? "flex h-5 w-5 items-center justify-center rounded-full bg-dorado text-xs text-marino-900"
                                  : "h-5 w-5 rounded-full border border-white/20 hover:border-dorado/60"
                              }
                            >
                              {op.es_correcta ? "✓" : ""}
                            </button>
                          </form>
                          {op.texto}
                        </span>
                        {!esVF && (
                          <form action={eliminarOpcion}>
                            <input type="hidden" name="id" value={op.id} />
                            <input type="hidden" name="curso_id" value={cursoId} />
                            <input type="hidden" name="etapa_id" value={etapaId} />
                            <input type="hidden" name="leccion_id" value={leccionId} />
                            <button
                              type="submit"
                              aria-label="Eliminar opción"
                              className="rounded px-1.5 py-0.5 text-xs text-red-300/70 hover:bg-red-500/10 hover:text-red-300"
                            >
                              ✕
                            </button>
                          </form>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {!esVF && (
                  <div className="mt-2">
                    <FormularioOpcion
                      accion={crearOpcion}
                      cursoId={cursoId}
                      etapaId={etapaId}
                      leccionId={leccionId}
                      preguntaId={pregunta.id}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-5 border-t border-white/10 pt-5">
        <p className="mb-3 text-sm text-crema/70">Agregar pregunta</p>
        <FormularioPregunta
          accion={crearPregunta}
          cursoId={cursoId}
          etapaId={etapaId}
          leccionId={leccionId}
          quizId={quiz.id}
        />
      </div>
    </Card>
  );
}
