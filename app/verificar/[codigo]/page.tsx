import Link from "next/link";
import { createClienteAdmin } from "@/lib/supabase/admin";
import { flags } from "@/lib/env";
import { fechaLarga } from "@/lib/utils";
import { Logo } from "@/components/marca/Logo";
import { Card } from "@/components/ui/Card";

export const metadata = {
  title: "Verificar certificado — Essence Academy",
};

export default async function VerificarCertificado({
  params,
}: {
  params: { codigo: string };
}) {
  // Página pública (sin sesión): se usa el cliente admin para leer el
  // certificado salteando la RLS. Solo se exponen datos de presentación
  // (nombre del alumno, curso y fecha), nunca emails ni roles.
  const codigo = decodeURIComponent(params.codigo).trim().toUpperCase();

  let valido = false;
  let alumno = "";
  let curso = "";
  let fecha = "";

  if (flags.certificados && codigo) {
    const admin = createClienteAdmin();
    const { data: cert } = await admin
      .from("certificados")
      .select("alumno_id, curso_id, fecha_emision")
      .eq("codigo_verificacion", codigo)
      .maybeSingle();

    if (cert) {
      const [{ data: perfil }, { data: curso_ }] = await Promise.all([
        admin.from("perfiles").select("nombre").eq("id", cert.alumno_id).maybeSingle(),
        admin.from("cursos").select("titulo").eq("id", cert.curso_id).maybeSingle(),
      ]);
      valido = true;
      alumno = perfil?.nombre || "Alumno de la academia";
      curso = curso_?.titulo || "Curso";
      fecha = fechaLarga(cert.fecha_emision);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 px-4 py-12">
      <Link href="/">
        <Logo />
      </Link>

      {valido ? (
        <Card className="w-full border-dorado/30 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">
            Certificado válido
          </p>
          <p className="mt-6 font-display text-2xl text-crema">{alumno}</p>
          <p className="mt-2 text-sm text-crema/60">completó el curso</p>
          <p className="mt-1 font-display text-lg text-dorado">{curso}</p>
          <p className="mt-6 text-xs text-crema/50">Emitido el {fecha}</p>
          <p className="mt-4 border-t border-white/10 pt-4 font-mono text-sm tracking-wider text-crema/70">
            {codigo}
          </p>
        </Card>
      ) : (
        <Card className="w-full text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-red-300">
            Certificado no encontrado
          </p>
          <p className="mt-4 text-sm text-crema/60">
            No encontramos ningún certificado con el código{" "}
            <span className="font-mono text-crema">{codigo || "—"}</span>. Revisá
            que esté bien escrito.
          </p>
        </Card>
      )}
    </main>
  );
}
