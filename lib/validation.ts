import { z } from "zod";

// Campos do formulário, tal como no Google Form original ("Inscrição Fire").
// Para adicionar/remover campos: muda aqui, no InscricaoForm.tsx e no email de confirmação.
export const inscricaoSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, "Indica o nome completo."),
  dataNascimento: z
    .string()
    .min(1, "Indica a data de nascimento.")
    .refine((val) => !Number.isNaN(Date.parse(val)), "Data inválida."),
  email: z.string().trim().email("Indica um email válido."),
  contacto: z
    .string()
    .trim()
    .regex(/^9\d{8}$/, "Indica um número português válido (9 dígitos, começa em 9)."),
  contactoEmergencia: z
    .string()
    .trim()
    .regex(/^9\d{8}$/, "Indica um número português válido (9 dígitos, começa em 9)."),
  // honeypot anti-spam: deve vir sempre vazio; bots costumam preencher tudo
  empresa: z.string().max(0).optional().or(z.literal("")),
});

export type InscricaoInput = z.infer<typeof inscricaoSchema>;
