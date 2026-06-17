"use client";

import { useFormState } from "react-dom";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { corregirQuiz, type ResultadoIntento } from "../acciones";

type Pregunta = {
  id: string;
  enunciado: string;
  tipo: "opcion_unica" | "opcion_multiple" | "verdadero_falso";
  opciones: { id: string; texto: string }[];
};

export function FormularioIntentoQuiz({
  quizId,
  preguntas,
}: {
  quizId: string;
  preguntas: Pregunta[];
}) {
  const [estado, formAction] = useFormState<ResultadoIntento, FormData>(
    corregirQuiz,
    null
  );

  const aprobado = estado && "ok" in estado ? estado.aprobado : false;

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="quiz_id" value={quizId} />

      {estado && "error" in estado && (
        <Alert tono="error">{estado.error}</Alert>
      )}

      {estado && "ok" in estado && (
        <Alert tono={aprobado ? "exito" : "error"}>
          {aprobado
            ? `¡Aprobaste! Puntaje: ${estado.puntaje}% (${estado.correctas}/${estado.total}).`
            : `No alcanzó esta vez: ${estado.puntaje}% (${estado.correctas}/${estado.total}). Podés volver a intentarlo.`}
        </Alert>
      )}

      {preguntas.map((pregunta, i) => {
        const multiple = pregunta.tipo === "opcion_multiple";
        return (
          <Card key={pregunta.id}>
            <p className="mb-3 text-sm text-crema">
              <span className="text-crema/40">{i + 1}. </span>
              {pregunta.enunciado}
              {multiple && (
                <span className="ml-2 text-xs text-crema/40">
                  (elegí todas las que correspondan)
                </span>
              )}
            </p>
            <div className="space-y-2">
              {pregunta.opciones.map((op) => (
                <label
                  key={op.id}
                  className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-marino-700/50 px-3 py-2.5 text-sm text-crema/90 hover:border-dorado/30"
                >
                  <input
                    type={multiple ? "checkbox" : "radio"}
                    name={`pregunta_${pregunta.id}`}
                    value={op.id}
                    className="h-4 w-4 border-white/20 bg-marino-700 accent-dorado"
                  />
                  {op.texto}
                </label>
              ))}
            </div>
          </Card>
        );
      })}

      <SubmitButton>Enviar respuestas</SubmitButton>
    </form>
  );
}
