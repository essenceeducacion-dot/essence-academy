import Link from "next/link";
import { requerirStaff } from "@/lib/auth/guards";
import { Card } from "@/components/ui/Card";
import { crearCurso } from "../acciones";
import { FormularioCurso } from "../_componentes/FormularioCurso";

export default async function CursoNuevo() {
  await requerirStaff();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/panel/cursos" className="text-sm text-crema/50 hover:text-crema">
          ← Volver a cursos
        </Link>
        <h1 className="mt-2 text-2xl text-crema">Nuevo curso</h1>
      </div>

      <Card>
        <FormularioCurso accion={crearCurso} textoEnvio="Crear curso" />
      </Card>
    </div>
  );
}
