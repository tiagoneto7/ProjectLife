import { google } from "googleapis";
import type { InscricaoInput } from "./validation";

const SHEET_RANGE = "Inscrições!A:T";

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

export async function appendInscricaoToSheet(data: InscricaoInput): Promise<number> {
  const { sheets, sheetId } = getSheetsClient();

  const res = await sheets.spreadsheets.values.append({
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
          data.restricoesAlimentares ?? "",
          data.restricoesAtividadeFisica ?? "",
          data.alergias ?? "",
          data.outros ?? "",
          data.menorDe18 === "sim" ? "Sim" : "Não",
          data.nomeResponsavel ?? "",
          data.grauParentesco ?? "",
          data.emailResponsavel ?? "",
          data.contactoResponsavel ?? "",
          data.observacoes ?? "",
          data.consentimentoDados ? "Sim" : "Não",
          data.consentimentoImagens ? "Sim" : "Não",
          data.consentimentoContacto ? "Sim" : "Não",
          "Pendente",
        ],
      ],
    },
  });

  const updatedRange = res.data.updates?.updatedRange ?? "";
  const match = updatedRange.match(/(\d+):/) ?? updatedRange.match(/(\d+)$/);
  if (!match) {
    throw new Error(`Não foi possível determinar a linha da inscrição (range: ${updatedRange}).`);
  }
  return Number(match[1]);
}

export async function updateEstado(rowIndex: number, estado: string) {
  const { sheets, sheetId } = getSheetsClient();

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `Inscrições!T${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[estado]],
    },
  });
}

export type InscritoRow = {
  rowIndex: number;
  data: string;
  nome: string;
  dataNascimento: string;
  email: string;
  contacto: string;
  contactoEmergencia: string;
  restricoesAlimentares: string;
  restricoesAtividadeFisica: string;
  alergias: string;
  outros: string;
  menorDe18: string;
  nomeResponsavel: string;
  grauParentesco: string;
  emailResponsavel: string;
  contactoResponsavel: string;
  observacoes: string;
  consentimentoDados: string;
  consentimentoImagens: string;
  consentimentoContacto: string;
  estado: string;
};

function linhaParaInscrito(row: string[], rowIndex: number): InscritoRow {
  return {
    rowIndex,
    data: row[0] ?? "",
    nome: row[1] ?? "",
    dataNascimento: row[2] ?? "",
    email: row[3] ?? "",
    contacto: row[4] ?? "",
    contactoEmergencia: row[5] ?? "",
    restricoesAlimentares: row[6] ?? "",
    restricoesAtividadeFisica: row[7] ?? "",
    alergias: row[8] ?? "",
    outros: row[9] ?? "",
    menorDe18: row[10] ?? "",
    nomeResponsavel: row[11] ?? "",
    grauParentesco: row[12] ?? "",
    emailResponsavel: row[13] ?? "",
    contactoResponsavel: row[14] ?? "",
    observacoes: row[15] ?? "",
    consentimentoDados: row[16] ?? "",
    consentimentoImagens: row[17] ?? "",
    consentimentoContacto: row[18] ?? "",
    estado: row[19] || "Pendente",
  };
}

/** Lê todas as inscrições da Sheet (sem a linha de cabeçalho). */
export async function getInscricoes(): Promise<InscritoRow[]> {
  const { sheets, sheetId } = getSheetsClient();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${SHEET_RANGE.split("!")[0]}!A2:T`,
  });

  const rows = res.data.values ?? [];
  return rows.map((row, i) => linhaParaInscrito(row, i + 2));
}

/** Lê uma única inscrição pelo número da linha na Sheet. */
export async function getInscricaoPorLinha(rowIndex: number): Promise<InscritoRow | null> {
  const { sheets, sheetId } = getSheetsClient();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `Inscrições!A${rowIndex}:T${rowIndex}`,
  });

  const row = res.data.values?.[0];
  if (!row) return null;

  return linhaParaInscrito(row, rowIndex);
}
