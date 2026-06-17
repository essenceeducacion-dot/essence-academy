"use server";

import { revalidatePath } from "next/cache";
import { createClienteServidor } from "@/lib/supabase/server";
import { requerirSesion } from "@/lib/auth/guards";
import type { EstadoFormulario } from "@/lib/validations/auth";

const RUTA = "/perfil";

export async function actualizarPerfil(
  _prev: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const perfil = await requerirSesion();

  const nombre = String(formData.get("nombre") ?? "").trim();
  if (nombre.length < 2) return { error: "El nombre debe tener al menos 2 caracteres." };
  if (nombre.length > 60) return { error: "El nombre es demasiado largo." };

  const supabase = createClienteServidor();
  const { error } = await supabase
    .from("perfiles")
    .update({ nombre })
    .eq("id", perfil.id);

  if (error) return { error: "No pudimos guardar los cambios. Intentá de nuevo." };

  revalidatePath(RUTA);
  return { ok: "Perfil actualizado." };
}
