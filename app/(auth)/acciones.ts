"use server";

import { redirect } from "next/navigation";
import { createClienteServidor } from "@/lib/supabase/server";
import { createClienteAdmin } from "@/lib/supabase/admin";
import { esStaff } from "@/lib/auth/guards";
import { env } from "@/lib/env";
import {
  esquemaLogin,
  esquemaRegistro,
  esquemaRecuperar,
  esquemaCambiarPassword,
  type EstadoFormulario,
} from "@/lib/validations/auth";

// Devuelve el primer mensaje de error de un parseo Zod fallido.
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

export async function iniciarSesion(
  _prev: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const datos = esquemaLogin.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!datos.success) return { error: primerError(datos.error) };

  const supabase = createClienteServidor();
  const { error } = await supabase.auth.signInWithPassword(datos.data);
  if (error) return { error: "Email o contraseña incorrectos." };

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .single();

  redirect(perfil && esStaff(perfil.rol) ? "/panel" : "/inicio");
}

export async function registrarse(
  _prev: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const datos = esquemaRegistro.safeParse({
    nombre: formData.get("nombre"),
    email: formData.get("email"),
    password: formData.get("password"),
    codigo: formData.get("codigo"),
  });
  if (!datos.success) return { error: primerError(datos.error) };

  const { nombre, email, password, codigo } = datos.data;
  const admin = createClienteAdmin();

  // Validar el código ANTES de crear el usuario (evita usuarios huérfanos).
  const { data: cod } = await admin
    .from("codigos_invitacion")
    .select("activo, expira_en, usos_maximos, usos_actuales")
    .eq("codigo", codigo)
    .maybeSingle();

  if (!cod || !cod.activo) return { error: "El código no es válido." };
  if (cod.expira_en && new Date(cod.expira_en) < new Date())
    return { error: "El código ya expiró." };
  if (cod.usos_maximos !== null && cod.usos_actuales >= cod.usos_maximos)
    return { error: "El código alcanzó su máximo de usos." };

  // Crear el usuario con email ya confirmado (sin fricción de verificación).
  const { error: errorAlta } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre },
  });
  if (errorAlta) {
    const ya = errorAlta.message.toLowerCase().includes("already");
    return {
      error: ya
        ? "Ya existe una cuenta con ese email."
        : "No pudimos crear la cuenta. Intentá de nuevo.",
    };
  }

  // Iniciar sesión y canjear el código (ajusta rol e inscribe si corresponde).
  const supabase = createClienteServidor();
  const { error: errorLogin } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (errorLogin)
    return { error: "Cuenta creada, pero no pudimos iniciar sesión. Probá entrar." };

  const { error: errorCanje } = await supabase.rpc(
    "canjear_codigo_invitacion",
    { p_codigo: codigo }
  );
  if (errorCanje)
    return { error: "Tu cuenta se creó, pero el código falló. Avisá al equipo." };

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .single();

  redirect(perfil && esStaff(perfil.rol) ? "/panel" : "/inicio");
}

export async function recuperarPassword(
  _prev: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const datos = esquemaRecuperar.safeParse({ email: formData.get("email") });
  if (!datos.success) return { error: primerError(datos.error) };

  const supabase = createClienteServidor();
  await supabase.auth.resetPasswordForEmail(datos.data.email, {
    redirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/recuperar/cambiar`,
  });

  // No revelamos si el email existe o no.
  return {
    ok: "Si el email está registrado, te enviamos un enlace para recuperar tu contraseña.",
  };
}

export async function cambiarPassword(
  _prev: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const datos = esquemaCambiarPassword.safeParse({
    password: formData.get("password"),
    confirmar: formData.get("confirmar"),
  });
  if (!datos.success) return { error: primerError(datos.error) };

  const supabase = createClienteServidor();
  const { error } = await supabase.auth.updateUser({
    password: datos.data.password,
  });
  if (error)
    return { error: "No pudimos actualizar la contraseña. Pedí un enlace nuevo." };

  return { ok: "¡Listo! Tu contraseña se actualizó. Ya podés iniciar sesión." };
}

export async function cerrarSesion(): Promise<void> {
  const supabase = createClienteServidor();
  await supabase.auth.signOut();
  redirect("/login");
}
