"use client";

export function BotonImprimir() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg border border-white/15 px-4 py-2 text-sm text-crema/70 transition-colors hover:bg-white/5 hover:text-crema print:hidden"
    >
      Imprimir o guardar PDF
    </button>
  );
}
