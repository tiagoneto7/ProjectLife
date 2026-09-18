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

1. Cria uma Google Sheet nova, com uma aba chamada **"Inscrições"** e a primeira linha com cabeçalhos: `Data | Nome | Data de Nascimento | Email | Contacto | Contacto de Emergência | Restrições Alimentares | Restrições na Atividade Física | Alergias | Outros | Menor de 18 | Nome do Responsável | Grau de Parentesco | Email do Responsável | Contacto do Responsável | Observações | Consentimento Dados | Consentimento Imagens | Consentimento Contacto | Estado`.
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
3. Domínio `projectlife.pt` já verificado no Resend (DKIM, SPF, MX, DMARC configurados em `my.dominios.pt`). `FROM_EMAIL` usa `inscricoes@projectlife.pt` — já envia para qualquer destinatário, sem as limitações do domínio de testes.
4. `COORDINATOR_EMAIL` é o email que recebe uma notificação de cada nova inscrição, com um link para a Google Sheet.

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

A coluna **Estado** (`Pendente`/`Pago`) é escrita automaticamente como "Pendente" em cada nova inscrição, e é manual: para marcar como paga, edita diretamente essa célula na Google Sheet (até termos os pagamentos MB WAY automatizados).

⚠️ É uma proteção simples (uma única password partilhada), suficiente para uso interno da equipa — não é um sistema de utilizadores.

### Equipas

Para o construtor de equipas (botão "Equipas" no `/admin`), a Google Sheet precisa de mais dois ajustes:

1. Cria uma aba nova chamada **"Equipas"**, com cabeçalho `ID | Nome | Cor | Edicao` (colunas A a D).
2. Na aba **"Inscrições"**, adiciona um cabeçalho na coluna **V** (ex: `EquipaId`) — é onde fica guardada a equipa de cada inscrito.

Cada edição tem as suas equipas (é para isso que serve a coluna `Edicao`): sem ela, renomear ou
apagar uma equipa numa edição mexia também no arquivo das anteriores — e apagar chegava a limpar as
atribuições dos inscritos de anos passados.

### Estados de pagamento e notas

A coluna **Estado** aceita três valores:

- `Pago` — pagou, conta para a receita nas Despesas;
- `Vaga social` — não pagou, mas a inscrição fica validada à mesma (entra nas listas, emails e
  equipas como qualquer validado, mas **não** conta para a receita);
- `Pendente`.

O email de confirmação de pagamento nunca é enviado a uma vaga social — confirmaria a receção de um
pagamento que não houve. A modal do Estado nem sequer oferece essa opção nesse caso.

Na aba **"Inscrições"**, a coluna **W** (ex: `Nota`) guarda uma nota livre da equipa sobre cada
inscrito (ex: "pagou em mãos ao Tiago"), escrita na mesma modal do Estado e visível por baixo dele
na tabela.

### Origem do pagamento

Para saber se um pagamento foi validado automaticamente (Stripe/MB WAY) ou marcado manualmente no `/admin`, adiciona mais um cabeçalho na aba **"Inscrições"**, na coluna **U** (ex: `OrigemPagamento`). Fica com `Automático` ou `Manual`, consoante o caso — e aparece como "(auto)"/"(manual)" ao lado do Estado no `/admin`.

### Separadores do /admin: Despesas e Feedback

O `/admin` tem três separadores. Cada um precisa da sua aba na Google Sheet:

1. **"Despesas"** — cabeçalho `Data | Descrição | Categoria | Pago por | Valor | Comprovativo | Edição`
   (colunas A a G).
2. **"Feedback"** — cabeçalho, pela mesma ordem do questionário em papel (colunas A a M):
   `Data | Gostou | Melhorar | Mensagem | OQueFoi | Volta | Ambiente | Atividades | Comida | Espaco | Estrelas | Edicao | Nome`.
   É preenchida sozinha pelo formulário público em `/fire/feedback`.

Enquanto uma destas abas não existir, o separador aparece vazio e o erro fica só no log — o
`/admin` continua a funcionar normalmente.

### Arquivo por edição

As inscrições de cada edição do FIRE fecham **5 dias depois do fim do evento**
(`DIAS_ATE_ARQUIVAR` em `lib/evento.ts`). A partir daí ficam no separador da edição desse ano,
só para consulta, e as inscrições novas passam a contar para a edição seguinte — para a próxima
edição começar com a página limpa.

A edição fica gravada na coluna **X** da aba "Inscrições" no momento da inscrição (se estiver vazia,
é deduzida da data da coluna A, para linhas antigas). Guardá-la evita que o arquivo se reescreva
sozinho: a dedução usa um único `EVENTO.fim` para todos os anos, por isso mudar as datas do FIRE
num ano futuro reclassificaria inscrições passadas. As despesas, as equipas e o feedback guardam a
edição pela mesma razão.

**De ano para ano**, muda só o `lib/evento.ts` (`edicao`, `fim`, `datasLabel`, `local`, `valor`) —
é o único sítio onde a data do FIRE está definida e daí acompanha o site, os emails e o arquivo.
Enquanto o `edicao` não for atualizado, as despesas e o feedback dessa edição continuam a poder ser
registados.

### Emails que falham a enviar (bounces)

O `resend.batch.send()` só confirma que os emails foram colocados na fila — não avisa aqui se algum
falhar. Se um endereço já tiver tido *hard bounces* antes, o Resend bloqueia-o automaticamente
("suppression list"), e isso só é visível no [dashboard do Resend](https://resend.com/emails)
(secção Emails → Events), não no `/admin`. Depois de um envio em massa (ex: "Enviar Emails"),
vale a pena confirmar lá que tudo foi entregue. Não há webhook configurado para isto — se um dia
quiseres alertas automáticos, dá para montar um webhook do Resend igual ao que já existe para o
Stripe (`app/api/stripe/webhook`).

## Regulamento (PDF) para download

O ficheiro `public/regulamento-fire.pdf` fica acessível em `/regulamento-fire.pdf` e é
sugerido ao inscrito logo após submeter o formulário, e também linkado no email de
confirmação (via `NEXT_PUBLIC_SITE_URL`, para gerar o link absoluto).

Para atualizar o regulamento, basta substituir esse ficheiro por uma versão nova com o
mesmo nome.

## 5. Correr localmente

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## 6. Deploy no Vercel

1. Cria um repositório no GitHub e faz push deste projeto.
2. Em [vercel.com](https://vercel.com), "Add New Project" → importa o repositório.
3. Em "Environment Variables", adiciona as mesmas variáveis do `.env.local` (define `NEXT_PUBLIC_SITE_URL` com o URL final do Vercel, ex: `https://projectlife.vercel.app`).
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
