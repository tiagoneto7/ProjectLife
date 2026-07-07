import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/auth";
import { getInscricoes } from "@/lib/sheets";
import AdminLoginForm from "@/components/AdminLoginForm";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import AdminEstadoEditor from "@/components/AdminEstadoEditor";

export const dynamic = "force-dynamic";

function DetailsCell({ items }: { items: { label: string; value: string }[] }) {
  const filled = items.filter((i) => i.value);
  if (filled.length === 0) return <span className="text-inksoft">—</span>;

  return (
    <details className="group">
      <summary className="cursor-pointer list-none text-sm text-ink underline decoration-dotted underline-offset-2 marker:content-none">
        Ver ({filled.length})
      </summary>
      <div className="mt-1.5 min-w-[200px] space-y-1 text-xs text-inkmuted">
        {filled.map((i) => (
          <p key={i.label}>
            <span className="text-inksoft">{i.label}:</span> {i.value}
          </p>
        ))}
      </div>
    </details>
  );
}

export default async function AdminPage() {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;

  if (!isValidAdminSession(token)) {
    return <AdminLoginForm />;
  }

  const inscritos = await getInscricoes();
  const validados = inscritos.filter((i) => i.estado.toLowerCase() === "pago").length;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-10 flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Inscritos ({inscritos.length}) · Validados ({validados})
        </h1>
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
              <th className="p-2">Menor 18</th>
              <th className="p-2">Responsável</th>
              <th className="p-2">Saúde</th>
              <th className="p-2">Observações</th>
              <th className="p-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {inscritos.map((inscrito) => {
              const saudeItems = [
                { label: "Alimentar", value: inscrito.restricoesAlimentares },
                { label: "Atividade física", value: inscrito.restricoesAtividadeFisica },
                { label: "Alergias", value: inscrito.alergias },
                { label: "Outros", value: inscrito.outros },
              ];

              const responsavelItems = [
                { label: "Nome", value: inscrito.nomeResponsavel },
                { label: "Grau de parentesco", value: inscrito.grauParentesco },
                { label: "Email", value: inscrito.emailResponsavel },
                { label: "Contacto", value: inscrito.contactoResponsavel },
              ];

              return (
                <tr key={inscrito.rowIndex} className="border-b">
                  <td className="p-2">
                    {new Date(inscrito.data).toLocaleString("pt-PT", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="p-2">{inscrito.nome}</td>
                  <td className="p-2">{inscrito.dataNascimento}</td>
                  <td className="p-2">{inscrito.email}</td>
                  <td className="p-2">{inscrito.contacto}</td>
                  <td className="p-2">{inscrito.contactoEmergencia}</td>
                  <td className="p-2">{inscrito.menorDe18 || "—"}</td>
                  <td className="p-2">
                    {inscrito.menorDe18 === "Sim" ? (
                      <DetailsCell items={responsavelItems} />
                    ) : (
                      <span className="text-inksoft">—</span>
                    )}
                  </td>
                  <td className="p-2">
                    <DetailsCell items={saudeItems} />
                  </td>
                  <td className="max-w-[160px] truncate p-2" title={inscrito.observacoes || undefined}>
                    {inscrito.observacoes || "—"}
                  </td>
                  <td className="p-2">
                    <AdminEstadoEditor rowIndex={inscrito.rowIndex} initialEstado={inscrito.estado} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
