import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requerirSesion, esStaff } from "@/lib/auth/guards";
import { createClienteServidor } from "@/lib/supabase/server";
import { flags, env } from "@/lib/env";
import { fechaLarga } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { FormularioEmitir } from "./_componentes/FormularioEmitir";
import { BotonImprimir } from "./_componentes/BotonImprimir";

export default async function CertificadoCurso({
  params,
}: {
  params: { slug: string };
}) {
  if (!flags.certificados) redirect("/inicio");
  const perfil = await requerirSesion();
  const supabase = createClienteServidor();

  const { data: curso } = await supabase
    .from("cursos")
    .select("id, titulo, slug")
    .eq("slug", params.slug)
    .maybeSingle();
  if (!curso) notFound();

  const volver = (
    <Link
      href={`/cursos/${curso.slug}`}
      className="text-sm text-crema/50 hover:text-crema"
    >
      ← Volver al curso
    </Link>
  );

  // Los certificados son para alumnos inscriptos.
  if (esStaff(perfil.rol)) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        {volver}
        <Card>
          <p className="text-sm text-crema/60">
            Los certificados se emiten para los alumnos al completar el curso.
          </p>
        </Card>
      </div>
    );
  }

  // ¿Ya tiene certificado emitido?
  const { data: certificado } = await supabase
    .from("certificados")
    .select("codigo_verificacion, fecha_emision")
    .eq("alumno_id", perfil.id)
    .eq("curso_id", curso.id)
    .maybeSingle();

  if (certificado) {
    const urlVerificacion = `${env.NEXT_PUBLIC_SITE_URL}/verificar/${certificado.codigo_verificacion}`;
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="print:hidden">{volver}</div>

        <Card className="border-dorado/30 bg-gradient-to-b from-marino-700/80 to-marino-900/80 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-dorado/80">
            Essence Academy
          </p>
          <p className="mt-6 text-sm text-crema/60">Certificado de finalización</p>
          <p className="mt-3 font-display text-3xl text-crema">
            {perfil.nombre ?? perfil.email}
          </p>
          <p className="mt-3 text-sm text-crema/60">
            completó satisfactoriamente el curso
          </p>
          <p className="mt-1 font-display text-xl text-dorado">{curso.titulo}</p>
          <p className="mt-6 text-xs text-crema/50">
            Emitido el {fechaLarga(certificado.fecha_emision)}
          </p>
          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="text-xs text-crema/40">Código de verificación</p>
            <p className="mt-1 font-mono text-sm tracking-wider text-crema">
              {certificado.codigo_verificacion}
            </p>
            <p className="mt-1 text-xs text-crema/40 break-all">{urlVerificacion}</p>
          </div>
        </Card>

        <div className="flex justify-center print:hidden">
          <BotonImprimir />
        </div>
      </div>
    );
  }

  // Sin certificado: verificar progreso para ofrecer la emisión.
  const { data: etapas } = await supabase
    .from("etapas")
    .select("id")
    .eq("curso_id", curso.id);
  const etapaIds = (etapas ?? []).map((e) => e.id);

  const { data: lecciones } = etapaIds.length
    ? await supabase
        .from("lecciones")
        .select("id")
        .in("etapa_id", etapaIds)
        .eq("publicada", true)
    : { data: [] as { id: string }[] };
  const leccionIds = (lecciones ?? []).map((l) => l.id);

  const { data: progreso } = leccionIds.length
    ? await supabase
        .from("progreso_lecciones")
        .select("leccion_id")
        .eq("alumno_id", perfil.id)
        .eq("completada", true)
        .in("leccion_id", leccionIds)
    : { data: [] as { leccion_id: string }[] };

  const total = leccionIds.length;
  const completadas = (progreso ?? []).length;
  const completo = total > 0 && completadas >= total;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {volver}
      <Card>
        <h1 className="font-display text-xl text-crema">
          Certificado de {curso.titulo}
        </h1>
        {completo ? (
          <>
            <p className="mt-2 text-sm text-crema/60">
              Completaste todas las lecciones. Ya podés emitir tu certificado.
            </p>
            <div className="mt-4">
              <FormularioEmitir slug={curso.slug} />
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-crema/60">
            Completá todas las lecciones del curso para obtener tu certificado.
            {total > 0 && (
              <>
                {" "}
                Llevás {completadas} de {total}.
              </>
            )}
          </p>
        )}
      </Card>
    </div>
  );
}
