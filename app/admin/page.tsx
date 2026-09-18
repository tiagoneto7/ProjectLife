import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/auth";
import { getInscricoes, getEquipas, getDespesas, getFeedback } from "@/lib/sheets";
import AdminLoginForm from "@/components/AdminLoginForm";
import AdminPainel from "@/components/AdminPainel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;

  if (!isValidAdminSession(token)) {
    return <AdminLoginForm />;
  }

  const [inscritos, equipas, despesas, feedback] = await Promise.all([
    getInscricoes(),
    getEquipas(),
    getDespesas(),
    getFeedback(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-3 py-10">
      <AdminPainel
        inscritos={inscritos}
        equipas={equipas}
        despesas={despesas}
        feedback={feedback}
      />
    </div>
  );
}
