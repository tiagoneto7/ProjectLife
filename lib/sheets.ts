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
    valueInputOption: "RAW",
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

/**
 * Origem do pagamento, guardada na coluna U da aba "Inscrições":
 * "Automático" quando vem do webhook do Stripe, "Manual" quando um admin
 * marca o Estado como Pago à mão. Vazia quando o Estado é Pendente.
 */
export async function updateEstado(rowIndex: number, estado: string, origemPagamento?: string) {
  const { sheets, sheetId } = getSheetsClient();

  const data = [{ range: `Inscrições!T${rowIndex}`, values: [[estado]] }];
  if (origemPagamento !== undefined) {
    data.push({ range: `Inscrições!U${rowIndex}`, values: [[origemPagamento]] });
  }

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: { valueInputOption: "RAW", data },
  });
}

/**
 * Equipas: guardadas numa aba própria "Equipas" (colunas A=ID, B=Nome, C=Cor).
 * A equipa de cada inscrito é guardada na coluna V da aba "Inscrições".
 *
 * Configuração adicional necessária (ver README.md):
 * 4. Criar uma aba chamada "Equipas" na mesma Sheet, com cabeçalho ID / Nome / Cor.
 */
export type Equipa = { id: string; nome: string; cor: string };

const EQUIPAS_RANGE = "Equipas!A:C";

export async function getEquipas(): Promise<Equipa[]> {
  const { sheets, sheetId } = getSheetsClient();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "Equipas!A2:C",
  });

  const rows = res.data.values ?? [];
  return rows
    .filter((row) => row[0] && row[1])
    .map((row) => ({ id: row[0], nome: row[1] ?? "", cor: row[2] ?? "" }));
}

export async function criarEquipa(nome: string, cor: string): Promise<Equipa> {
  const { sheets, sheetId } = getSheetsClient();

  // IDs simples e sequenciais (1, 2, 3…), a partir do maior ID já usado.
  const existentes = await getEquipas();
  const maiorId = existentes.reduce((max, e) => {
    const n = Number(e.id);
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);
  const id = String(maiorId + 1);

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: EQUIPAS_RANGE,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [[id, nome, cor]] },
  });

  return { id, nome, cor };
}

async function encontrarLinhaEquipa(id: string): Promise<number | null> {
  const { sheets, sheetId } = getSheetsClient();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "Equipas!A2:A",
  });

  const rows = res.data.values ?? [];
  const idx = rows.findIndex((row) => row[0] === id);
  return idx === -1 ? null : idx + 2;
}

export async function atualizarEquipa(id: string, nome: string, cor: string) {
  const linha = await encontrarLinhaEquipa(id);
  if (!linha) throw new Error("Equipa não encontrada.");

  const { sheets, sheetId } = getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `Equipas!B${linha}:C${linha}`,
    valueInputOption: "RAW",
    requestBody: { values: [[nome, cor]] },
  });
}

export async function eliminarEquipa(id: string) {
  const linha = await encontrarLinhaEquipa(id);
  if (!linha) return;

  const { sheets, sheetId } = getSheetsClient();

  // Desatribui todos os inscritos que estavam nesta equipa, para não ficarem
  // com um EquipaId "fantasma" que uma equipa nova possa vir a reutilizar.
  const inscritos = await getInscricoes();
  const afetados = inscritos.filter((i) => i.equipaId === id);
  if (afetados.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        valueInputOption: "RAW",
        data: afetados.map((i) => ({
          range: `Inscrições!V${i.rowIndex}`,
          values: [[""]],
        })),
      },
    });
  }

  // Limpa a linha em vez de a apagar, para não desalinhar as restantes linhas.
  await sheets.spreadsheets.values.clear({
    spreadsheetId: sheetId,
    range: `Equipas!A${linha}:C${linha}`,
  });
}

export async function atualizarEquipaInscrito(rowIndex: number, equipaId: string) {
  const { sheets, sheetId } = getSheetsClient();

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `Inscrições!V${rowIndex}`,
    valueInputOption: "RAW",
    requestBody: { values: [[equipaId]] },
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
  equipaId: string;
  origemPagamento: string;
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
    origemPagamento: row[20] ?? "",
    equipaId: row[21] ?? "",
  };
}

/** Lê todas as inscrições da Sheet (sem a linha de cabeçalho). */
export async function getInscricoes(): Promise<InscritoRow[]> {
  const { sheets, sheetId } = getSheetsClient();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${SHEET_RANGE.split("!")[0]}!A2:V`,
  });

  const rows = res.data.values ?? [];
  return rows.map((row, i) => linhaParaInscrito(row, i + 2));
}

/** Lê uma única inscrição pelo número da linha na Sheet. */
export async function getInscricaoPorLinha(rowIndex: number): Promise<InscritoRow | null> {
  const { sheets, sheetId } = getSheetsClient();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `Inscrições!A${rowIndex}:V${rowIndex}`,
  });

  const row = res.data.values?.[0];
  if (!row) return null;

  return linhaParaInscrito(row, rowIndex);
}
