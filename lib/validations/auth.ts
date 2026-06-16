import { z } from "zod";

export const esquemaLogin = z.object({
  email: z.string().email("Ingresá un email válido."),
  password: z.string().min(1, "Ingresá tu contraseña."),
});

export const esquemaRegistro = z.object({
  nombre: z.string().trim().min(2, "Decinos tu nombre."),
  email: z.string().email("Ingresá un email válido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
  codigo: z.string().trim().min(1, "Necesitás un código de invitación."),
});

export const esquemaRecuperar = z.object({
  email: z.string().email("Ingresá un email válido."),
});

export const esquemaCambiarPassword = z
  .object({
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
    confirmar: z.string(),
  })
  .refine((d) => d.password === d.confirmar, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmar"],
  });

export type EstadoFormulario = {
  error?: string;
  ok?: string;
} | null;
