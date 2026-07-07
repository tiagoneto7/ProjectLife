import { z } from "zod";

const telefonePT = /^9\d{8}$/;

// Campos do formulário, tal como no Google Form original ("Inscrição Fire").
// Para adicionar/remover campos: muda aqui, no InscricaoForm.tsx e no email de confirmação.
export const inscricaoSchema = z
  .object({
    nome: z.string().trim().min(3, "Indica o nome completo."),
    dataNascimento: z
      .string()
      .min(1, "Indica a data de nascimento.")
      .refine((val) => !Number.isNaN(Date.parse(val)), "Data inválida."),
    email: z.string().trim().email("Indica um email válido."),
    contacto: z
      .string()
      .trim()
      .regex(telefonePT, "Indica um número português válido (9 dígitos, começa em 9)."),
    contactoEmergencia: z
      .string()
      .trim()
      .regex(telefonePT, "Indica um número português válido (9 dígitos, começa em 9)."),

    // Saúde — todos opcionais
    restricoesAlimentares: z.string().trim().optional().or(z.literal("")),
    restricoesAtividadeFisica: z.string().trim().optional().or(z.literal("")),
    alergias: z.string().trim().optional().or(z.literal("")),
    outros: z.string().trim().optional().or(z.literal("")),

    // Menor de 18 anos — se "sim", os campos do responsável tornam-se obrigatórios
    menorDe18: z.enum(["sim", "nao"], {
      errorMap: () => ({ message: "Indica se és menor de 18 anos." }),
    }),
    nomeResponsavel: z.string().trim().optional().or(z.literal("")),
    grauParentesco: z.string().trim().optional().or(z.literal("")),
    emailResponsavel: z.string().trim().optional().or(z.literal("")),
    contactoResponsavel: z.string().trim().optional().or(z.literal("")),

    observacoes: z.string().trim().optional().or(z.literal("")),

    consentimentoDados: z.boolean().refine((val) => val === true, "Tens de aceitar para submeter."),
    consentimentoImagens: z.boolean().refine((val) => val === true, "Tens de aceitar para submeter."),
    consentimentoContacto: z.boolean().refine((val) => val === true, "Tens de aceitar para submeter."),

    // honeypot anti-spam: deve vir sempre vazio; bots costumam preencher tudo
    empresa: z.string().max(0).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.menorDe18 !== "sim") return;

    if (!data.nomeResponsavel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nomeResponsavel"],
        message: "Indica o nome do responsável.",
      });
    }
    if (!data.grauParentesco) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["grauParentesco"],
        message: "Indica o grau de parentesco.",
      });
    }
    if (!data.emailResponsavel || !z.string().email().safeParse(data.emailResponsavel).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["emailResponsavel"],
        message: "Indica um email válido do responsável.",
      });
    }
    if (!data.contactoResponsavel || !telefonePT.test(data.contactoResponsavel)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["contactoResponsavel"],
        message: "Indica um número português válido do responsável.",
      });
    }
  });

export type InscricaoInput = z.infer<typeof inscricaoSchema>;
