import { z } from "zod";

// ---------- Clients ----------
export const clientSchema = z.object({
  type: z.enum(["pf", "pj"]),
  name: z.string().trim().min(2, "Nome obrigatório").max(200),
  cpf_cnpj: z.string().trim().max(20).optional().or(z.literal("")),
  rg_ie: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.string().trim().email("Email inválido").max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  whatsapp: z.string().trim().max(30).optional().or(z.literal("")),
  birth_date: z.string().optional().or(z.literal("")),
  tier: z.enum(["bronze", "prata", "ouro", "diamante"]).default("bronze"),
  is_active: z.boolean().default(true),
  address_street: z.string().trim().max(200).optional().or(z.literal("")),
  address_number: z.string().trim().max(20).optional().or(z.literal("")),
  address_complement: z.string().trim().max(100).optional().or(z.literal("")),
  address_district: z.string().trim().max(100).optional().or(z.literal("")),
  address_city: z.string().trim().max(100).optional().or(z.literal("")),
  address_state: z.string().trim().max(2).optional().or(z.literal("")),
  address_zip: z.string().trim().max(10).optional().or(z.literal("")),
  resp1_name: z.string().trim().max(150).optional().or(z.literal("")),
  resp1_cpf: z.string().trim().max(20).optional().or(z.literal("")),
  resp1_phone: z.string().trim().max(30).optional().or(z.literal("")),
  resp1_email: z.string().trim().email().max(255).optional().or(z.literal("")),
  notes_internal: z.string().trim().max(2000).optional().or(z.literal("")),
});
export type ClientForm = z.infer<typeof clientSchema>;

// ---------- Products ----------
export const productSchema = z.object({
  name: z.string().trim().min(2, "Nome obrigatório").max(200),
  category_id: z.string().uuid().nullable().optional(),
  sku: z.string().trim().max(50).optional().or(z.literal("")),
  ean: z.string().trim().max(20).optional().or(z.literal("")),
  brand: z.string().trim().max(100).optional().or(z.literal("")),
  description_short: z.string().trim().max(500).optional().or(z.literal("")),
  description_long: z.string().trim().max(5000).optional().or(z.literal("")),
  image_main_url: z.string().trim().max(500).optional().or(z.literal("")).nullable(),
  images: z.array(z.string()).max(3).default([]),
  unit_measure: z.string().trim().max(10).optional().or(z.literal("")),
  weight_kg: z.coerce.number().min(0).optional(),
  cost_last: z.coerce.number().min(0).optional(),
  price_sale: z.coerce.number().min(0, "Preço obrigatório"),
  price_min: z.coerce.number().min(0).optional(),
  price_bronze: z.coerce.number().min(0).optional(),
  price_prata: z.coerce.number().min(0).optional(),
  price_ouro: z.coerce.number().min(0).optional(),
  price_diamante: z.coerce.number().min(0).optional(),
  cashback_pct: z.coerce.number().min(0).max(100).default(0),
  stock_qty: z.coerce.number().int().min(0).default(0),
  stock_min: z.coerce.number().int().min(0).optional(),
  stock_location: z.string().trim().max(100).optional().or(z.literal("")),
  is_active: z.boolean().default(true),
  // NF-e / SEFAZ fields
  ncm: z.string().trim().max(10).optional().or(z.literal("")),
  cest: z.string().trim().max(10).optional().or(z.literal("")),
  cfop: z.string().trim().max(10).optional().or(z.literal("")),
  origem: z.string().trim().max(2).optional().or(z.literal("")),
  unidade_tributavel: z.string().trim().max(10).optional().or(z.literal("")),
  ean_tributavel: z.string().trim().max(20).optional().or(z.literal("")),
  fator_conversao_tributavel: z.coerce.number().min(0).optional(),
  cst_icms: z.string().trim().max(5).optional().or(z.literal("")),
  csosn: z.string().trim().max(5).optional().or(z.literal("")),
  aliquota_icms: z.coerce.number().min(0).max(100).optional(),
  aliquota_icms_st: z.coerce.number().min(0).max(100).optional(),
  cst_ipi: z.string().trim().max(5).optional().or(z.literal("")),
  aliquota_ipi: z.coerce.number().min(0).max(100).optional(),
  cst_pis: z.string().trim().max(5).optional().or(z.literal("")),
  aliquota_pis: z.coerce.number().min(0).max(100).optional(),
  cst_cofins: z.string().trim().max(5).optional().or(z.literal("")),
  aliquota_cofins: z.coerce.number().min(0).max(100).optional(),
  codigo_beneficio_fiscal: z.string().trim().max(20).optional().or(z.literal("")),
  peso_bruto_kg: z.coerce.number().min(0).optional(),
  peso_liquido_kg: z.coerce.number().min(0).optional(),
  valor_aproximado_tributos: z.coerce.number().min(0).optional(),
  codigo_anp: z.string().trim().max(20).optional().or(z.literal("")),
  escala_relevante: z.string().trim().max(5).optional().or(z.literal("")),
  cnpj_fabricante: z.string().trim().max(20).optional().or(z.literal("")),
  gtin_embalagem: z.string().trim().max(20).optional().or(z.literal("")),
  informacoes_adicionais: z.string().trim().max(2000).optional().or(z.literal("")),
});
export type ProductForm = z.infer<typeof productSchema>;

// ---------- Orders ----------
export const orderItemSchema = z.object({
  product_id: z.string().uuid("Selecione um produto"),
  qty: z.coerce.number().positive("Qtd > 0"),
  unit_price: z.coerce.number().min(0),
  discount_pct: z.coerce.number().min(0).max(100).default(0),
});
export type OrderItemForm = z.infer<typeof orderItemSchema>;

export const orderSchema = z.object({
  client_id: z.string().uuid("Selecione um cliente"),
  type: z.enum(["pdv", "ecommerce", "orcamento"]).default("pdv"),
  payment_method: z.string().trim().max(50).optional().or(z.literal("")),
  installments: z.coerce.number().int().min(1).max(24).default(1),
  discount_pct: z.coerce.number().min(0).max(100).default(0),
  cashback_used: z.coerce.number().min(0).default(0),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  items: z.array(orderItemSchema).min(1, "Adicione ao menos 1 item"),
});
export type OrderForm = z.infer<typeof orderSchema>;
