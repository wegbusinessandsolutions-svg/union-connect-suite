import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Building2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { companySchema, type CompanyForm } from "@/lib/admin-schemas";

export const Route = createFileRoute("/_authenticated/admin/empresa")({
  head: () => ({ meta: [{ title: "Empresa — Admin" }] }),
  component: EmpresaPage,
});

function EmpresaPage() {
  const qc = useQueryClient();

  const company = useQuery({
    queryKey: ["company"],
    queryFn: async () => {
      const { data, error } = await supabase.from("company").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const form = useForm({
    resolver: zodResolver(companySchema),
    defaultValues: { razao_social: "", cashback_pct_padrao: 0 } as CompanyForm,
  });

  useEffect(() => {
    if (company.data) {
      form.reset({
        razao_social: company.data.razao_social ?? "",
        nome_fantasia: company.data.nome_fantasia ?? "",
        cnpj: company.data.cnpj ?? "",
        ie: company.data.ie ?? "",
        im: company.data.im ?? "",
        logo_url: company.data.logo_url ?? "",
        address_zip: company.data.address_zip ?? "",
        address_street: company.data.address_street ?? "",
        address_number: company.data.address_number ?? "",
        address_complement: company.data.address_complement ?? "",
        address_district: company.data.address_district ?? "",
        address_city: company.data.address_city ?? "",
        address_state: company.data.address_state ?? "",
        phone: company.data.phone ?? "",
        email: company.data.email ?? "",
        site: company.data.site ?? "",
        regime_tributario: company.data.regime_tributario ?? "",
        certificado_digital_url: company.data.certificado_digital_url ?? "",
        responsavel_nome: company.data.responsavel_nome ?? "",
        responsavel_cpf: company.data.responsavel_cpf ?? "",
        cashback_pct_padrao: Number(company.data.cashback_pct_padrao ?? 0),
      });
    }
  }, [company.data, form]);

  const saveMut = useMutation({
    mutationFn: async (values: CompanyForm) => {
      const payload = Object.fromEntries(
        Object.entries(values).map(([k, v]) => [k, v === "" ? null : v]),
      );
      if (company.data?.id) {
        const { error } = await supabase.from("company").update(payload).eq("id", company.data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("company").insert(payload as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Dados da empresa salvos");
      qc.invalidateQueries({ queryKey: ["company"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="bg-background p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Empresa</h1>
            <p className="text-sm text-muted-foreground">Dados fiscais, endereço e responsável.</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {company.isLoading ? "Carregando…" : company.data ? "Editar empresa" : "Cadastrar empresa"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit((v) => saveMut.mutate(v))} className="space-y-4">
              <Tabs defaultValue="basico">
                <TabsList>
                  <TabsTrigger value="basico">Básico</TabsTrigger>
                  <TabsTrigger value="endereco">Endereço</TabsTrigger>
                  <TabsTrigger value="fiscal">Fiscal</TabsTrigger>
                  <TabsTrigger value="extra">Extra</TabsTrigger>
                </TabsList>

                <TabsContent value="basico" className="grid gap-3 pt-4 md:grid-cols-2">
                  <Field label="Razão social *"><Input {...form.register("razao_social")} />{form.formState.errors.razao_social && <ErrTxt msg={form.formState.errors.razao_social.message} />}</Field>
                  <Field label="Nome fantasia"><Input {...form.register("nome_fantasia")} /></Field>
                  <Field label="CNPJ"><Input {...form.register("cnpj")} /></Field>
                  <Field label="Inscrição estadual"><Input {...form.register("ie")} /></Field>
                  <Field label="Inscrição municipal"><Input {...form.register("im")} /></Field>
                  <Field label="Logo (URL)"><Input {...form.register("logo_url")} /></Field>
                  <Field label="Telefone"><Input {...form.register("phone")} /></Field>
                  <Field label="Email"><Input {...form.register("email")} /></Field>
                  <Field label="Site"><Input {...form.register("site")} /></Field>
                </TabsContent>

                <TabsContent value="endereco" className="grid gap-3 pt-4 md:grid-cols-3">
                  <Field label="CEP"><Input {...form.register("address_zip")} /></Field>
                  <Field label="Rua" className="md:col-span-2"><Input {...form.register("address_street")} /></Field>
                  <Field label="Número"><Input {...form.register("address_number")} /></Field>
                  <Field label="Complemento"><Input {...form.register("address_complement")} /></Field>
                  <Field label="Bairro"><Input {...form.register("address_district")} /></Field>
                  <Field label="Cidade"><Input {...form.register("address_city")} /></Field>
                  <Field label="UF"><Input maxLength={2} {...form.register("address_state")} /></Field>
                </TabsContent>

                <TabsContent value="fiscal" className="grid gap-3 pt-4 md:grid-cols-2">
                  <Field label="Regime tributário"><Input {...form.register("regime_tributario")} placeholder="Simples / Lucro Presumido / Real" /></Field>
                  <Field label="Certificado digital (URL)"><Input {...form.register("certificado_digital_url")} /></Field>
                </TabsContent>

                <TabsContent value="extra" className="grid gap-3 pt-4 md:grid-cols-2">
                  <Field label="Responsável (nome)"><Input {...form.register("responsavel_nome")} /></Field>
                  <Field label="Responsável (CPF)"><Input {...form.register("responsavel_cpf")} /></Field>
                  <Field label="Cashback padrão (%)"><Input type="number" step="0.01" {...form.register("cashback_pct_padrao")} /></Field>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button type="submit" disabled={saveMut.isPending}>
                  {saveMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
function ErrTxt({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-destructive">{msg}</p> : null;
}
