import Link from "next/link";
import { notFound } from "next/navigation";
import { requerirSesion, esStaff } from "@/lib/auth/guards";
import { createClienteServidor } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { urlEmbedVideo } from "@/lib/utils";
import { alternarCompletada } from "./acciones";

type Recurso = {
  id: string;
  tipo: "video" | "pdf" | "imagen" | "texto";
  titulo: string;
  tipo_fuente: "upload" | "embed" | null;
  proveedor_embed: "youtube" | "vimeo" | null;
  url_archivo: string | null;
  contenido_texto: string | null;
};

// Genera una URL firmada para un archivo de bucket privado.
async function firmar(
  supabase: ReturnType<typeof createClienteServidor>,
  bucket: "videos" | "materiales",
  path: string
): Promise<string | null> {
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export default async function LeccionAlumno({
  params,
}: {
  params: { slug: string; leccionId: string };
}) {
  const perfil = await requerirSesion();
  const supabase = createClienteServidor();

  const { data: curso } = await supabase
    .from("cursos")
    .select("id, titulo, slug")
    .eq("slug", params.slug)
    .maybeSingle();
  if (!curso) notFound();

  // La RLS ya gatea por inscripción + publicada; igual validamos pertenencia.
  const { data: leccion } = await supabase
    .from("lecciones")
    .select("id, titulo, descripcion, etapa_id, etapa:etapas(curso_id)")
    .eq("id", params.leccionId)
    .maybeSingle();

  const etapaCursoId = (leccion?.etapa as unknown as { curso_id: string } | null)
    ?.curso_id;
  if (!leccion || etapaCursoId !== curso.id) notFound();

  const [{ data: recursos }, { data: prog }, { data: hermanas }] =
    await Promise.all([
      supabase
        .from("recursos")
        .select(
          "id, tipo, titulo, tipo_fuente, proveedor_embed, url_archivo, contenido_texto"
        )
        .eq("leccion_id", leccion.id)
        .order("orden", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("progreso_lecciones")
        .select("completada")
        .eq("alumno_id", perfil.id)
        .eq("leccion_id", leccion.id)
        .maybeSingle(),
      supabase
        .from("lecciones")
        .select("id")
        .eq("etapa_id", leccion.etapa_id)
        .order("orden", { ascending: true })
        .order("created_at", { ascending: true }),
    ]);

  const listaRecursos = (recursos ?? []) as Recurso[];
  const completada = prog?.completada ?? false;

  // Firmar las URLs de archivos subidos (buckets privados).
  const recursosListos = await Promise.all(
    listaRecursos.map(async (r) => {
      let fuente: string | null = null;
      if (r.url_archivo) {
        if (r.tipo === "pdf" || r.tipo === "imagen") {
          fuente = await firmar(supabase, "materiales", r.url_archivo);
        } else if (r.tipo === "video" && r.tipo_fuente === "upload") {
          fuente = await firmar(supabase, "videos", r.url_archivo);
        }
      }
      return { ...r, fuente };
    })
  );

  // Navegación prev/next dentro de la etapa.
  const ids = (hermanas ?? []).map((l) => l.id);
  const pos = ids.indexOf(leccion.id);
  const idAnterior = pos > 0 ? ids[pos - 1] : null;
  const idSiguiente = pos >= 0 && pos < ids.length - 1 ? ids[pos + 1] : null;
  const base = `/cursos/${curso.slug}`;
  const staff = esStaff(perfil.rol);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href={base} className="text-sm text-crema/50 hover:text-crema">
          ← {curso.titulo}
        </Link>
        <h1 className="mt-2 text-2xl text-crema">{leccion.titulo}</h1>
        {leccion.descripcion && (
          <p className="mt-1 text-sm text-crema/60">{leccion.descripcion}</p>
        )}
      </div>

      {recursosListos.length === 0 ? (
        <Card>
          <p className="text-sm text-crema/50">
            Esta lección todavía no tiene recursos cargados.
          </p>
        </Card>
      ) : (
        <div className="space-y-5">
          {recursosListos.map((r) => (
            <RecursoVista key={r.id} recurso={r} />
          ))}
        </div>
      )}

      {!staff && (
        <Card>
          <form action={alternarCompletada} className="flex items-center justify-between gap-3">
            <input type="hidden" name="leccion_id" value={leccion.id} />
            <input type="hidden" name="slug" value={curso.slug} />
            <input type="hidden" name="completada" value={(!completada).toString()} />
            <span className="text-sm text-crema/70">
              {completada
                ? "Marcaste esta lección como completada."
                : "¿Terminaste esta lección?"}
            </span>
            <button
              type="submit"
              className={
                completada
                  ? "rounded-lg border border-white/20 px-3 py-2 text-sm text-crema/70 hover:bg-white/5"
                  : "rounded-lg bg-dorado px-3 py-2 text-sm text-marino-900 hover:bg-dorado/90"
              }
            >
              {completada ? "Desmarcar" : "Marcar como completada"}
            </button>
          </form>
        </Card>
      )}

      <div className="flex items-center justify-between border-t border-white/10 pt-4">
        {idAnterior ? (
          <Link
            href={`${base}/lecciones/${idAnterior}`}
            className="text-sm text-crema/70 hover:text-crema"
          >
            ← Anterior
          </Link>
        ) : (
          <span />
        )}
        {idSiguiente ? (
          <Link
            href={`${base}/lecciones/${idSiguiente}`}
            className="text-sm text-crema/70 hover:text-crema"
          >
            Siguiente →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}

function RecursoVista({
  recurso,
}: {
  recurso: Recurso & { fuente: string | null };
}) {
  return (
    <Card>
      <h2 className="mb-3 text-base text-crema">{recurso.titulo}</h2>

      {recurso.tipo === "video" && recurso.tipo_fuente === "embed" && (
        <Embed recurso={recurso} />
      )}

      {recurso.tipo === "video" &&
        recurso.tipo_fuente === "upload" &&
        recurso.fuente && (
          <video
            controls
            controlsList="nodownload"
            className="aspect-video w-full rounded-lg bg-black"
            src={recurso.fuente}
          />
        )}

      {recurso.tipo === "imagen" && recurso.fuente && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={recurso.fuente}
          alt={recurso.titulo}
          className="w-full rounded-lg"
        />
      )}

      {recurso.tipo === "pdf" && recurso.fuente && (
        <a
          href={recurso.fuente}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-lg bg-dorado/90 px-3 py-2 text-sm text-marino-900 hover:bg-dorado"
        >
          Abrir PDF
        </a>
      )}

      {recurso.tipo === "texto" && recurso.contenido_texto && (
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-crema/80">
          {recurso.contenido_texto}
        </div>
      )}
    </Card>
  );
}

function Embed({ recurso }: { recurso: Recurso }) {
  const src = urlEmbedVideo(recurso.proveedor_embed, recurso.url_archivo);
  if (!src) {
    return (
      <p className="text-sm text-crema/50">No se pudo cargar el video.</p>
    );
  }
  return (
    <iframe
      src={src}
      title={recurso.titulo}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className="aspect-video w-full rounded-lg"
    />
  );
}
