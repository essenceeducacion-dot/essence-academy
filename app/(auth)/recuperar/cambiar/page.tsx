"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { cambiarPassword } from "../../acciones";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";

export default function CambiarPasswordPage() {
  const [estado, accion] = useFormState(cambiarPassword, null);

  return (
    <Card>
      <h1 className="text-xl font-display text-crema">Nueva contraseña</h1>
      <p className="mt-1 text-sm text-crema/50">Elegí una contraseña nueva.</p>

      <form action={accion} className="mt-6 space-y-4">
        {estado?.error && <Alert tono="error">{estado.error}</Alert>}
        {estado?.ok && <Alert tono="exito">{estado.ok}</Alert>}
        <Input
          id="password"
          name="password"
          type="password"
          etiqueta="Contraseña nueva"
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          required
        />
        <Input
          id="confirmar"
          name="confirmar"
          type="password"
          etiqueta="Repetí la contraseña"
          autoComplete="new-password"
          required
        />
        <SubmitButton>Guardar contraseña</SubmitButton>
      </form>

      {estado?.ok && (
        <p className="mt-5 text-center text-sm text-crema/50">
          <Link href="/login" className="text-dorado hover:underline">
            Ir a iniciar sesión
          </Link>
        </p>
      )}
    </Card>
  );
}
