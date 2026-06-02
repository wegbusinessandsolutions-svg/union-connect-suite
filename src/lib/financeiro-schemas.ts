import { z } from "zod";

const optStr = (max = 200) => z.string().trim().max(max).optional().or(z.literal(""));

export const supplierSchema = z.object({
  razao_social: z.string().trim().min(2, "Razão social obrigatória").max(200),
  nome_fantasia: optStr(200),
  cnpj: optStr(20),
  ie: optStr(30),
  email: z.string().trim().email("Email inválido").max(255).optional().or(z.literal("")),
  phone: optStr(30),
  whatsapp: optStr(30),
  site: optStr(255),
  rep_name: optStr(150),
  rep_phone: optStr(30),
  rep_email: z.string().trim().email().max(255).optional().or(z.literal("")),
  bank_name: optStr(100),
  bank_agency: optStr(30),
  bank_account: optStr(30),
  bank_pix: optStr(100),
  payment_terms: optStr(100),
  avg_delivery_days: z.coerce.number().int().min(0).optional(),
  rating: z.coerce.number().int().min(0).max(5).optional(),
  address_zip: optStr(10),
  address_street: optStr(200),
  address_number: optStr(20),
  address_complement: optStr(100),
  address_district: optStr(100),
  address_city: optStr(100),
  address_state: optStr(2),
  notes: optStr(2000),
  is_active: z.boolean().default(true),
});
export type SupplierForm = z.infer<typeof supplierSchema>;

export const costCenterSchema = z.object({
  name: z.string().trim().min(2, "Nome obrigatório").max(150),
  category: z.enum(["receita", "despesa", "investimento", "transferencia"]),
  parent_id: z.string().uuid().optional().or(z.literal("")),
  is_active: z.boolean().default(true),
});
export type CostCenterForm = z.infer<typeof costCenterSchema>;

export const bankAccountSchema = z.object({
  bank_id: z.string().uuid("Selecione um banco").optional().or(z.literal("")),
  type: z.enum(["corrente", "poupanca", "pagamento", "investimento", "caixa"]),
  agency: optStr(30),
  account: optStr(30),
  pix_key: optStr(100),
  balance_initial: z.coerce.number().default(0),
  balance_current: z.coerce.number().default(0),
  is_active: z.boolean().default(true),
});
export type BankAccountForm = z.infer<typeof bankAccountSchema>;

const financialBase = {
  description: optStr(500),
  total: z.coerce.number().positive("Valor > 0"),
  due_date: z.string().min(1, "Vencimento obrigatório"),
  installments: z.coerce.number().int().min(1).max(60).default(1),
  paid_value: z.coerce.number().min(0).optional(),
  paid_at: z.string().optional().or(z.literal("")),
  status: z.enum(["aberto", "pago", "vencido", "cancelado", "parcial"]).default("aberto"),
  bank_account_id: z.string().uuid().optional().or(z.literal("")),
  cost_center_id: z.string().uuid().optional().or(z.literal("")),
};

export const payableSchema = z.object({
  ...financialBase,
  supplier_id: z.string().uuid().optional().or(z.literal("")),
  is_recurring: z.boolean().default(false),
  recurrence_day: z.coerce.number().int().min(1).max(31).optional(),
  nf_url: z.string().trim().url("URL inválida").optional().or(z.literal("")),
});
export type PayableForm = z.infer<typeof payableSchema>;

export const receivableSchema = z.object({
  ...financialBase,
  client_id: z.string().uuid().optional().or(z.literal("")),
});
export type ReceivableForm = z.infer<typeof receivableSchema>;
