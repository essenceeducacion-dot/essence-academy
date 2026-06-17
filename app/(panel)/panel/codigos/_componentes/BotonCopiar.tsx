"use client";

import { useState } from "react";

export function BotonCopiar({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    await navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copiar}
      className="rounded px-2 py-1 text-xs text-crema/40 transition-colors hover:bg-white/5 hover:text-crema"
      title="Copiar código"
    >
      {copiado ? "Copiado" : "Copiar"}
    </button>
  );
}
