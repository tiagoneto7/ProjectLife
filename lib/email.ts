import { Resend } from "resend";
import type { InscricaoInput } from "./validation";

// Dados do evento e pagamento — muda aqui de ano para ano.
const EVENTO = {
  datas: "11, 12 e 13 de Setembro, 2026",
  local: "Rua Constantina Fernandes Nº 15, Poceirão",
  valor: "35€",
};

const PAGAMENTO = {
  mbway: "+351 937780027",
  iban: "PT50001800036195088702043",
};

const CONTACTOS = {
  whatsapp: "+351 962 032 936",
  email: "projectlife4all@gmail.com",
  redesSociais: "https://linktr.ee/project_life_",
};

/**
 * Envia o email de confirmação de inscrição via Resend.
 * Configuração necessária (ver README.md): RESEND_API_KEY, FROM_EMAIL
 */
export async function sendConfirmationEmail(data: InscricaoInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error("Variáveis de ambiente de email em falta (RESEND_API_KEY / FROM_EMAIL).");
  }

  const resend = new Resend(apiKey);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const cc =
    data.menorDe18 === "sim" &&
    data.emailResponsavel &&
    data.emailResponsavel.toLowerCase() !== data.email.toLowerCase()
      ? data.emailResponsavel
      : undefined;

  await resend.emails.send({
    from,
    to: data.email,
    ...(cc ? { cc } : {}),
    subject: "Inscrição Fire",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1F2430;">

        <table style="border-collapse:collapse; margin: 8px 0 24px;">
          <tr>
            <td style="padding-right:16px; vertical-align:middle;">
              <img src="${siteUrl}/fire-logo.webp" alt="Fire" width="96" height="96" style="border-radius:50%; display:block;" />
            </td>
            <td style="vertical-align:middle;">
              <h1 style="margin:0; font-size: 24px; color:#1F2430;">Bem-vindo ao Fire</h1>
            </td>
          </tr>
        </table>

        <p>Olá, <strong>${escapeHtml(data.nome)}</strong>,</p>
        <p style="color:#5a5a5a;">Estamos felizes por te termos a bordo! Agora que recebemos a tua inscrição, segue os próximos passos para a validarmos.</p>

        <table style="width:100%; border-collapse:collapse; margin: 24px 0;">
          <tr>
            <td style="width:24px; padding: 14px 14px 14px 0; border-bottom: 1px solid #f0f0f0; vertical-align:top;">
              <div style="border: 1.5px solid #7AA002; color:#7AA002; font-weight:700; border-radius:50%; width:24px; height:24px; text-align:center; line-height:22px; font-size:12px;">1</div>
            </td>
            <td style="padding: 14px 0; border-bottom: 1px solid #f0f0f0; vertical-align:top;">
              Já efetuaste o pagamento?<br />
              Ignora os passos 2 e 3 e aguarda pelo nosso contacto.
            </td>
          </tr>
          <tr>
            <td style="width:24px; padding: 14px 14px 14px 0; border-bottom: 1px solid #f0f0f0; vertical-align:top;">
              <div style="border: 1.5px solid #7AA002; color:#7AA002; font-weight:700; border-radius:50%; width:24px; height:24px; text-align:center; line-height:22px; font-size:12px;">2</div>
            </td>
            <td style="padding: 14px 0; border-bottom: 1px solid #f0f0f0; vertical-align:top;">
              <strong>Efetua o pagamento de ${EVENTO.valor}</strong> através de um destes métodos:
              <ul style="margin: 8px 0 0; padding-left: 18px; color:#5a5a5a;">
                <li>MBWAY (${PAGAMENTO.mbway})</li>
                <li>Transferência Bancária (${PAGAMENTO.iban})</li>
                <li>Pagamento em mãos</li>
              </ul>
            </td>
          </tr>
          <tr>
            <td style="width:24px; padding: 14px 14px 14px 0; border-bottom: 1px solid #f0f0f0; vertical-align:middle;">
              <div style="border: 1.5px solid #7AA002; color:#7AA002; font-weight:700; border-radius:50%; width:24px; height:24px; text-align:center; line-height:22px; font-size:12px;">3</div>
            </td>
            <td style="padding: 14px 0; border-bottom: 1px solid #f0f0f0; vertical-align:middle;">
              Envia o comprovativo ou uma captura de ecrã pelo nosso Whatsapp ou email.
            </td>
          </tr>
          <tr>
            <td style="width:24px; padding: 14px 14px 14px 0; vertical-align:top;">
              <div style="border: 1.5px solid #7AA002; color:#7AA002; font-weight:700; border-radius:50%; width:24px; height:24px; text-align:center; line-height:22px; font-size:12px;">4</div>
            </td>
            <td style="padding: 14px 0; vertical-align:top;">
              Aguarda que validemos o pagamento e entremos em contacto contigo para mais novidades.
            </td>
          </tr>
        </table>

        <p style="color:#5a5a5a; margin: 32px 0 4px;">📅 ${EVENTO.datas}</p>
        <p style="color:#5a5a5a; margin: 0 0 20px;">📍 ${EVENTO.local}</p>

        <p>Para te preparares, consulta o regulamento:<br />
        <a href="${siteUrl}/regulamento-fire.pdf" style="color:#7AA002; font-weight:600;">Regulamento (PDF)</a></p>

        <div style="border-top: 1px solid #f0f0f0; margin-top: 24px; padding-top: 16px;">
          <p style="margin: 3px 0; font-size:12px; color:#9a9a9a;">Whatsapp: ${CONTACTOS.whatsapp}</p>
          <p style="margin: 3px 0; font-size:12px; color:#9a9a9a;">Email: <a href="mailto:${CONTACTOS.email}" style="color:#9a9a9a;">${CONTACTOS.email}</a></p>
          <p style="margin: 3px 0; font-size:12px; color:#9a9a9a;">Redes sociais: <a href="${CONTACTOS.redesSociais}" style="color:#9a9a9a;">${CONTACTOS.redesSociais}</a></p>
        </div>

        <p style="margin-top: 24px; color:#9a9a9a; font-size:13px; text-align:center;">Associação Project Life</p>
      </div>
    `,
  });
}

/**
 * Notifica o coordenador de que houve uma nova inscrição, com link para a Google Sheet.
 * Configuração necessária (ver README.md): RESEND_API_KEY, FROM_EMAIL, COORDINATOR_EMAIL, GOOGLE_SHEET_ID
 */
export async function sendCoordinatorNotification(data: InscricaoInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL;
  const coordinatorEmail = process.env.COORDINATOR_EMAIL;
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!apiKey || !from || !coordinatorEmail) {
    throw new Error(
      "Variáveis de ambiente de email em falta (RESEND_API_KEY / FROM_EMAIL / COORDINATOR_EMAIL)."
    );
  }

  const resend = new Resend(apiKey);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const sheetUrl = sheetId ? `https://docs.google.com/spreadsheets/d/${sheetId}/edit` : null;
  const adminUrl = `${siteUrl}/admin`;

  const dataNascimentoPt = new Date(data.dataNascimento).toLocaleDateString("pt-PT");

  const linha = (label: string, value: string) =>
    value
      ? `<tr style="border-top:1px solid #f0f0f0;"><td style="padding:6px 0; color:#9a9a9a; width:40%; vertical-align:top;">${escapeHtml(label)}</td><td style="padding:6px 0;">${escapeHtml(value)}</td></tr>`
      : "";

  await resend.emails.send({
    from,
    to: coordinatorEmail,
    subject: `Nova inscrição no Fire — ${data.nome}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1F2430;">

        <div style="padding: 4px 0 20px;">
          <h1 style="margin:0; font-size: 20px; color:#7AA002;">Nova inscrição no Fire</h1>
        </div>

        <table style="width:100%; border-collapse:collapse; font-size:14px;">
          <tr>
            <td style="padding:6px 0; color:#9a9a9a; width:40%;">Nome</td>
            <td style="padding:6px 0; font-weight:600;">${escapeHtml(data.nome)}</td>
          </tr>
          ${linha("Data de nascimento", dataNascimentoPt)}
          ${linha("Email", data.email)}
          ${linha("Contacto", data.contacto)}
          ${linha("Contacto de emergência", data.contactoEmergencia)}
          ${linha("Menor de 18", data.menorDe18 === "sim" ? "Sim" : "Não")}
          ${data.menorDe18 === "sim" ? linha("Responsável", `${data.nomeResponsavel ?? ""} (${data.grauParentesco ?? ""})`) : ""}
          ${data.menorDe18 === "sim" ? linha("Email do responsável", data.emailResponsavel ?? "") : ""}
          ${data.menorDe18 === "sim" ? linha("Contacto do responsável", data.contactoResponsavel ?? "") : ""}
          ${linha("Restrições alimentares", data.restricoesAlimentares ?? "")}
          ${linha("Restrições na atividade física", data.restricoesAtividadeFisica ?? "")}
          ${linha("Alergias", data.alergias ?? "")}
          ${linha("Outros (saúde)", data.outros ?? "")}
          ${linha("Observações", data.observacoes ?? "")}
        </table>

        <table style="width:100%; border-collapse:collapse; margin-top: 20px;">
          <tr>
            ${sheetUrl ? `<td style="width:50%; padding-right:6px;"><a href="${sheetUrl}" style="display:block; text-align:center; background:#FDECE6; border-radius:8px; padding:10px 12px; color:#E8633A; font-weight:600; font-size:13px; text-decoration:none;">Ver na Google Sheet</a></td>` : ""}
            <td style="width:50%; padding-left:6px;"><a href="${adminUrl}" style="display:block; text-align:center; background:#F1F7E0; border-radius:8px; padding:10px 12px; color:#7AA002; font-weight:600; font-size:13px; text-decoration:none;">Ver na área de administração</a></td>
          </tr>
        </table>

      </div>
    `,
  });
}

type PagamentoConfirmadoData = {
  nome: string;
  email: string;
  contacto: string;
  menorDe18: string;
  nomeResponsavel: string;
  contactoResponsavel: string;
};

/**
 * Envia ao inscrito a confirmação de que o pagamento foi validado.
 * Configuração necessária (ver README.md): RESEND_API_KEY, FROM_EMAIL
 */
export async function sendPaymentConfirmationEmail(data: PagamentoConfirmadoData) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error("Variáveis de ambiente de email em falta (RESEND_API_KEY / FROM_EMAIL).");
  }

  const resend = new Resend(apiKey);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  await resend.emails.send({
    from,
    to: data.email,
    subject: "Inscrição Fire validada",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1F2430;">

        <table style="border-collapse:collapse; margin: 8px 0 24px;">
          <tr>
            <td style="padding-right:16px; vertical-align:middle;">
              <img src="${siteUrl}/fire-logo.webp" alt="Fire" width="96" height="96" style="border-radius:50%; display:block;" />
            </td>
            <td style="vertical-align:middle;">
              <h1 style="margin:0; font-size: 24px; color:#1F2430;">Inscrição validada</h1>
            </td>
          </tr>
        </table>

        <p>Olá, <strong>${escapeHtml(data.nome)}</strong>,</p>
        <p style="color:#5a5a5a;">Confirmamos que recebemos o teu pagamento de ${EVENTO.valor}.</p>
        <p style="color:#5a5a5a;">A tua inscrição no Fire está validada — Até já!</p>

        <p style="color:#5a5a5a; margin: 24px 0 4px;">📅 ${EVENTO.datas}</p>
        <p style="color:#5a5a5a; margin: 0 0 20px;">📍 ${EVENTO.local}</p>

        <p>Para te preparares, consulta o regulamento:<br />
        <a href="${siteUrl}/regulamento-fire.pdf" style="color:#7AA002; font-weight:600;">Regulamento (PDF)</a></p>

        <div style="border-top: 1px solid #f0f0f0; margin-top: 24px; padding-top: 16px;">
          <p style="margin: 3px 0; font-size:12px; color:#9a9a9a;">Whatsapp: ${CONTACTOS.whatsapp}</p>
          <p style="margin: 3px 0; font-size:12px; color:#9a9a9a;">Email: <a href="mailto:${CONTACTOS.email}" style="color:#9a9a9a;">${CONTACTOS.email}</a></p>
          <p style="margin: 3px 0; font-size:12px; color:#9a9a9a;">Redes sociais: <a href="${CONTACTOS.redesSociais}" style="color:#9a9a9a;">${CONTACTOS.redesSociais}</a></p>
        </div>

        <p style="margin-top: 24px; color:#9a9a9a; font-size:13px; text-align:center;">Associação Project Life</p>
      </div>
    `,
  });
}

/**
 * Notifica o coordenador de que um pagamento foi validado, com os dados mínimos do inscrito.
 * Configuração necessária (ver README.md): RESEND_API_KEY, FROM_EMAIL, COORDINATOR_EMAIL, GOOGLE_SHEET_ID
 */
export async function sendCoordinatorPaymentNotification(data: PagamentoConfirmadoData) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL;
  const coordinatorEmail = process.env.COORDINATOR_EMAIL;
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!apiKey || !from || !coordinatorEmail) {
    throw new Error(
      "Variáveis de ambiente de email em falta (RESEND_API_KEY / FROM_EMAIL / COORDINATOR_EMAIL)."
    );
  }

  const resend = new Resend(apiKey);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const sheetUrl = sheetId ? `https://docs.google.com/spreadsheets/d/${sheetId}/edit` : null;
  const adminUrl = `${siteUrl}/admin`;

  const linha = (label: string, value: string) =>
    value
      ? `<tr style="border-top:1px solid #f0f0f0;"><td style="padding:6px 0; color:#9a9a9a; width:40%; vertical-align:top;">${escapeHtml(label)}</td><td style="padding:6px 0;">${escapeHtml(value)}</td></tr>`
      : "";

  await resend.emails.send({
    from,
    to: coordinatorEmail,
    subject: `Pagamento confirmado — ${data.nome}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1F2430;">

        <div style="padding: 4px 0 20px;">
          <h1 style="margin:0; font-size: 20px; color:#7AA002;">Pagamento confirmado</h1>
        </div>

        <table style="width:100%; border-collapse:collapse; font-size:14px;">
          <tr>
            <td style="padding:6px 0; color:#9a9a9a; width:40%;">Nome</td>
            <td style="padding:6px 0; font-weight:600;">${escapeHtml(data.nome)}</td>
          </tr>
          ${linha("Email", data.email)}
          ${linha("Contacto", data.contacto)}
          ${data.menorDe18 === "Sim" ? linha("Responsável", data.nomeResponsavel) : ""}
          ${data.menorDe18 === "Sim" ? linha("Contacto do responsável", data.contactoResponsavel) : ""}
        </table>

        <table style="width:100%; border-collapse:collapse; margin-top: 20px;">
          <tr>
            ${sheetUrl ? `<td style="width:50%; padding-right:6px;"><a href="${sheetUrl}" style="display:block; text-align:center; background:#FDECE6; border-radius:8px; padding:10px 12px; color:#E8633A; font-weight:600; font-size:13px; text-decoration:none;">Ver na Google Sheet</a></td>` : ""}
            <td style="width:50%; padding-left:6px;"><a href="${adminUrl}" style="display:block; text-align:center; background:#F1F7E0; border-radius:8px; padding:10px 12px; color:#7AA002; font-weight:600; font-size:13px; text-decoration:none;">Ver na área de administração</a></td>
          </tr>
        </table>

      </div>
    `,
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
