# ProjectLife — Inscrições Fire

Site de inscrição para o campo Fire (Project Life), construído em Next.js + TypeScript.
Substitui o Google Form: guarda as inscrições numa Google Sheet e envia um email de
confirmação automático. (WhatsApp fica para depois, se quiseres adicionar.)

## Estrutura

```
app/
  page.tsx              → página principal (hero + formulário)
  api/inscricao/route.ts → endpoint que recebe o POST do formulário
  layout.tsx            → fontes e metadata
components/
  InscricaoForm.tsx     → o formulário em si
lib/
  validation.ts         → schema dos campos (zod) — muda aqui para adicionar/remover campos
  sheets.ts             → escreve a inscrição na Google Sheet
  email.ts              → envia o email de confirmação (Resend)
```

## 1. Instalar dependências

Precisas de [Node.js](https://nodejs.org) instalado (18+).

```bash
cd ProjectLife
npm install
```

## 2. Configurar a Google Sheet

1. Cria uma Google Sheet nova, com uma aba chamada **"Inscrições"** e a primeira linha com cabeçalhos, por exemplo: `Data | Nome | Data de Nascimento | Email | Contacto | Contacto Emergência`.
2. Vai a [console.cloud.google.com](https://console.cloud.google.com), cria um projeto (ou usa um existente).
3. Ativa a **Google Sheets API** (menu "APIs & Services" → "Enable APIs").
4. Cria uma **Service Account** ("APIs & Services" → "Credentials" → "Create Credentials" → "Service Account").
5. Dentro da Service Account, cria uma **chave (JSON)** — faz download do ficheiro.
6. No ficheiro JSON, copia o `client_email` e o `private_key`.
7. **Partilha a tua Google Sheet** com esse `client_email`, com permissão de **Editor** (é exatamente como partilhar com uma pessoa, mas é um email tipo `algo@algo.iam.gserviceaccount.com`).
8. O `GOOGLE_SHEET_ID` é a parte do URL da sheet entre `/d/` e `/edit`:
   `https://docs.google.com/spreadsheets/d/ESTE_ID_AQUI/edit`

## 3. Configurar o email (Resend)

1. Cria conta grátis em [resend.com](https://resend.com).
2. Gera uma **API Key** (Dashboard → API Keys).
3. Para já podes usar o domínio de testes do Resend para o `FROM_EMAIL` (funciona logo, mas com limitações). Quando quiseres usar o teu próprio domínio (ex: `inscricoes@projectlife.pt`), o Resend guia-te a verificar o domínio (adicionar uns registos DNS).
4. `COORDINATOR_EMAIL` é o email que recebe uma notificação de cada nova inscrição, com um link para a Google Sheet.

⚠️ **Limitação do domínio de testes (`onboarding@resend.dev`)**: só consegues enviar emails para o próprio email da tua conta Resend. Ou seja, enquanto não verificares um domínio próprio, o email de confirmação só chega a inscritos cujo email seja igual ao da tua conta Resend, e o `COORDINATOR_EMAIL` tem de ser esse mesmo email para a notificação funcionar.

## 4. Variáveis de ambiente

Copia `.env.example` para `.env.local` e preenche:

```bash
cp .env.example .env.local
```

⚠️ Atenção ao `GOOGLE_PRIVATE_KEY`: no ficheiro JSON vem com `\n` literais — copia tal e qual entre aspas, o código já trata da conversão.

## Ver inscritos (/admin)

Página protegida por password simples em `/admin` que lista todas as inscrições da Google Sheet.

1. Define `ADMIN_PASSWORD` no `.env.local` (e no Vercel, para produção).
2. Abre `/admin` e entra com essa password.

⚠️ É uma proteção simples (uma única password partilhada), suficiente para uso interno da equipa — não é um sistema de utilizadores.

## 5. Correr localmente

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## 6. Deploy no Vercel

1. Cria um repositório no GitHub e faz push deste projeto.
2. Em [vercel.com](https://vercel.com), "Add New Project" → importa o repositório.
3. Em "Environment Variables", adiciona as mesmas 7 variáveis do `.env.local`.
4. Deploy. Ficas com um URL tipo `projectlife.vercel.app`.

Cada vez que fizeres push para o `main`, o Vercel faz deploy automático.

## Adicionar mais campos

Sempre que o formulário do campo mudar (ex: adicionar "Alergias" ou "T-shirt"):

1. Adiciona o campo a `lib/validation.ts` (schema zod).
2. Adiciona o `<Field>` correspondente em `components/InscricaoForm.tsx`.
3. Adiciona a coluna em `lib/sheets.ts` (array `values`) e na própria Google Sheet.
4. Opcional: inclui no email em `lib/email.ts`.

## Adicionar WhatsApp mais tarde

Quando quiseres, criamos `lib/whatsapp.ts` ligado à WhatsApp Cloud API oficial da Meta,
chamado a seguir ao `sendConfirmationEmail` em `app/api/inscricao/route.ts` — a estrutura
já está pronta para isso, sem precisar de mexer no resto.

## Roadmap

1. Integração WhatsApp (ver secção acima).
2. Depois do WhatsApp: analisar integração de pagamentos com **MB WAY** — incluindo instruções para pagamento bancário e notificação quando o pagamento for efetuado.
3. Depois disso: rever a UI toda e o formulário.
