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
export async function sendConfirmationEmail(data: InscricaoInput, rowIndex: number) {
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

  // Link para retomar o pagamento automático (Cartão/MB WAY), mesmo que a
  // pessoa tenha fechado a página de confirmação sem pagar logo ali.
  const retomarParams = new URLSearchParams({
    nome: data.nome,
    email: data.email,
    rowIndex: String(rowIndex),
  });
  if (data.menorDe18 === "sim") {
    retomarParams.set("menorDe18", data.menorDe18);
    if (data.emailResponsavel) retomarParams.set("emailResponsavel", data.emailResponsavel);
  }
  const retomarUrl = `${siteUrl}/fire/confirmacao?${retomarParams.toString()}`;

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
        <p style="color:#5a5a5a; margin:0 0 12px;">Estamos felizes por te termos a bordo!<br />Agora que recebemos a tua inscrição, segue os próximos passos para a validarmos.</p>
        <p style="color:#5a5a5a; margin:0 0 12px;">Já efetuaste o pagamento? Ignora este email automático e aguarda pelo nosso contacto.</p>

        <div style="border:1px solid #cfe3a0; background:#F8FBF0; border-radius:12px; padding:18px 18px 16px; margin-top:18px;">
          <h3 style="margin:0 0 6px; font-size:16px; color:#1F2430;">Pagamento com Cartão ou MB WAY</h3>
          <p style="margin:0 0 10px; color:#5a5a5a; font-size:14px; line-height:1.5;">Pagamento processado imediatamente — assim que confirmado, a tua inscrição fica automaticamente validada.</p>
          <a href="${retomarUrl}" style="display:inline-block; margin-top:4px; padding:11px 20px; background:#7AA002; color:#ffffff; font-weight:600; text-decoration:none; border-radius:8px; font-size:14px;">Pagar agora</a>
        </div>

        <table width="100%" style="border-collapse:collapse; margin:18px 0 0;">
          <tr>
            <td style="border-top:1px solid #ececec;"></td>
            <td style="white-space:nowrap; padding:0 10px; color:#9a9a9a; font-size:12px; text-transform:uppercase; letter-spacing:0.06em;">ou, se preferires</td>
            <td style="border-top:1px solid #ececec;"></td>
          </tr>
        </table>

        <div style="border:1px solid #e7e7e2; border-radius:12px; padding:18px 18px 16px; margin-top:18px;">
          <h3 style="margin:0 0 6px; font-size:16px; color:#1F2430;">Pagamento manual</h3>
          <p style="margin:0 0 10px; color:#5a5a5a; font-size:14px; line-height:1.5;">Efetua o pagamento de <strong>${EVENTO.valor}</strong> através de um destes métodos:</p>
          <ul style="margin: 0 0 14px; padding-left: 18px; color:#5a5a5a; font-size:14px;">
            <li>MBWAY (${PAGAMENTO.mbway})</li>
            <li>Transferência Bancária (${PAGAMENTO.iban})</li>
            <li>Pagamento em mãos</li>
          </ul>
          <div style="margin-top:14px; padding-top:14px; border-top:1px dashed #e2e2dc;">
            <table width="100%" style="border-collapse:collapse;">
              <tr>
                <td style="width:22px; padding:6px 8px 6px 0; vertical-align:top;">
                  <div style="border:1.3px solid #b7bdad; color:#6B6F60; font-weight:700; border-radius:50%; width:18px; height:18px; text-align:center; line-height:16px; font-size:10.5px;">1</div>
                </td>
                <td style="padding:6px 0; vertical-align:top; font-size:13.5px; color:#5a5a5a;">
                  Envia-nos o comprovativo ou uma captura de ecrã pelo Whatsapp ou email.
                </td>
              </tr>
              <tr>
                <td style="width:22px; padding:6px 8px 6px 0; vertical-align:top;">
                  <div style="border:1.3px solid #b7bdad; color:#6B6F60; font-weight:700; border-radius:50%; width:18px; height:18px; text-align:center; line-height:16px; font-size:10.5px;">2</div>
                </td>
                <td style="padding:6px 0; vertical-align:top; font-size:13.5px; color:#5a5a5a;">
                  Aguarda que validemos o pagamento e entremos em contacto contigo.
                </td>
              </tr>
            </table>
          </div>
        </div>

        <p style="color:#5a5a5a; margin: 32px 0 4px;">📅 ${EVENTO.datas}</p>
        <p style="color:#5a5a5a; margin: 0 0 20px;">📍 ${EVENTO.local}</p>

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

/**
 * Envia o email com as informações finais do FIRE (check-in/check-out, local, checklist)
 * aos inscritos validados. Usa o batch send do Resend — cada pessoa recebe o email
 * individualmente, sem ver os outros destinatários.
 * Configuração necessária (ver README.md): RESEND_API_KEY, FROM_EMAIL
 */
export async function sendDocumentosFinais(emails: string[]) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error("Variáveis de ambiente de email em falta (RESEND_API_KEY / FROM_EMAIL).");
  }
  if (emails.length === 0) return;

  const resend = new Resend(apiKey);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1F2430;">

        <table style="border-collapse:collapse; margin: 8px 0 24px;">
          <tr>
            <td style="padding-right:16px; vertical-align:middle;">
              <img src="${siteUrl}/fire-logo.webp" alt="Fire" width="96" height="96" style="border-radius:50%; display:block;" />
            </td>
            <td style="vertical-align:middle;">
              <h1 style="margin:0; font-size: 24px; color:#1F2430;">Informações do FIRE 2026</h1>
            </td>
          </tr>
        </table>

        <p style="color:#5a5a5a;">É com grande entusiasmo que te damos as boas-vindas ao FIRE 2026!</p>
        <p style="color:#5a5a5a;">Prepara-te para uma experiência inesquecível, repleta de aventura, diversão, novas amizades e momentos que vão ficar na memória!</p>
        <p style="color:#5a5a5a;">Este ano, temos muitas novidades preparadas para ti e queremos garantir que chegas ao FIRE com tudo o que precisas de saber. Por isso, reunimos aqui as informações essenciais.</p>

        <p style="color:#5a5a5a; margin: 20px 0 4px;">📅 Check-in — 11.09.2026, pelas 16h30</p>
        <p style="color:#5a5a5a; margin: 0 0 4px;">📍 FIRE campus — Rua Constantina Fernandes, CCI 2114, Brejos do Poço – Poceirão</p>
        <p style="color:#5a5a5a; margin: 0 0 20px;">📅 Check-out — 13.09.2026, pelas 16h00</p>

        <p style="color:#5a5a5a;">O teu monitor irá entrar em contacto contigo, pelo WhatsApp, durante os próximos dias, para combinar todos os pormenores e responder a qualquer questão que possas ter.<br />Fica atento às mensagens!</p>
        <p style="color:#5a5a5a;">Se tiveres alguma dúvida ou pergunta, não hesites em contactar-nos.</p>

        <p style="color:#5a5a5a; margin-top:20px;">Até breve,<br />Equipa FIRE 2026</p>

        <div style="border-top: 1px solid #f0f0f0; margin-top: 24px; padding-top: 16px;">
          <p style="margin: 3px 0; font-size:12px; color:#9a9a9a;">Whatsapp: ${CONTACTOS.whatsapp}</p>
          <p style="margin: 3px 0; font-size:12px; color:#9a9a9a;">Email: <a href="mailto:${CONTACTOS.email}" style="color:#9a9a9a;">${CONTACTOS.email}</a></p>
          <p style="margin: 3px 0; font-size:12px; color:#9a9a9a;">Redes sociais: <a href="${CONTACTOS.redesSociais}" style="color:#9a9a9a;">${CONTACTOS.redesSociais}</a></p>
        </div>

        <p style="margin-top: 24px; color:#9a9a9a; font-size:13px; text-align:center;">Associação Project Life</p>
      </div>
    `;

  const subject = "FIRE 2026 — Informações";

  // Resend só aceita até 100 emails por chamada ao batch send.
  for (let i = 0; i < emails.length; i += 100) {
    const lote = emails.slice(i, i + 100);
    await resend.batch.send(lote.map((to) => ({ from, to, subject, html })));
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
