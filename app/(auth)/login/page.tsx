"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { iniciarSesion } from "../acciones";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";

export default function LoginPage() {
  const [estado, accion] = useFormState(iniciarSesion, null);

  return (
    <Card>
      <h1 className="text-xl font-display text-crema">Iniciá sesión</h1>
      <p className="mt-1 text-sm text-crema/50">Bienvenido de vuelta.</p>

      <form action={accion} className="mt-6 space-y-4">
        {estado?.error && <Alert tono="error">{estado.error}</Alert>}
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
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
        <SubmitButton>Entrar</SubmitButton>
      </form>

      <div className="mt-5 space-y-1.5 text-center text-sm text-crema/50">
        <p>
          <Link href="/recuperar" className="text-dorado hover:underline">
            Olvidé mi contraseña
          </Link>
        </p>
        <p>
          ¿Tenés un código de invitación?{" "}
          <Link href="/registro" className="text-dorado hover:underline">
            Creá tu cuenta
          </Link>
        </p>
      </div>
    </Card>
  );
}
