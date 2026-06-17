import Link from "next/link";
import { notFound } from "next/navigation";
import { requerirSesion } from "@/lib/auth/guards";
import { createClienteServidor } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { FormularioIntentoQuiz } from "./_componentes/FormularioIntentoQuiz";

type TipoPregunta = "opcion_unica" | "opcion_multiple" | "verdadero_falso";

export default async function QuizAlumno({
  params,
}: {
  params: { slug: string; leccionId: string };
}) {
  const perfil = await requerirSesion();
  const supabase = createClienteServidor();

  const { data: leccion } = await supabase
    .from("lecciones")
    .select("id, titulo")
    .eq("id", params.leccionId)
    .maybeSingle();
  if (!leccion) notFound();

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, titulo, puntaje_minimo_aprobar")
    .eq("leccion_id", leccion.id)
    .maybeSingle();
  if (!quiz) notFound();

  const base = `/cursos/${params.slug}/lecciones/${leccion.id}`;

  const { data: preguntas } = await supabase
    .from("preguntas_quiz")
    .select("id, enunciado, tipo")
    .eq("quiz_id", quiz.id)
    .order("orden", { ascending: true })
    .order("created_at", { ascending: true });

  const listaPreguntas = preguntas ?? [];
  const preguntaIds = listaPreguntas.map((p) => p.id);

  // Opciones SIN es_correcta, vía la vista pública autofiltrada por inscripción.
  const { data: opciones } = preguntaIds.length
    ? await supabase
        .from("opciones_pregunta_publicas")
        .select("id, pregunta_id, texto")
        .in("pregunta_id", preguntaIds)
        .order("orden", { ascending: true })
    : { data: [] as { id: string; pregunta_id: string; texto: string }[] };

  const opcionesPorPregunta = new Map<string, { id: string; texto: string }[]>();
  for (const o of opciones ?? []) {
    const arr = opcionesPorPregunta.get(o.pregunta_id) ?? [];
    arr.push({ id: o.id, texto: o.texto });
    opcionesPorPregunta.set(o.pregunta_id, arr);
  }

  const preguntasConOpciones = listaPreguntas.map((p) => ({
    id: p.id,
    enunciado: p.enunciado,
    tipo: p.tipo as TipoPregunta,
    opciones: opcionesPorPregunta.get(p.id) ?? [],
  }));

  // Mejor intento previo (informativo).
  const { data: intentos } = await supabase
    .from("intentos_quiz")
    .select("puntaje, aprobado")
    .eq("alumno_id", perfil.id)
    .eq("quiz_id", quiz.id)
    .order("puntaje", { ascending: false })
    .limit(1);
  const mejor = intentos?.[0];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href={base} className="text-sm text-crema/50 hover:text-crema">
          ← {leccion.titulo}
        </Link>
        <h1 className="mt-2 text-2xl text-crema">{quiz.titulo}</h1>
        <p className="mt-1 text-sm text-crema/50">
          Aprobás con {quiz.puntaje_minimo_aprobar}%.
          {mejor &&
            ` Tu mejor intento: ${mejor.puntaje}%${mejor.aprobado ? " (aprobado)" : ""}.`}
        </p>
      </div>

      {preguntasConOpciones.length === 0 ? (
        <Card>
          <p className="text-sm text-crema/50">
            Este quiz todavía no tiene preguntas.
          </p>
        </Card>
      ) : (
        <FormularioIntentoQuiz
          quizId={quiz.id}
          preguntas={preguntasConOpciones}
        />
      )}
    </div>
  );
}
