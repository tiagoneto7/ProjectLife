import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, papelDaSessao } from "@/lib/auth";
import { getInscricoes, getEquipas, getMovimentos, getFeedback } from "@/lib/sheets";
import AdminLoginForm from "@/components/AdminLoginForm";
import AdminPainel from "@/components/AdminPainel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;

  const papel = papelDaSessao(token);
  if (!papel) {
    return <AdminLoginForm />;
  }

  const [inscritos, equipas, movimentos, feedback] = await Promise.all([
    getInscricoes(),
    getEquipas(),
    getMovimentos(),
    getFeedback(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-3 py-10">
      <AdminPainel
        inscritos={inscritos}
        equipas={equipas}
        movimentos={movimentos}
        feedback={feedback}
        podeEditar={papel === "editor"}
      />
    </div>
  );
}
