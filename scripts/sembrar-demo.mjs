// Siembra de demo para Essence Academy.
// Crea cuentas de prueba (admin/educador/alumno), contenido navegable y la
// inscripción del alumno. Idempotente: se puede correr varias veces.
//
// Uso:  node scripts/sembrar-demo.mjs           (siembra)
//       node scripts/sembrar-demo.mjs --probe   (solo reporta estado)
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// Cargar .env.local manualmente (sin dependencias).
const env = {};
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const db = createClient(url, serviceKey, { auth: { persistSession: false } });
const soloProbe = process.argv.includes("--probe");

async function probe() {
  const tablas = ["cursos", "etapas", "lecciones", "recursos", "quizzes", "inscripciones", "certificados"];
  console.log("== Estado de la base ==");
  for (const t of tablas) {
    const { count, error } = await db.from(t).select("*", { count: "exact", head: true });
    console.log(`  ${t.padEnd(14)}: ${error ? "ERROR " + error.message : count}`);
  }
  const { data: users, error: ue } = await db.auth.admin.listUsers({ perPage: 100 });
  if (ue) console.log("  usuarios     : ERROR " + ue.message);
  else console.log(`  usuarios auth : ${users.users.length}  [${users.users.map((u) => u.email).join(", ")}]`);
}

const CUENTAS = [
  { email: "admin@essence.test",    password: "Essence2026!", nombre: "Admin Demo",    rol: "admin" },
  { email: "educador@essence.test", password: "Essence2026!", nombre: "Educador Demo", rol: "educador" },
  { email: "alumno@essence.test",   password: "Essence2026!", nombre: "Alumno Demo",   rol: "alumno" },
];

async function buscarUsuarioPorEmail(email) {
  const { data } = await db.auth.admin.listUsers({ perPage: 200 });
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

async function crearCuentas() {
  const ids = {};
  for (const c of CUENTAS) {
    let user = await buscarUsuarioPorEmail(c.email);
    if (!user) {
      const { data, error } = await db.auth.admin.createUser({
        email: c.email,
        password: c.password,
        email_confirm: true,
        user_metadata: { nombre: c.nombre },
      });
      if (error) throw new Error(`crear ${c.email}: ${error.message}`);
      user = data.user;
      console.log(`  + cuenta creada: ${c.email}`);
    } else {
      // Asegurar contraseña/confirmación conocidas.
      await db.auth.admin.updateUserById(user.id, { password: c.password, email_confirm: true });
      console.log(`  = cuenta ya existía: ${c.email}`);
    }
    // El trigger crea el perfil; fijamos rol/nombre/activo.
    await db.from("perfiles").update({ rol: c.rol, nombre: c.nombre, activo: true }).eq("id", user.id);
    ids[c.rol] = user.id;
  }
  return ids;
}

async function sembrarContenido(ids) {
  // El curso insignia ya viene del seed.sql.
  const { data: curso } = await db.from("cursos").select("id, slug").eq("slug", "programa-0-a-100").maybeSingle();
  if (!curso) throw new Error("No existe el curso programa-0-a-100. ¿Corriste seed.sql?");

  const { data: etapas } = await db.from("etapas").select("id, nombre, orden").eq("curso_id", curso.id).order("orden");
  const origen = (etapas ?? []).find((e) => e.nombre === "Origen") ?? etapas?.[0];
  if (!origen) throw new Error("El curso no tiene etapas.");

  // Lecciones demo en la etapa Origen (idempotente por título).
  const leccionesDemo = [
    { titulo: "Bienvenida al programa", descripcion: "Qué vas a aprender y cómo aprovecharlo.", orden: 0 },
    { titulo: "Herramientas del oficio", descripcion: "Tijeras, máquinas y mantenimiento.", orden: 1 },
  ];
  const leccionIds = [];
  for (const l of leccionesDemo) {
    let { data: lec } = await db.from("lecciones").select("id").eq("etapa_id", origen.id).eq("titulo", l.titulo).maybeSingle();
    if (!lec) {
      const { data, error } = await db.from("lecciones").insert({ etapa_id: origen.id, publicada: true, ...l }).select("id").single();
      if (error) throw new Error(`leccion ${l.titulo}: ${error.message}`);
      lec = data;
      console.log(`  + lección: ${l.titulo}`);
    } else {
      await db.from("lecciones").update({ publicada: true }).eq("id", lec.id);
    }
    leccionIds.push(lec.id);
  }

  // Un recurso de texto y uno de video embed en la primera lección.
  const recursosDemo = [
    { tipo: "texto", titulo: "Lo que vas a lograr", contenido_texto: "En este programa pasás de cero a barbero con criterio propio. Tomate tu tiempo con cada lección.", orden: 0 },
    { tipo: "video", tipo_fuente: "embed", proveedor_embed: "youtube", titulo: "Video de bienvenida", url_archivo: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", orden: 1 },
  ];
  for (const r of recursosDemo) {
    const { data: ex } = await db.from("recursos").select("id").eq("leccion_id", leccionIds[0]).eq("titulo", r.titulo).maybeSingle();
    if (!ex) {
      const { error } = await db.from("recursos").insert({ leccion_id: leccionIds[0], ...r });
      if (error) throw new Error(`recurso ${r.titulo}: ${error.message}`);
      console.log(`  + recurso: ${r.titulo}`);
    }
  }

  // Quiz simple en la segunda lección.
  let { data: quiz } = await db.from("quizzes").select("id").eq("leccion_id", leccionIds[1]).maybeSingle();
  if (!quiz) {
    const { data, error } = await db.from("quizzes").insert({ leccion_id: leccionIds[1], titulo: "Repaso de herramientas", puntaje_minimo_aprobar: 50 }).select("id").single();
    if (error) throw new Error(`quiz: ${error.message}`);
    quiz = data;
    const { data: preg } = await db.from("preguntas_quiz").insert({ quiz_id: quiz.id, enunciado: "¿Qué herramienta usás para perfilar?", tipo: "opcion_unica", orden: 0 }).select("id").single();
    await db.from("opciones_pregunta").insert([
      { pregunta_id: preg.id, texto: "Trimmer / perfiladora", es_correcta: true, orden: 0 },
      { pregunta_id: preg.id, texto: "Secador", es_correcta: false, orden: 1 },
    ]);
    console.log("  + quiz con 1 pregunta");
  }

  // Inscribir al alumno demo.
  await db.from("inscripciones").upsert(
    { alumno_id: ids.alumno, curso_id: curso.id, estado: "activa", inscripto_por: ids.admin },
    { onConflict: "alumno_id,curso_id" }
  );
  console.log("  = alumno inscripto en el curso");

  // Código de invitación de demo (para probar el registro).
  const { data: codEx } = await db.from("codigos_invitacion").select("id").eq("codigo", "ESSENCE-DEMO").maybeSingle();
  if (!codEx) {
    await db.from("codigos_invitacion").insert({ codigo: "ESSENCE-DEMO", curso_id: curso.id, rol_destino: "alumno", activo: true, creado_por: ids.admin });
    console.log("  + código de invitación: ESSENCE-DEMO");
  }
}

async function main() {
  await probe();
  if (soloProbe) return;
  console.log("\n== Creando cuentas ==");
  const ids = await crearCuentas();
  console.log("\n== Sembrando contenido ==");
  await sembrarContenido(ids);
  console.log("\n== Estado final ==");
  await probe();
  console.log("\nListo.");
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
