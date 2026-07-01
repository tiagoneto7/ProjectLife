import { Resend } from "resend";
import type { InscricaoInput } from "./validation";

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

  await resend.emails.send({
    from,
    to: data.email,
    subject: "Inscrição recebida — Fire",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1F2430;">
        <h1 style="color: #E8633A; font-size: 22px;">Inscrição recebida! 🔥</h1>
        <p>Olá ${escapeHtml(data.nome)},</p>
        <p>A tua inscrição no Fire foi recebida com sucesso. Aqui ficam os dados que registámos:</p>
        <ul>
          <li><strong>Nome:</strong> ${escapeHtml(data.nome)}</li>
          <li><strong>Data de nascimento:</strong> ${escapeHtml(data.dataNascimento)}</li>
          <li><strong>Contacto:</strong> ${escapeHtml(data.contacto)}</li>
          <li><strong>Contacto de emergência:</strong> ${escapeHtml(data.contactoEmergencia)}</li>
        </ul>
        <p>Qualquer dúvida, contacta-nos através do +351 962 032 936 ou projectlife4all@gmail.com.</p>
        <p>Até já!</p>
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
  const sheetUrl = sheetId ? `https://docs.google.com/spreadsheets/d/${sheetId}/edit` : null;

  await resend.emails.send({
    from,
    to: coordinatorEmail,
    subject: `Nova inscrição — ${data.nome}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1F2430;">
        <h1 style="color: #E8633A; font-size: 22px;">Nova inscrição no Fire 🔥</h1>
        <ul>
          <li><strong>Nome:</strong> ${escapeHtml(data.nome)}</li>
          <li><strong>Data de nascimento:</strong> ${escapeHtml(data.dataNascimento)}</li>
          <li><strong>Email:</strong> ${escapeHtml(data.email)}</li>
          <li><strong>Contacto:</strong> ${escapeHtml(data.contacto)}</li>
          <li><strong>Contacto de emergência:</strong> ${escapeHtml(data.contactoEmergencia)}</li>
        </ul>
        ${sheetUrl ? `<p><a href="${sheetUrl}">Ver na Google Sheet</a></p>` : ""}
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
