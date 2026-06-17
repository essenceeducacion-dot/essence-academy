import Link from "next/link";
import { Logo } from "@/components/marca/Logo";

export const metadata = {
  title: "Essence Academy — Formación profesional en barbería",
  description:
    "Aprendé barbería de nivel profesional con el programa 0 a 100 de Essence Academy. Rosario, Argentina.",
};

export default function Landing() {
  return (
    <main className="min-h-screen bg-marino flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Logo />
          <Link
            href="/login"
            className="rounded-lg border border-white/15 px-4 py-2 text-sm text-crema/70 transition-colors hover:bg-white/5 hover:text-crema"
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-dorado/80">
          Essence Academy
        </p>
        <h1 className="mt-6 max-w-2xl font-display text-4xl leading-tight text-crema sm:text-5xl">
          De cero a barbero profesional
        </h1>
        <p className="mt-5 max-w-xl text-base text-crema/60">
          El programa 0 a 100 te da las herramientas, el criterio y la visión
          de negocio para vivir del oficio. Aprendé a tu ritmo, con contenido
          real y feedback directo.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/registro"
            className="rounded-xl bg-dorado px-6 py-3 text-sm font-medium text-marino-900 transition-colors hover:bg-dorado/90"
          >
            Quiero entrar al programa
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-white/15 px-6 py-3 text-sm text-crema/70 transition-colors hover:bg-white/5 hover:text-crema"
          >
            Ya tengo cuenta
          </Link>
        </div>
      </section>

      {/* Tres pilares */}
      <section className="border-t border-white/10 py-16">
        <div className="mx-auto max-w-5xl px-4">
          <p className="mb-10 text-center text-xs uppercase tracking-[0.3em] text-crema/40">
            El programa
          </p>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                etapa: "Origen",
                descripcion:
                  "Fundamentos del oficio: herramientas, técnica base y postura profesional.",
              },
              {
                etapa: "Criterio",
                descripcion:
                  "Lectura del cliente, decisiones de estilo y ejecución con intención.",
              },
              {
                etapa: "Proyección",
                descripcion:
                  "Marca personal, gestión del negocio y cómo construir clientela.",
              },
            ].map((p) => (
              <div
                key={p.etapa}
                className="rounded-2xl border border-white/10 bg-marino-700/40 p-6"
              >
                <p className="text-xs uppercase tracking-widest text-dorado/70">
                  {p.etapa}
                </p>
                <p className="mt-3 text-sm text-crema/70">{p.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="border-t border-white/10 py-16 text-center">
        <p className="text-sm text-crema/60">
          Si ya tenés un código de acceso, registrate y empezá hoy.
        </p>
        <Link
          href="/registro"
          className="mt-4 inline-block rounded-xl bg-dorado px-6 py-3 text-sm font-medium text-marino-900 transition-colors hover:bg-dorado/90"
        >
          Registrarme con mi código
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-crema/30">
        Essence Academy · Rosario, Argentina
      </footer>
    </main>
  );
}
