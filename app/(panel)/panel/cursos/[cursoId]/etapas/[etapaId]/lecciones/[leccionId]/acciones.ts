"use server";

import { revalidatePath } from "next/cache";
import { createClienteServidor } from "@/lib/supabase/server";
import { requerirStaff } from "@/lib/auth/guards";
import { esquemaRecurso } from "@/lib/validations/recursos";
import { slugify } from "@/lib/utils";
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

const MAX_BYTES = 200 * 1024 * 1024; // 200 MB

// Sube un archivo al bucket indicado y devuelve su path; null si falla.
async function subirArchivo(
  bucket: "videos" | "materiales",
  cursoId: string,
  leccionId: string,
  archivo: File
): Promise<string | null> {
  const supabase = createClienteServidor();
  const ext = archivo.name.includes(".")
    ? archivo.name.slice(archivo.name.lastIndexOf(".") + 1).toLowerCase()
    : "bin";
  const nombreBase = slugify(archivo.name.replace(/\.[^.]+$/, "")) || "archivo";
  const path = `${cursoId}/${leccionId}/${Date.now()}-${nombreBase}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, archivo, { contentType: archivo.type || undefined, upsert: false });
  if (error) return null;
  return path;
}

export async function crearRecurso(
  _prev: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  await requerirStaff();

  const cursoId = String(formData.get("curso_id") ?? "");
  const etapaId = String(formData.get("etapa_id") ?? "");
  const leccionId = String(formData.get("leccion_id") ?? "");
  if (!cursoId || !etapaId || !leccionId)
    return { error: "Faltan datos de la lección." };

  const datos = esquemaRecurso.safeParse({
    tipo: formData.get("tipo"),
    titulo: formData.get("titulo"),
    tipo_fuente: formData.get("tipo_fuente") || undefined,
    proveedor_embed: formData.get("proveedor_embed") || undefined,
    url: formData.get("url"),
    contenido_texto: formData.get("contenido_texto"),
  });
  if (!datos.success) return { error: primerError(datos.error) };

  const { tipo, titulo, tipo_fuente, proveedor_embed, url, contenido_texto } =
    datos.data;

  let urlArchivo: string | null = null;
  let fuente: string | null = null;
  let proveedor: string | null = null;
  let texto: string | null = null;

  if (tipo === "texto") {
    texto = contenido_texto ?? null;
  } else if (tipo === "video" && tipo_fuente === "embed") {
    fuente = "embed";
    proveedor = proveedor_embed ?? null;
    urlArchivo = url ?? null;
  } else {
    // Subida de archivo: video (bucket videos) o pdf/imagen (bucket materiales).
    const archivo = formData.get("archivo");
    if (!(archivo instanceof File) || archivo.size === 0)
      return { error: "Adjuntá un archivo." };
    if (archivo.size > MAX_BYTES)
      return { error: "El archivo supera el límite de 200 MB." };

    const bucket = tipo === "video" ? "videos" : "materiales";
    const path = await subirArchivo(bucket, cursoId, leccionId, archivo);
    if (!path) return { error: "No pudimos subir el archivo. Intentá de nuevo." };

    urlArchivo = path;
    if (tipo === "video") fuente = "upload";
  }

  const supabase = createClienteServidor();
  const { data: ultimo } = await supabase
    .from("recursos")
    .select("orden")
    .eq("leccion_id", leccionId)
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("recursos").insert({
    leccion_id: leccionId,
    tipo,
    titulo,
    tipo_fuente: fuente,
    proveedor_embed: proveedor,
    url_archivo: urlArchivo,
    contenido_texto: texto,
    orden: (ultimo?.orden ?? -1) + 1,
  });
  if (error) return { error: "No pudimos guardar el recurso. Intentá de nuevo." };

  revalidatePath(rutaLeccion(cursoId, etapaId, leccionId));
  return { ok: "Recurso agregado." };
}

export async function eliminarRecurso(formData: FormData): Promise<void> {
  await requerirStaff();

  const id = String(formData.get("id") ?? "");
  const cursoId = String(formData.get("curso_id") ?? "");
  const etapaId = String(formData.get("etapa_id") ?? "");
  const leccionId = String(formData.get("leccion_id") ?? "");
  if (!id || !cursoId || !etapaId || !leccionId) return;

  const supabase = createClienteServidor();

  // Si era un archivo subido, lo borramos del Storage.
  const { data: recurso } = await supabase
    .from("recursos")
    .select("tipo, tipo_fuente, url_archivo")
    .eq("id", id)
    .maybeSingle();

  if (recurso?.url_archivo) {
    const esUpload =
      recurso.tipo === "pdf" ||
      recurso.tipo === "imagen" ||
      (recurso.tipo === "video" && recurso.tipo_fuente === "upload");
    if (esUpload) {
      const bucket = recurso.tipo === "video" ? "videos" : "materiales";
      await supabase.storage.from(bucket).remove([recurso.url_archivo]);
    }
  }

  await supabase.from("recursos").delete().eq("id", id);
  revalidatePath(rutaLeccion(cursoId, etapaId, leccionId));
}

// Reordena un recurso intercambiando su orden con el vecino (subir/bajar).
export async function moverRecurso(formData: FormData): Promise<void> {
  await requerirStaff();

  const id = String(formData.get("id") ?? "");
  const cursoId = String(formData.get("curso_id") ?? "");
  const etapaId = String(formData.get("etapa_id") ?? "");
  const leccionId = String(formData.get("leccion_id") ?? "");
  const direccion = String(formData.get("direccion") ?? "");
  if (
    !id ||
    !cursoId ||
    !etapaId ||
    !leccionId ||
    (direccion !== "subir" && direccion !== "bajar")
  )
    return;

  const supabase = createClienteServidor();
  const { data: recursos } = await supabase
    .from("recursos")
    .select("id, orden")
    .eq("leccion_id", leccionId)
    .order("orden", { ascending: true })
    .order("created_at", { ascending: true });
  if (!recursos) return;

  const i = recursos.findIndex((r) => r.id === id);
  if (i === -1) return;
  const j = direccion === "subir" ? i - 1 : i + 1;
  if (j < 0 || j >= recursos.length) return;

  const a = recursos[i];
  const b = recursos[j];
  const ordenA = a.orden === b.orden ? j : b.orden;
  const ordenB = a.orden === b.orden ? i : a.orden;

  await supabase.from("recursos").update({ orden: ordenA }).eq("id", a.id);
  await supabase.from("recursos").update({ orden: ordenB }).eq("id", b.id);

  revalidatePath(rutaLeccion(cursoId, etapaId, leccionId));
}
