"use server";

import { revalidatePath } from "next/cache";
import { createClienteServidor } from "@/lib/supabase/server";
import { requerirAdmin } from "@/lib/auth/guards";
import type { EstadoFormulario } from "@/lib/validations/auth";

const RUTA = "/panel/codigos";

export async function crearCodigo(
  _prev: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const perfil = await requerirAdmin();

  const codigo = String(formData.get("codigo") ?? "").trim().toUpperCase();
  if (codigo.length < 3) return { error: "El código debe tener al menos 3 caracteres." };
  if (!/^[A-Z0-9_-]+$/.test(codigo))
    return { error: "Solo letras mayúsculas, números, guiones y guión bajo." };

  const rolDestino = String(formData.get("rol_destino") ?? "alumno");
  if (!["alumno", "educador"].includes(rolDestino))
    return { error: "Rol inválido." };

  const cursoIdRaw = String(formData.get("curso_id") ?? "").trim();
  const cursoId = cursoIdRaw || null;

  const usosMaxRaw = String(formData.get("usos_maximos") ?? "").trim();
  const usosMaximos = usosMaxRaw ? parseInt(usosMaxRaw, 10) : null;
  if (usosMaximos !== null && (isNaN(usosMaximos) || usosMaximos < 1))
    return { error: "Usos máximos debe ser un número positivo." };

  const expiraRaw = String(formData.get("expira_en") ?? "").trim();
  const expiraEn = expiraRaw ? new Date(expiraRaw).toISOString() : null;
  if (expiraRaw && isNaN(Date.parse(expiraRaw)))
    return { error: "Fecha de expiración inválida." };

  const supabase = createClienteServidor();
  const { error } = await supabase.from("codigos_invitacion").insert({
    codigo,
    rol_destino: rolDestino,
    curso_id: cursoId,
    usos_maximos: usosMaximos,
    expira_en: expiraEn,
    activo: true,
    creado_por: perfil.id,
  });

  if (error) {
    if (error.code === "23505") return { error: "Ese código ya existe." };
    return { error: "No pudimos crear el código. Intentá de nuevo." };
  }

  revalidatePath(RUTA);
  return { ok: `Código "${codigo}" creado.` };
}

export async function toggleCodigo(formData: FormData): Promise<void> {
  await requerirAdmin();
  const id = String(formData.get("id") ?? "");
  const activo = formData.get("activo") === "true";
  if (!id) return;

  const supabase = createClienteServidor();
  await supabase.from("codigos_invitacion").update({ activo: !activo }).eq("id", id);
  revalidatePath(RUTA);
}

export async function eliminarCodigo(formData: FormData): Promise<void> {
  await requerirAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = createClienteServidor();
  await supabase.from("codigos_invitacion").delete().eq("id", id);
  revalidatePath(RUTA);
}
