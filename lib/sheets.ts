import { google } from "googleapis";
import type { InscricaoInput } from "./validation";
import { edicaoAtual } from "./evento";
import { TIPOS, lerTipo, type TipoMovimento } from "./contas";

const SHEET_RANGE = "Inscrições!A:X";

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
          "", // U Nota
          "", // V OrigemPagamento
          "", // W EquipaId
          edicaoAtual(), // X Edição — gravada agora para o arquivo não mudar depois
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
 * Estado do pagamento (coluna T) e, opcionalmente:
 * - nota (coluna U): texto livre da equipa sobre esta inscrição;
 * - origem (coluna V): "Automático" quando vem do webhook do Stripe, "Manual"
 *   quando um admin marca à mão, vazia quando fica Pendente.
 */
export async function updateEstado(
  rowIndex: number,
  estado: string,
  origemPagamento?: string,
  nota?: string
) {
  const { sheets, sheetId } = getSheetsClient();

  const data = [{ range: `Inscrições!T${rowIndex}`, values: [[estado]] }];
  if (nota !== undefined) {
    data.push({ range: `Inscrições!U${rowIndex}`, values: [[nota]] });
  }
  if (origemPagamento !== undefined) {
    data.push({ range: `Inscrições!V${rowIndex}`, values: [[origemPagamento]] });
  }

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: { valueInputOption: "RAW", data },
  });
}

/**
 * Equipas: guardadas numa aba própria "Equipas"
 * (colunas A=ID, B=Nome, C=Cor, D=Edição, E=Monitores, F=Lugar).
 * Monitores são nomes completos de membros da própria equipa, separados por
 * vírgulas; Lugar é a classificação final (vazio = ainda sem lugar).
 * A equipa de cada inscrito é guardada na coluna W da aba "Inscrições".
 *
 * A edição fica na própria linha para que cada FIRE tenha as suas equipas —
 * sem isso, renomear ou apagar uma equipa numa edição mexia no arquivo das
 * anteriores.
 *
 * Configuração adicional necessária (ver README.md):
 * 4. Criar uma aba chamada "Equipas" com cabeçalho ID / Nome / Cor / Edição.
 */
export type Equipa = {
  id: string;
  nome: string;
  cor: string;
  edicao: number;
  monitores: string[];
  /** Classificação final (1 = 1º lugar); 0 = ainda sem lugar. */
  lugar: number;
};

const EQUIPAS_RANGE = "Equipas!A:F";

function lerMonitores(valor: string | undefined): string[] {
  return (valor ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
}

export async function getEquipas(): Promise<Equipa[]> {
  const { sheets, sheetId } = getSheetsClient();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "Equipas!A2:F",
  });

  const rows = res.data.values ?? [];
  return rows
    .filter((row) => row[0] && row[1])
    .map((row) => ({
      id: row[0],
      nome: row[1] ?? "",
      cor: row[2] ?? "",
      edicao: Number(row[3]) || 0,
      monitores: lerMonitores(row[4]),
      lugar: Number(row[5]) || 0,
    }));
}

export async function criarEquipa(nome: string, cor: string, edicao: number): Promise<Equipa> {
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
    requestBody: { values: [[id, nome, cor, edicao]] },
  });

  return { id, nome, cor, edicao, monitores: [], lugar: 0 };
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

export async function atualizarEquipa(
  id: string,
  nome: string,
  cor: string,
  monitores: string[],
  lugar: number
) {
  const linha = await encontrarLinhaEquipa(id);
  if (!linha) throw new Error("Equipa não encontrada.");

  // B:C e E:F em separado — a coluna D (Edição) nunca é tocada.
  const { sheets, sheetId } = getSheetsClient();
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: {
      valueInputOption: "RAW",
      data: [
        { range: `Equipas!B${linha}:C${linha}`, values: [[nome, cor]] },
        {
          range: `Equipas!E${linha}:F${linha}`,
          values: [[monitores.join(", "), lugar > 0 ? lugar : ""]],
        },
      ],
    },
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
          range: `Inscrições!W${i.rowIndex}`,
          values: [[""]],
        })),
      },
    });
  }

  // Limpa a linha em vez de a apagar, para não desalinhar as restantes linhas.
  await sheets.spreadsheets.values.clear({
    spreadsheetId: sheetId,
    range: `Equipas!A${linha}:F${linha}`,
  });
}

export async function atualizarEquipaInscrito(rowIndex: number, equipaId: string) {
  const { sheets, sheetId } = getSheetsClient();

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `Inscrições!W${rowIndex}`,
    valueInputOption: "RAW",
    requestBody: { values: [[equipaId]] },
  });
}

/**
 * Contas: aba própria "Contas", com uma linha por movimento (entrada ou saída):
 * A=Data, B=Título, C=Categoria, D=Pago por, E=Valor, F=Comprovativo,
 * G=Edição, H=Tipo, I=Nota.
 *
 * As inscrições não aparecem aqui — entram sozinhas no /admin (pagos × valor).
 * A edição fica guardada na própria linha (e não deduzida da data) porque um
 * pagamento feito depois do FIRE pertence à edição que acabou, não à seguinte.
 * Linhas sem Tipo contam como saída (eram todas despesas antes de haver entradas).
 */
export type Movimento = {
  rowIndex: number;
  tipo: TipoMovimento;
  data: string;
  titulo: string;
  categoria: string;
  /** Só nas saídas. */
  pagoPor: string;
  /** Sempre positivo — o sinal vem do tipo. */
  valorCentimos: number;
  comprovativo: string;
  edicao: number;
  nota: string;
};

export type NovoMovimento = Omit<Movimento, "rowIndex">;

const CONTAS_RANGE = "Contas!A:I";

/** Lê "128,45", "128.45" ou "1.234,56" e devolve o valor em cêntimos. */
function valorParaCentimos(valor: string): number {
  const limpo = String(valor)
    .replace(/[^\d.,-]/g, "")
    .trim();
  if (!limpo) return 0;

  let normalizado = limpo;
  if (limpo.includes(",") && limpo.includes(".")) {
    // Formato português: o ponto separa milhares e a vírgula os decimais.
    normalizado = limpo.replace(/\./g, "").replace(",", ".");
  } else if (limpo.includes(",")) {
    normalizado = limpo.replace(",", ".");
  }

  const numero = Number(normalizado);
  return Number.isFinite(numero) ? Math.round(numero * 100) : 0;
}

function movimentoParaLinha(m: NovoMovimento) {
  return [
    m.data,
    m.titulo,
    m.categoria,
    m.tipo === "saida" ? m.pagoPor : "",
    m.valorCentimos / 100,
    m.comprovativo,
    m.edicao,
    TIPOS[m.tipo],
    m.nota,
  ];
}

export async function getMovimentos(): Promise<Movimento[]> {
  const { sheets, sheetId } = getSheetsClient();

  let rows: string[][];
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Contas!A2:I",
    });
    rows = (res.data.values ?? []) as string[][];
  } catch (err) {
    // A aba ainda não existe — o /admin continua a funcionar sem contas.
    console.error("Não foi possível ler a aba Contas:", err);
    return [];
  }

  return rows
    .map((row, i) => ({
      rowIndex: i + 2,
      data: row[0] ?? "",
      titulo: row[1] ?? "",
      categoria: row[2] ?? "",
      pagoPor: row[3] ?? "",
      valorCentimos: valorParaCentimos(row[4] ?? ""),
      comprovativo: row[5] ?? "",
      edicao: Number(row[6]) || 0,
      tipo: lerTipo(row[7]),
      nota: row[8] ?? "",
    }))
    .filter((m) => m.titulo);
}

export async function criarMovimento(movimento: NovoMovimento): Promise<Movimento> {
  const { sheets, sheetId } = getSheetsClient();

  const res = await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: CONTAS_RANGE,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [movimentoParaLinha(movimento)] },
  });

  const updatedRange = res.data.updates?.updatedRange ?? "";
  const match = updatedRange.match(/(\d+):/) ?? updatedRange.match(/(\d+)$/);
  return { ...movimento, rowIndex: match ? Number(match[1]) : 0 };
}

export async function atualizarMovimento(rowIndex: number, movimento: NovoMovimento) {
  const { sheets, sheetId } = getSheetsClient();

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `Contas!A${rowIndex}:I${rowIndex}`,
    valueInputOption: "RAW",
    requestBody: { values: [movimentoParaLinha(movimento)] },
  });
}

export async function eliminarMovimento(rowIndex: number) {
  const { sheets, sheetId } = getSheetsClient();

  // Limpa a linha em vez de a apagar, para não desalinhar as restantes.
  await sheets.spreadsheets.values.clear({
    spreadsheetId: sheetId,
    range: `Contas!A${rowIndex}:I${rowIndex}`,
  });
}

/**
 * Feedback: aba própria "Feedback", pela mesma ordem do questionário em papel:
 * A=Data, B=Gostou, C=Melhorar, D=Mensagem, E=OQueFoi, F=Volta, G=Ambiente,
 * H=Atividades, I=Comida, J=Espaço, K=Estrelas, L=Edição, M=Nome.
 *
 * Configuração adicional necessária (ver README.md):
 * 6. Criar uma aba chamada "Feedback" com esse cabeçalho.
 */
export type Feedback = {
  rowIndex: number;
  data: string;
  nome: string;
  gostou: string;
  melhorar: string;
  mensagem: string;
  oQueFoi: string;
  volta: string;
  ambiente: string;
  atividades: string;
  comida: string;
  espaco: string;
  avaliacao: number;
  edicao: number;
};

const FEEDBACK_RANGE = "Feedback!A:M";

export async function getFeedback(): Promise<Feedback[]> {
  const { sheets, sheetId } = getSheetsClient();

  let rows: string[][];
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Feedback!A2:M",
    });
    rows = (res.data.values ?? []) as string[][];
  } catch (err) {
    // A aba ainda não existe — o /admin continua a funcionar sem feedback.
    console.error("Não foi possível ler a aba Feedback:", err);
    return [];
  }

  return rows
    .map((row, i) => ({
      rowIndex: i + 2,
      data: row[0] ?? "",
      gostou: row[1] ?? "",
      melhorar: row[2] ?? "",
      mensagem: row[3] ?? "",
      oQueFoi: row[4] ?? "",
      volta: row[5] ?? "",
      ambiente: row[6] ?? "",
      atividades: row[7] ?? "",
      comida: row[8] ?? "",
      espaco: row[9] ?? "",
      // Aceita meias estrelas vindas do papel ("4,5" ou "4.5"); 0 = sem estrelas.
      avaliacao: Number(String(row[10] ?? "").replace(",", ".")) || 0,
      edicao: Number(row[11]) || 0,
      nome: row[12] ?? "",
    }))
    .filter((f) => f.avaliacao > 0 || f.gostou || f.melhorar || f.mensagem || f.oQueFoi);
}

export async function guardarFeedback(resposta: Omit<Feedback, "rowIndex" | "data">) {
  const { sheets, sheetId } = getSheetsClient();

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: FEEDBACK_RANGE,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [
        [
          new Date().toISOString(),
          resposta.gostou,
          resposta.melhorar,
          resposta.mensagem,
          resposta.oQueFoi,
          resposta.volta,
          resposta.ambiente,
          resposta.atividades,
          resposta.comida,
          resposta.espaco,
          resposta.avaliacao,
          resposta.edicao,
          resposta.nome,
        ],
      ],
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
  equipaId: string;
  origemPagamento: string;
  nota: string;
  edicao: number;
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
    nota: row[20] ?? "",
    origemPagamento: row[21] ?? "",
    equipaId: row[22] ?? "",
    edicao: Number(row[23]) || 0,
  };
}

/** Lê todas as inscrições da Sheet (sem a linha de cabeçalho). */
export async function getInscricoes(): Promise<InscritoRow[]> {
  const { sheets, sheetId } = getSheetsClient();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${SHEET_RANGE.split("!")[0]}!A2:X`,
  });

  const rows = res.data.values ?? [];
  return rows.map((row, i) => linhaParaInscrito(row, i + 2));
}

/** Lê uma única inscrição pelo número da linha na Sheet. */
export async function getInscricaoPorLinha(rowIndex: number): Promise<InscritoRow | null> {
  const { sheets, sheetId } = getSheetsClient();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `Inscrições!A${rowIndex}:X${rowIndex}`,
  });

  const row = res.data.values?.[0];
  if (!row) return null;

  return linhaParaInscrito(row, rowIndex);
}
