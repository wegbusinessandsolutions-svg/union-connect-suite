// Per-entity ReportData builders for the analytical print/PDF feature.
import type { Tables } from "@/integrations/supabase/types";
import { date, datetime, money, yesno, type ReportData } from "@/lib/report";

export function clientReport(c: Tables<"clients">): ReportData {
  return {
    title: `Ficha do Cliente — ${c.name}`,
    subtitle: c.cpf_cnpj ?? undefined,
    sections: [
      {
        title: "Identificação",
        fields: [
          { label: "Nome / Razão Social", value: c.name },
          { label: "Tipo", value: c.type === "pj" ? "Pessoa Jurídica" : "Pessoa Física" },
          { label: "CPF/CNPJ", value: c.cpf_cnpj },
          { label: "RG/IE", value: c.rg_ie },
          { label: "Data nascimento", value: date(c.birth_date) },
          { label: "Tier", value: c.tier },
          { label: "Ativo", value: yesno(c.is_active) },
          { label: "Saldo cashback", value: money(c.cashback_balance) },
        ],
      },
      {
        title: "Contato",
        fields: [
          { label: "E-mail", value: c.email },
          { label: "Telefone", value: c.phone },
          { label: "WhatsApp", value: c.whatsapp },
        ],
      },
      {
        title: "Endereço",
        fields: [
          { label: "Logradouro", value: c.address_street },
          { label: "Número", value: c.address_number },
          { label: "Complemento", value: c.address_complement },
          { label: "Bairro", value: c.address_district },
          { label: "Cidade", value: c.address_city },
          { label: "UF", value: c.address_state },
          { label: "CEP", value: c.address_zip },
        ],
      },
      {
        title: "Responsável",
        fields: [
          { label: "Nome", value: c.resp1_name },
          { label: "CPF", value: c.resp1_cpf },
          { label: "Telefone", value: c.resp1_phone },
          { label: "E-mail", value: c.resp1_email },
        ],
      },
      {
        title: "Observações",
        fields: [{ label: "Notas internas", value: c.notes_internal }],
      },
      {
        title: "Auditoria",
        fields: [
          { label: "Criado em", value: datetime(c.created_at) },
          { label: "Atualizado em", value: datetime(c.updated_at) },
        ],
      },
    ],
  };
}

export function productReport(p: Tables<"products">): ReportData {
  return {
    title: `Ficha do Produto — ${p.name}`,
    subtitle: p.sku ?? undefined,
    sections: [
      {
        title: "Identificação",
        fields: [
          { label: "Nome", value: p.name },
          { label: "SKU", value: p.sku },
          { label: "EAN", value: p.ean },
          { label: "Marca", value: p.brand },
          { label: "Descrição curta", value: p.description_short },
          { label: "Descrição longa", value: p.description_long },
          { label: "Ativo", value: yesno(p.is_active) },
        ],
      },
      {
        title: "Preços e cashback",
        fields: [
          { label: "Custo último", value: money(p.cost_last) },
          { label: "Preço venda", value: money(p.price_sale) },
          { label: "Preço mínimo", value: money(p.price_min) },
          { label: "Bronze", value: money(p.price_bronze) },
          { label: "Prata", value: money(p.price_prata) },
          { label: "Ouro", value: money(p.price_ouro) },
          { label: "Diamante", value: money(p.price_diamante) },
          { label: "Cashback %", value: `${Number(p.cashback_pct ?? 0).toFixed(2)}%` },
        ],
      },
      {
        title: "Estoque",
        fields: [
          { label: "Quantidade", value: p.stock_qty },
          { label: "Mínimo", value: p.stock_min },
          { label: "Localização", value: p.stock_location },
          { label: "Unidade", value: p.unit_measure },
          { label: "Peso (kg)", value: p.weight_kg },
        ],
      },
      {
        title: "Fiscal — NF-e (SEFAZ)",
        fields: [
          { label: "NCM", value: p.ncm },
          { label: "CEST", value: p.cest },
          { label: "CFOP", value: p.cfop },
          { label: "Origem", value: p.origem },
          { label: "Unidade tributável", value: p.unidade_tributavel },
          { label: "EAN tributável", value: p.ean_tributavel },
          { label: "Fator conversão", value: p.fator_conversao_tributavel },
          { label: "CST ICMS", value: p.cst_icms },
          { label: "CSOSN", value: p.csosn },
          { label: "Alíquota ICMS %", value: p.aliquota_icms },
          { label: "Alíquota ICMS-ST %", value: p.aliquota_icms_st },
          { label: "CST IPI", value: p.cst_ipi },
          { label: "Alíquota IPI %", value: p.aliquota_ipi },
          { label: "CST PIS", value: p.cst_pis },
          { label: "Alíquota PIS %", value: p.aliquota_pis },
          { label: "CST COFINS", value: p.cst_cofins },
          { label: "Alíquota COFINS %", value: p.aliquota_cofins },
          { label: "Cód. benefício fiscal", value: p.codigo_beneficio_fiscal },
          { label: "Peso bruto (kg)", value: p.peso_bruto_kg },
          { label: "Peso líquido (kg)", value: p.peso_liquido_kg },
          { label: "Valor aprox. tributos", value: money(p.valor_aproximado_tributos) },
          { label: "Código ANP", value: p.codigo_anp },
          { label: "Escala relevante", value: p.escala_relevante },
          { label: "CNPJ fabricante", value: p.cnpj_fabricante },
          { label: "GTIN embalagem", value: p.gtin_embalagem },
          { label: "Informações adicionais", value: p.informacoes_adicionais },
        ],
      },
      {
        title: "Auditoria",
        fields: [
          { label: "Criado em", value: datetime(p.created_at) },
          { label: "Atualizado em", value: datetime(p.updated_at) },
        ],
      },
    ],
  };
}

export function categoryReport(c: Tables<"product_categories">): ReportData {
  return {
    title: `Categoria — ${c.name}`,
    sections: [
      {
        title: "Dados",
        fields: [
          { label: "Nome", value: c.name },
          { label: "Descrição", value: c.description },
          { label: "Imagem", value: c.image_url },
          { label: "Criada em", value: datetime(c.created_at) },
        ],
      },
    ],
  };
}

export function supplierReport(s: Tables<"suppliers">): ReportData {
  return {
    title: `Ficha do Fornecedor — ${s.name}`,
    subtitle: s.cnpj ?? undefined,
    sections: [
      {
        title: "Identificação",
        fields: [
          { label: "Razão social", value: s.name },
          { label: "Nome fantasia", value: s.trade_name },
          { label: "CNPJ", value: s.cnpj },
          { label: "IE", value: s.ie },
          { label: "Ativo", value: yesno(s.is_active) },
        ],
      },
      {
        title: "Contato",
        fields: [
          { label: "E-mail", value: s.email },
          { label: "Telefone", value: s.phone },
          { label: "Contato", value: s.contact_name },
        ],
      },
      {
        title: "Endereço",
        fields: [
          { label: "Logradouro", value: s.address_street },
          { label: "Número", value: s.address_number },
          { label: "Bairro", value: s.address_district },
          { label: "Cidade", value: s.address_city },
          { label: "UF", value: s.address_state },
          { label: "CEP", value: s.address_zip },
        ],
      },
      {
        title: "Bancário",
        fields: [
          { label: "Banco", value: s.bank_name },
          { label: "Agência", value: s.bank_agency },
          { label: "Conta", value: s.bank_account },
          { label: "PIX", value: s.pix_key },
        ],
      },
      {
        title: "Auditoria",
        fields: [
          { label: "Criado em", value: datetime(s.created_at) },
          { label: "Atualizado em", value: datetime(s.updated_at) },
        ],
      },
    ],
  };
}

export function employeeReport(e: Tables<"employees">): ReportData {
  return {
    title: `Ficha do Funcionário — ${e.name}`,
    subtitle: e.cpf ?? undefined,
    sections: [
      {
        title: "Identificação",
        fields: [
          { label: "Nome", value: e.name },
          { label: "CPF", value: e.cpf },
          { label: "RG", value: e.rg },
          { label: "Data nascimento", value: date(e.birth_date) },
          { label: "Estado civil", value: e.marital_status },
          { label: "Sexo", value: e.gender },
        ],
      },
      {
        title: "Contato",
        fields: [
          { label: "E-mail", value: e.email },
          { label: "Telefone", value: e.phone },
          { label: "Celular", value: e.cell_phone },
        ],
      },
      {
        title: "Endereço",
        fields: [
          { label: "Logradouro", value: e.address_street },
          { label: "Número", value: e.address_number },
          { label: "Bairro", value: e.address_district },
          { label: "Cidade", value: e.address_city },
          { label: "UF", value: e.address_state },
          { label: "CEP", value: e.address_zip },
        ],
      },
      {
        title: "Vínculo",
        fields: [
          { label: "Cargo", value: e.role_position },
          { label: "Departamento", value: e.department },
          { label: "Admissão", value: date(e.admission_date) },
          { label: "Demissão", value: date(e.termination_date) },
          { label: "Salário", value: money(e.salary) },
          { label: "Ativo", value: yesno(e.is_active) },
        ],
      },
      {
        title: "Auditoria",
        fields: [
          { label: "Criado em", value: datetime(e.created_at) },
          { label: "Atualizado em", value: datetime(e.updated_at) },
        ],
      },
    ],
  };
}

export function userProfileReport(u: Tables<"user_profiles">, roles?: string[]): ReportData {
  return {
    title: `Ficha do Usuário — ${u.name ?? u.email ?? "—"}`,
    subtitle: u.email ?? undefined,
    sections: [
      {
        title: "Identificação",
        fields: [
          { label: "Nome", value: u.name },
          { label: "E-mail", value: u.email },
          { label: "Telefone", value: u.phone },
          { label: "Papéis", value: roles?.join(", ") },
        ],
      },
      {
        title: "Auditoria",
        fields: [
          { label: "Criado em", value: datetime(u.created_at) },
          { label: "Atualizado em", value: datetime(u.updated_at) },
        ],
      },
    ],
  };
}

export function bankAccountReport(b: Tables<"bank_accounts">): ReportData {
  return {
    title: `Conta Bancária — ${b.name}`,
    sections: [
      {
        title: "Dados",
        fields: [
          { label: "Nome", value: b.name },
          { label: "Banco ID", value: b.bank_id },
          { label: "Agência", value: b.agency },
          { label: "Conta", value: b.account_number },
          { label: "Tipo", value: b.account_type },
          { label: "Saldo inicial", value: money(b.opening_balance) },
          { label: "Saldo atual", value: money(b.current_balance) },
          { label: "Ativa", value: yesno(b.is_active) },
        ],
      },
      {
        title: "Auditoria",
        fields: [
          { label: "Criada em", value: datetime(b.created_at) },
          { label: "Atualizada em", value: datetime(b.updated_at) },
        ],
      },
    ],
  };
}

export function costCenterReport(c: Tables<"cost_centers">): ReportData {
  return {
    title: `Centro de Custo — ${c.name}`,
    sections: [
      {
        title: "Dados",
        fields: [
          { label: "Nome", value: c.name },
          { label: "Categoria", value: c.categoria },
          { label: "Criado em", value: datetime(c.created_at) },
        ],
      },
    ],
  };
}

export function payableReport(p: Tables<"payables">): ReportData {
  return {
    title: `Conta a Pagar — ${p.description ?? p.id.slice(0, 8)}`,
    sections: [
      {
        title: "Dados",
        fields: [
          { label: "Descrição", value: p.description },
          { label: "Fornecedor", value: p.supplier_id },
          { label: "Centro de custo", value: p.cost_center_id },
          { label: "Valor", value: money(p.amount) },
          { label: "Valor pago", value: money(p.paid_amount) },
          { label: "Vencimento", value: date(p.due_date) },
          { label: "Pagamento", value: date(p.payment_date) },
          { label: "Status", value: p.status },
          { label: "Forma pagamento", value: p.payment_method },
          { label: "Observações", value: p.notes },
        ],
      },
    ],
  };
}

export function receivableReport(r: Tables<"receivables">): ReportData {
  return {
    title: `Conta a Receber — ${r.description ?? r.id.slice(0, 8)}`,
    sections: [
      {
        title: "Dados",
        fields: [
          { label: "Descrição", value: r.description },
          { label: "Cliente", value: r.client_id },
          { label: "Valor", value: money(r.amount) },
          { label: "Valor recebido", value: money(r.received_amount) },
          { label: "Vencimento", value: date(r.due_date) },
          { label: "Recebimento", value: date(r.received_date) },
          { label: "Status", value: r.status },
          { label: "Forma pagamento", value: r.payment_method },
          { label: "Observações", value: r.notes },
        ],
      },
    ],
  };
}

export function deliveryReport(d: Tables<"deliveries">): ReportData {
  return {
    title: `Entrega — ${d.id.slice(0, 8)}`,
    sections: [
      {
        title: "Dados",
        fields: [
          { label: "Pedido", value: d.order_id },
          { label: "Status", value: d.status },
          { label: "Entregador", value: d.driver_id },
          { label: "Veículo", value: d.vehicle },
          { label: "Saída", value: datetime(d.departed_at) },
          { label: "Entrega", value: datetime(d.delivered_at) },
          { label: "Endereço", value: d.address },
          { label: "Cidade", value: d.city },
          { label: "UF", value: d.state },
          { label: "CEP", value: d.zip },
          { label: "Observações", value: d.notes },
        ],
      },
    ],
  };
}

export function companyReport(c: Tables<"company">): ReportData {
  return {
    title: `Dados da Empresa — ${c.razao_social ?? c.nome_fantasia ?? ""}`,
    sections: [
      {
        title: "Identificação",
        fields: [
          { label: "Razão social", value: c.razao_social },
          { label: "Nome fantasia", value: c.nome_fantasia },
          { label: "CNPJ", value: c.cnpj },
          { label: "IE", value: c.ie },
          { label: "IM", value: c.im },
          { label: "Regime tributário", value: c.regime_tributario },
        ],
      },
      {
        title: "Contato",
        fields: [
          { label: "E-mail", value: c.email },
          { label: "Telefone", value: c.telefone },
          { label: "WhatsApp", value: c.whatsapp },
          { label: "Site", value: c.site },
        ],
      },
      {
        title: "Endereço",
        fields: [
          { label: "Logradouro", value: c.endereco },
          { label: "Número", value: c.numero },
          { label: "Bairro", value: c.bairro },
          { label: "Cidade", value: c.cidade },
          { label: "UF", value: c.uf },
          { label: "CEP", value: c.cep },
        ],
      },
      {
        title: "Auditoria",
        fields: [
          { label: "Criado em", value: datetime(c.created_at) },
          { label: "Atualizado em", value: datetime(c.updated_at) },
        ],
      },
    ],
  };
}

export function stockMovementReport(m: Tables<"stock_movements">): ReportData {
  return {
    title: `Movimentação de Estoque — ${m.id.slice(0, 8)}`,
    sections: [
      {
        title: "Dados",
        fields: [
          { label: "Produto", value: m.product_id },
          { label: "Tipo", value: m.type },
          { label: "Quantidade", value: m.qty },
          { label: "Motivo", value: m.reason },
          { label: "Referência", value: m.reference_id },
          { label: "Usuário", value: m.user_id },
          { label: "Data", value: datetime(m.created_at) },
        ],
      },
    ],
  };
}

export function orderReport(o: Tables<"sale_orders">, items?: Tables<"sale_order_items">[]): ReportData {
  return {
    title: `Pedido de Venda — #${o.order_number ?? o.id.slice(0, 8)}`,
    sections: [
      {
        title: "Dados",
        fields: [
          { label: "Número", value: o.order_number },
          { label: "Cliente", value: o.client_id },
          { label: "Tipo", value: o.type },
          { label: "Status", value: o.status },
          { label: "Forma pagamento", value: o.payment_method },
          { label: "Parcelas", value: o.installments },
          { label: "Desconto %", value: o.discount_pct },
          { label: "Cashback usado", value: money(o.cashback_used) },
          { label: "Subtotal", value: money(o.subtotal) },
          { label: "Total", value: money(o.total) },
          { label: "Observações", value: o.notes },
          { label: "Data", value: datetime(o.created_at) },
        ],
      },
    ],
    tables: items
      ? [
          {
            title: "Itens",
            columns: ["Produto", "Qtd", "Preço unit.", "Desc %", "Total"],
            rows: items.map((it) => [
              it.product_id ?? "—",
              it.qty,
              money(it.unit_price),
              `${Number(it.discount_pct ?? 0).toFixed(2)}%`,
              money(it.total),
            ]),
          },
        ]
      : undefined,
  };
}
