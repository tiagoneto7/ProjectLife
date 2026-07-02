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

  await resend.emails.send({
    from,
    to: data.email,
    subject: "Inscrição Fire",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1F2430;">

        <div style="text-align:center; padding: 8px 0 24px;">
          <p style="margin:0 0 6px; font-size: 12px; letter-spacing:0.15em; text-transform:uppercase; color:#9a9a9a;">Project Life</p>
          <h1 style="margin:0; font-size: 24px; color:#1F2430;">Bem-vindo ao Fire 🔥</h1>
        </div>

        <p>Olá, <strong>${escapeHtml(data.nome)}</strong>,</p>
        <p style="color:#5a5a5a;">Estamos felizes por te termos a bordo! Agora que recebemos a tua inscrição, segue os próximos passos para a validarmos.</p>

        <table style="width:100%; border-collapse:collapse; margin: 24px 0;">
          <tr>
            <td style="width:24px; padding: 14px 14px 14px 0; border-bottom: 1px solid #f0f0f0; vertical-align:top;">
              <div style="border: 1.5px solid #E8633A; color:#E8633A; font-weight:700; border-radius:50%; width:24px; height:24px; text-align:center; line-height:22px; font-size:12px;">1</div>
            </td>
            <td style="padding: 14px 0; border-bottom: 1px solid #f0f0f0; vertical-align:top;">
              Já efetuaste o pagamento? Ignora os passos 2 e 3 e aguarda pelo nosso contacto.
            </td>
          </tr>
          <tr>
            <td style="width:24px; padding: 14px 14px 14px 0; border-bottom: 1px solid #f0f0f0; vertical-align:top;">
              <div style="border: 1.5px solid #E8633A; color:#E8633A; font-weight:700; border-radius:50%; width:24px; height:24px; text-align:center; line-height:22px; font-size:12px;">2</div>
            </td>
            <td style="padding: 14px 0; border-bottom: 1px solid #f0f0f0; vertical-align:top;">
              <strong>Paga o valor de ${EVENTO.valor}</strong> através de um destes métodos:
              <ul style="margin: 8px 0 0; padding-left: 18px; color:#5a5a5a;">
                <li>MBWAY (${PAGAMENTO.mbway})</li>
                <li>Transferência Bancária (${PAGAMENTO.iban})</li>
                <li>Pagamento em mãos</li>
              </ul>
            </td>
          </tr>
          <tr>
            <td style="width:24px; padding: 14px 14px 14px 0; vertical-align:top;">
              <div style="border: 1.5px solid #E8633A; color:#E8633A; font-weight:700; border-radius:50%; width:24px; height:24px; text-align:center; line-height:22px; font-size:12px;">3</div>
            </td>
            <td style="padding: 14px 0; vertical-align:top;">
              Envia o comprovativo ou uma captura de ecrã pelo nosso Whatsapp ou email.
            </td>
          </tr>
        </table>

        <p style="background:#EAF7EE; color:#2F9E44; border-radius:10px; padding:12px 16px; font-weight:600; text-align:center;">
          Depois de validarmos o pagamento, entraremos em contacto contigo para mais novidades!
        </p>

        <p style="color:#5a5a5a; margin: 16px 0 4px;">📅 ${EVENTO.datas}</p>
        <p style="color:#5a5a5a; margin: 0 0 20px;">📍 ${EVENTO.local}</p>

        <p>Para te preparares, consulta o regulamento:<br />
        <a href="${siteUrl}/regulamento-fire.pdf" style="color:#E8633A; font-weight:600;">Descarregar regulamento (PDF)</a></p>

        <div style="border-top: 1px solid #f0f0f0; margin-top: 24px; padding-top: 20px;">
          <p style="margin: 4px 0; font-size:14px; color:#5a5a5a;">Whatsapp: <strong>${CONTACTOS.whatsapp}</strong></p>
          <p style="margin: 4px 0; font-size:14px; color:#5a5a5a;">Email: <a href="mailto:${CONTACTOS.email}" style="color:#1F2430;">${CONTACTOS.email}</a></p>
          <p style="margin: 4px 0; font-size:14px; color:#5a5a5a;">Redes sociais: <a href="${CONTACTOS.redesSociais}" style="color:#1F2430;">${CONTACTOS.redesSociais}</a></p>
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

  await resend.emails.send({
    from,
    to: coordinatorEmail,
    subject: `Nova inscrição no Fire — ${data.nome}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1F2430;">

        <div style="padding: 4px 0 20px;">
          <h1 style="margin:0; font-size: 20px; color:#E8633A;">Nova inscrição no Fire</h1>
        </div>

        <table style="width:100%; border-collapse:collapse; font-size:14px;">
          <tr>
            <td style="padding:6px 0; color:#9a9a9a; width:40%;">Nome</td>
            <td style="padding:6px 0; font-weight:600;">${escapeHtml(data.nome)}</td>
          </tr>
          <tr style="border-top:1px solid #f0f0f0;">
            <td style="padding:6px 0; color:#9a9a9a;">Data de nascimento</td>
            <td style="padding:6px 0;">${escapeHtml(dataNascimentoPt)}</td>
          </tr>
          <tr style="border-top:1px solid #f0f0f0;">
            <td style="padding:6px 0; color:#9a9a9a;">Email</td>
            <td style="padding:6px 0;">${escapeHtml(data.email)}</td>
          </tr>
          <tr style="border-top:1px solid #f0f0f0;">
            <td style="padding:6px 0; color:#9a9a9a;">Contacto</td>
            <td style="padding:6px 0;">${escapeHtml(data.contacto)}</td>
          </tr>
          <tr style="border-top:1px solid #f0f0f0;">
            <td style="padding:6px 0; color:#9a9a9a;">Contacto de emergência</td>
            <td style="padding:6px 0;">${escapeHtml(data.contactoEmergencia)}</td>
          </tr>
        </table>

        <table style="width:100%; border-collapse:collapse; margin-top: 20px;">
          <tr>
            ${sheetUrl ? `<td style="width:50%; padding-right:6px;"><a href="${sheetUrl}" style="display:block; text-align:center; background:#EAF7EE; border-radius:8px; padding:10px 12px; color:#2F9E44; font-weight:600; font-size:13px; text-decoration:none;">Ver na Google Sheet</a></td>` : ""}
            <td style="width:50%; padding-left:6px;"><a href="${adminUrl}" style="display:block; text-align:center; background:#FDECE6; border-radius:8px; padding:10px 12px; color:#E8633A; font-weight:600; font-size:13px; text-decoration:none;">Ver na área de administração</a></td>
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
