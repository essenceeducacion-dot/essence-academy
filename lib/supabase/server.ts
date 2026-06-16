// Cliente de Supabase para Server Components, Server Actions y route handlers.
// Lee/escribe la sesión vía cookies.
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

type CookieParaSetear = { name: string; value: string; options: CookieOptions };

export function createClienteServidor() {
  const cookieStore = cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieParaSetear[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // En Server Components no se pueden escribir cookies; el refresco
            // de sesión lo maneja el middleware. Ignorar acá es correcto.
          }
        },
      },
    }
  );
}
