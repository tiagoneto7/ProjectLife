import { google } from "googleapis";
import type { InscricaoInput } from "./validation";

const SHEET_RANGE = "Inscrições!A:F";

/**
 * Cria o cliente autenticado do Google Sheets a partir da Service Account.
 *
 * Configuração necessária (ver README.md):
 * 1. Criar uma Service Account no Google Cloud Console e ativar a Google Sheets API.
 * 2. Partilhar a Sheet com o email da Service Account (acesso de Editor).
 * 3. Definir as env vars: GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID
 */
function getSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!email || !privateKey || !sheetId) {
    throw new Error(
      "Variáveis de ambiente do Google Sheets em falta (GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY / GOOGLE_SHEET_ID)."
    );
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return { sheets: google.sheets({ version: "v4", auth }), sheetId };
}

export async function appendInscricaoToSheet(data: InscricaoInput) {
  const { sheets, sheetId } = getSheetsClient();

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: SHEET_RANGE,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [
        [
          new Date().toISOString(),
          data.nome,
          data.dataNascimento,
          data.email,
          data.contacto,
          data.contactoEmergencia,
        ],
      ],
    },
  });
}

export type InscritoRow = {
  data: string;
  nome: string;
  dataNascimento: string;
  email: string;
  contacto: string;
  contactoEmergencia: string;
};

/** Lê todas as inscrições da Sheet (sem a linha de cabeçalho). */
export async function getInscricoes(): Promise<InscritoRow[]> {
  const { sheets, sheetId } = getSheetsClient();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${SHEET_RANGE.split("!")[0]}!A2:F`,
  });

  const rows = res.data.values ?? [];

  return rows.map((row) => ({
    data: row[0] ?? "",
    nome: row[1] ?? "",
    dataNascimento: row[2] ?? "",
    email: row[3] ?? "",
    contacto: row[4] ?? "",
    contactoEmergencia: row[5] ?? "",
  }));
}
