import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/auth";
import { getInscricoes } from "@/lib/sheets";
import AdminLoginForm from "@/components/AdminLoginForm";
import AdminLogoutButton from "@/components/AdminLogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;

  if (!isValidAdminSession(token)) {
    return <AdminLoginForm />;
  }

  const inscritos = await getInscricoes();

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Inscritos ({inscritos.length})</h1>
        <AdminLogoutButton />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2">Data</th>
              <th className="p-2">Nome</th>
              <th className="p-2">Data Nasc.</th>
              <th className="p-2">Email</th>
              <th className="p-2">Contacto</th>
              <th className="p-2">Contacto Emergência</th>
            </tr>
          </thead>
          <tbody>
            {inscritos.map((inscrito, i) => (
              <tr key={i} className="border-b">
                <td className="p-2">{new Date(inscrito.data).toLocaleString("pt-PT")}</td>
                <td className="p-2">{inscrito.nome}</td>
                <td className="p-2">{inscrito.dataNascimento}</td>
                <td className="p-2">{inscrito.email}</td>
                <td className="p-2">{inscrito.contacto}</td>
                <td className="p-2">{inscrito.contactoEmergencia}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
