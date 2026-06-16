"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { registrarse } from "../acciones";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";

export default function RegistroPage() {
  const [estado, accion] = useFormState(registrarse, null);

  return (
    <Card>
      <h1 className="text-xl font-display text-crema">Creá tu cuenta</h1>
      <p className="mt-1 text-sm text-crema/50">
        Necesitás un código de invitación de la academia.
      </p>

      <form action={accion} className="mt-6 space-y-4">
        {estado?.error && <Alert tono="error">{estado.error}</Alert>}
        <Input
          id="codigo"
          name="codigo"
          etiqueta="Código de invitación"
          placeholder="ESSENCE-XXXX"
          autoCapitalize="characters"
          required
        />
        <Input id="nombre" name="nombre" etiqueta="Tu nombre" required />
        <Input
          id="email"
          name="email"
          type="email"
          etiqueta="Email"
          placeholder="vos@email.com"
          autoComplete="email"
          required
        />
        <Input
          id="password"
          name="password"
          type="password"
          etiqueta="Contraseña"
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          required
        />
        <SubmitButton>Crear cuenta</SubmitButton>
      </form>

      <p className="mt-5 text-center text-sm text-crema/50">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="text-dorado hover:underline">
          Iniciá sesión
        </Link>
      </p>
    </Card>
  );
}
