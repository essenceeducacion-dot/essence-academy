import { requerirSesion } from "@/lib/auth/guards";
import { Card } from "@/components/ui/Card";
import { FormularioPerfil } from "./_componentes/FormularioPerfil";

const etiquetaRol: Record<string, string> = {
  admin: "Administración",
  educador: "Educador",
  alumno: "Alumno",
};

export default async function PerfilPage() {
  const perfil = await requerirSesion();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl text-crema">Mi perfil</h1>
        <p className="mt-1 text-sm text-crema/50">
          Tus datos en Essence Academy.
        </p>
      </div>

      <Card className="space-y-1">
        <p className="text-xs text-crema/40">Email</p>
        <p className="text-sm text-crema">{perfil.email}</p>
        <p className="mt-2 text-xs text-crema/40">Rol</p>
        <p className="text-sm text-dorado">
          {etiquetaRol[perfil.rol] ?? perfil.rol}
        </p>
      </Card>

      <Card>
        <h2 className="mb-4 text-base text-crema">Editar nombre</h2>
        <FormularioPerfil nombreActual={perfil.nombre ?? ""} />
      </Card>
    </div>
  );
}
