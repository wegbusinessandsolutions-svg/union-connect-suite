
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS ncm TEXT,
  ADD COLUMN IF NOT EXISTS cest TEXT,
  ADD COLUMN IF NOT EXISTS cfop TEXT,
  ADD COLUMN IF NOT EXISTS origem TEXT,
  ADD COLUMN IF NOT EXISTS unidade_tributavel TEXT,
  ADD COLUMN IF NOT EXISTS ean_tributavel TEXT,
  ADD COLUMN IF NOT EXISTS cst_icms TEXT,
  ADD COLUMN IF NOT EXISTS csosn TEXT,
  ADD COLUMN IF NOT EXISTS aliquota_icms NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS aliquota_icms_st NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS aliquota_ipi NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS cst_ipi TEXT,
  ADD COLUMN IF NOT EXISTS aliquota_pis NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS cst_pis TEXT,
  ADD COLUMN IF NOT EXISTS aliquota_cofins NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS cst_cofins TEXT,
  ADD COLUMN IF NOT EXISTS codigo_beneficio_fiscal TEXT,
  ADD COLUMN IF NOT EXISTS peso_bruto_kg NUMERIC(10,3),
  ADD COLUMN IF NOT EXISTS peso_liquido_kg NUMERIC(10,3),
  ADD COLUMN IF NOT EXISTS valor_aproximado_tributos NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS codigo_anp TEXT,
  ADD COLUMN IF NOT EXISTS escala_relevante TEXT,
  ADD COLUMN IF NOT EXISTS cnpj_fabricante TEXT,
  ADD COLUMN IF NOT EXISTS gtin_embalagem TEXT,
  ADD COLUMN IF NOT EXISTS fator_conversao_tributavel NUMERIC(10,4),
  ADD COLUMN IF NOT EXISTS informacoes_adicionais TEXT;

COMMENT ON COLUMN public.products.ncm IS 'NCM - Nomenclatura Comum do Mercosul (8 dígitos)';
COMMENT ON COLUMN public.products.cest IS 'CEST - Código Especificador da Substituição Tributária (7 dígitos)';
COMMENT ON COLUMN public.products.cfop IS 'CFOP - Código Fiscal de Operações';
COMMENT ON COLUMN public.products.origem IS 'Origem da mercadoria (0-8)';
COMMENT ON COLUMN public.products.cst_icms IS 'CST ICMS (Regime Normal)';
COMMENT ON COLUMN public.products.csosn IS 'CSOSN (Simples Nacional)';
