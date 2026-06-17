import { redirect } from "next/navigation";
import { requerirSesion, esStaff } from "@/lib/auth/guards";
import { createClienteServidor } from "@/lib/supabase/server";
import { createClienteAdmin } from "@/lib/supabase/admin";
import { flags } from "@/lib/env";
import { Card } from "@/components/ui/Card";
import { FormularioPublicacion } from "./_componentes/FormularioPublicacion";
import { FormularioComentario } from "./_componentes/FormularioComentario";
import {
  eliminarPublicacion,
  eliminarComentario,
  alternarReaccion,
} from "./acciones";

function fecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function Comunidad() {
  if (!flags.comunidad) redirect("/inicio");
  const perfil = await requerirSesion();
  const staff = esStaff(perfil.rol);
  const supabase = createClienteServidor();

  const { data: publicaciones } = await supabase
    .from("publicaciones_comunidad")
    .select("id, autor_id, contenido, fijada, created_at")
    .order("fijada", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  const lista = publicaciones ?? [];
  const pubIds = lista.map((p) => p.id);

  const [{ data: comentarios }, { data: reacciones }] = await Promise.all([
    pubIds.length
      ? supabase
          .from("comentarios")
          .select("id, autor_id, publicacion_id, contenido, created_at")
          .in("publicacion_id", pubIds)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] as { id: string; autor_id: string; publicacion_id: string | null; contenido: string; created_at: string }[] }),
    pubIds.length
      ? supabase
          .from("reacciones")
          .select("id, usuario_id, publicacion_id")
          .in("publicacion_id", pubIds)
      : Promise.resolve({ data: [] as { id: string; usuario_id: string; publicacion_id: string | null }[] }),
  ]);

  const listaComentarios = comentarios ?? [];
  const listaReacciones = reacciones ?? [];

  // Nombres de autores: se resuelven con el cliente admin porque la RLS de
  // perfiles solo deja ver el propio. Solo se expone nombre/avatar (info de
  // presentación), nunca email ni rol.
  const autorIds = Array.from(
    new Set([
      ...lista.map((p) => p.autor_id),
      ...listaComentarios.map((c) => c.autor_id),
    ])
  );
  const nombrePorId = new Map<string, string>();
  if (autorIds.length) {
    const admin = createClienteAdmin();
    const { data: autores } = await admin
      .from("perfiles")
      .select("id, nombre")
      .in("id", autorIds);
    for (const a of autores ?? [])
      nombrePorId.set(a.id, a.nombre || "Miembro de la comunidad");
  }

  const comentariosPorPub = new Map<string, typeof listaComentarios>();
  for (const c of listaComentarios) {
    if (!c.publicacion_id) continue;
    const arr = comentariosPorPub.get(c.publicacion_id) ?? [];
    arr.push(c);
    comentariosPorPub.set(c.publicacion_id, arr);
  }

  const reaccionesPorPub = new Map<string, { total: number; mia: boolean }>();
  for (const r of listaReacciones) {
    if (!r.publicacion_id) continue;
    const cur = reaccionesPorPub.get(r.publicacion_id) ?? { total: 0, mia: false };
    cur.total += 1;
    if (r.usuario_id === perfil.id) cur.mia = true;
    reaccionesPorPub.set(r.publicacion_id, cur);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl text-crema">Comunidad</h1>
        <p className="mt-1 text-sm text-crema/50">
          Compartí tu proceso, hacé preguntas y sumá a otros.
        </p>
      </div>

      <Card>
        <FormularioPublicacion />
      </Card>

      {lista.length === 0 ? (
        <Card>
          <p className="text-sm text-crema/50">
            Todavía no hay publicaciones. ¡Sé el primero!
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {lista.map((pub) => {
            const coments = comentariosPorPub.get(pub.id) ?? [];
            const reac = reaccionesPorPub.get(pub.id) ?? { total: 0, mia: false };
            const puedeBorrarPub = staff || pub.autor_id === perfil.id;
            return (
              <Card key={pub.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-crema">
                      {nombrePorId.get(pub.autor_id) ?? "Miembro"}
                      {pub.fijada && (
                        <span className="ml-2 rounded-full bg-dorado/15 px-2 py-0.5 text-xs text-dorado">
                          Fijada
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-crema/40">{fecha(pub.created_at)}</p>
                  </div>
                  {puedeBorrarPub && (
                    <form action={eliminarPublicacion}>
                      <input type="hidden" name="id" value={pub.id} />
                      <button
                        type="submit"
                        aria-label="Eliminar publicación"
                        className="rounded px-2 py-1 text-red-300/70 hover:bg-red-500/10 hover:text-red-300"
                      >
                        ✕
                      </button>
                    </form>
                  )}
                </div>

                <p className="mt-2 whitespace-pre-wrap text-sm text-crema/90">
                  {pub.contenido}
                </p>

                <div className="mt-3 flex items-center gap-3 border-t border-white/10 pt-3">
                  <form action={alternarReaccion}>
                    <input type="hidden" name="publicacion_id" value={pub.id} />
                    <button
                      type="submit"
                      className={
                        reac.mia
                          ? "rounded-lg bg-dorado/15 px-2.5 py-1 text-xs text-dorado"
                          : "rounded-lg px-2.5 py-1 text-xs text-crema/60 hover:bg-white/5 hover:text-crema"
                      }
                    >
                      Me gusta {reac.total > 0 && `· ${reac.total}`}
                    </button>
                  </form>
                  <span className="text-xs text-crema/40">
                    {coments.length} {coments.length === 1 ? "comentario" : "comentarios"}
                  </span>
                </div>

                {coments.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {coments.map((c) => {
                      const puedeBorrarCom = staff || c.autor_id === perfil.id;
                      return (
                        <li
                          key={c.id}
                          className="flex items-start justify-between gap-2 rounded-lg bg-marino-700/40 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="text-xs text-crema/60">
                              {nombrePorId.get(c.autor_id) ?? "Miembro"} ·{" "}
                              {fecha(c.created_at)}
                            </p>
                            <p className="whitespace-pre-wrap text-sm text-crema/90">
                              {c.contenido}
                            </p>
                          </div>
                          {puedeBorrarCom && (
                            <form action={eliminarComentario}>
                              <input type="hidden" name="id" value={c.id} />
                              <button
                                type="submit"
                                aria-label="Eliminar comentario"
                                className="rounded px-1.5 py-0.5 text-xs text-red-300/70 hover:bg-red-500/10 hover:text-red-300"
                              >
                                ✕
                              </button>
                            </form>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}

                <FormularioComentario publicacionId={pub.id} />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
