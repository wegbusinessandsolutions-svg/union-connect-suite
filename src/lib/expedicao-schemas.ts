import { z } from "zod";

const optStr = (max = 200) => z.string().trim().max(max).optional().or(z.literal(""));

export const deliverySchema = z.object({
  order_id: z.string().uuid("Pedido obrigatório"),
  status: z.enum(["aguardando", "em_rota", "entregue", "falha"]).default("aguardando"),
  deliverer_id: z.string().uuid().optional().or(z.literal("")),
  pickup_at: optStr(50),
  delivered_at: optStr(50),
  receiver_name: optStr(150),
  receiver_role: optStr(80),
  receiver_phone: optStr(30),
  proof_photo_url: z.string().trim().url().optional().or(z.literal("")),
  route_map_url: z.string().trim().url().optional().or(z.literal("")),
  notes: optStr(1000),
});
export type DeliveryForm = z.infer<typeof deliverySchema>;

export const stockMovementSchema = z.object({
  product_id: z.string().uuid("Produto obrigatório"),
  type: z.enum(["entrada", "saida", "ajuste", "inventario"]),
  qty: z.coerce.number().int().min(1, "Quantidade > 0"),
  reason: optStr(300),
});
export type StockMovementForm = z.infer<typeof stockMovementSchema>;
