import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/auth";
import { getInscricoes } from "@/lib/sheets";
import AdminLoginForm from "@/components/AdminLoginForm";
import AdminTabelaInscritos from "@/components/AdminTabelaInscritos";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;

  if (!isValidAdminSession(token)) {
    return <AdminLoginForm />;
  }

  const inscritos = await getInscricoes();

  const semRestricao = ["nada", "nenhum", "nenhuma"];
  const temRestricao = (texto: string) =>
    texto && !semRestricao.includes(texto.trim().toLowerCase());

  const restricoesFisicas = inscritos
    .filter((i) => temRestricao(i.restricoesAtividadeFisica))
    .map((i) => ({ nome: i.nome, texto: i.restricoesAtividadeFisica }));

  const restricoesAlimentares = inscritos
    .filter((i) => temRestricao(i.restricoesAlimentares))
    .map((i) => ({ nome: i.nome, texto: i.restricoesAlimentares }));

  const alergias = inscritos
    .filter((i) => temRestricao(i.alergias))
    .map((i) => ({ nome: i.nome, texto: i.alergias }));

  return (
    <div className="mx-auto max-w-7xl px-3 py-10">
      <AdminTabelaInscritos
        inscritos={inscritos}
        restricoesFisicas={restricoesFisicas}
        restricoesAlimentares={restricoesAlimentares}
        alergias={alergias}
      />
    </div>
  );
}
