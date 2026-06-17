"use server";

import { revalidatePath } from "next/cache";
import { createClienteServidor } from "@/lib/supabase/server";
import { requerirSesion } from "@/lib/auth/guards";
import { flags } from "@/lib/env";
import type { EstadoFormulario } from "@/lib/validations/auth";

const RUTA = "/comunidad";

export async function crearPublicacion(
  _prev: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  if (!flags.comunidad) return { error: "La comunidad no está habilitada." };
  const perfil = await requerirSesion();

  const contenido = String(formData.get("contenido") ?? "").trim();
  if (contenido.length < 2) return { error: "Escribí algo para publicar." };
  if (contenido.length > 5000) return { error: "La publicación es muy larga." };

  const supabase = createClienteServidor();
  const { error } = await supabase.from("publicaciones_comunidad").insert({
    autor_id: perfil.id,
    contenido,
  });
  if (error) return { error: "No pudimos publicar. Intentá de nuevo." };

  revalidatePath(RUTA);
  return { ok: "Publicado." };
}

export async function eliminarPublicacion(formData: FormData): Promise<void> {
  await requerirSesion();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // RLS permite borrar solo al autor o a staff.
  const supabase = createClienteServidor();
  await supabase.from("publicaciones_comunidad").delete().eq("id", id);
  revalidatePath(RUTA);
}

export async function crearComentario(
  _prev: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  if (!flags.comunidad) return { error: "La comunidad no está habilitada." };
  const perfil = await requerirSesion();

  const publicacionId = String(formData.get("publicacion_id") ?? "");
  const contenido = String(formData.get("contenido") ?? "").trim();
  if (!publicacionId) return { error: "Falta la publicación." };
  if (contenido.length < 1) return { error: "Escribí un comentario." };
  if (contenido.length > 2000) return { error: "El comentario es muy largo." };

  const supabase = createClienteServidor();
  const { error } = await supabase.from("comentarios").insert({
    autor_id: perfil.id,
    publicacion_id: publicacionId,
    contenido,
  });
  if (error) return { error: "No pudimos comentar. Intentá de nuevo." };

  revalidatePath(RUTA);
  return { ok: "Comentario agregado." };
}

export async function eliminarComentario(formData: FormData): Promise<void> {
  await requerirSesion();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = createClienteServidor();
  await supabase.from("comentarios").delete().eq("id", id);
  revalidatePath(RUTA);
}

// Alterna el "me gusta" del usuario sobre una publicación.
export async function alternarReaccion(formData: FormData): Promise<void> {
  if (!flags.comunidad) return;
  const perfil = await requerirSesion();

  const publicacionId = String(formData.get("publicacion_id") ?? "");
  if (!publicacionId) return;

  const supabase = createClienteServidor();
  const { data: existente } = await supabase
    .from("reacciones")
    .select("id")
    .eq("usuario_id", perfil.id)
    .eq("publicacion_id", publicacionId)
    .maybeSingle();

  if (existente) {
    await supabase.from("reacciones").delete().eq("id", existente.id);
  } else {
    await supabase.from("reacciones").insert({
      usuario_id: perfil.id,
      publicacion_id: publicacionId,
    });
  }

  revalidatePath(RUTA);
}
