"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { recuperarPassword } from "../acciones";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";

export default function RecuperarPage() {
  const [estado, accion] = useFormState(recuperarPassword, null);

  return (
    <Card>
      <h1 className="text-xl font-display text-crema">Recuperá tu contraseña</h1>
      <p className="mt-1 text-sm text-crema/50">
        Te mandamos un enlace para crear una nueva.
      </p>

      <form action={accion} className="mt-6 space-y-4">
        {estado?.error && <Alert tono="error">{estado.error}</Alert>}
        {estado?.ok && <Alert tono="exito">{estado.ok}</Alert>}
        <Input
          id="email"
          name="email"
          type="email"
          etiqueta="Email"
          placeholder="vos@email.com"
          autoComplete="email"
          required
        />
        <SubmitButton>Enviar enlace</SubmitButton>
      </form>

      <p className="mt-5 text-center text-sm text-crema/50">
        <Link href="/login" className="text-dorado hover:underline">
          Volver al inicio de sesión
        </Link>
      </p>
    </Card>
  );
}
