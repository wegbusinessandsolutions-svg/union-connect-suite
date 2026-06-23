import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCpfCnpj, formatCpf, formatPhone, formatCep } from "@/lib/br-format";

export const Route = createFileRoute("/_authenticated/cliente/dados")({
  head: () => ({ meta: [{ title: "Meus dados" }] }),
  component: ClienteDadosPage,
});

type FormValues = {
  name: string;
  phone: string;
  whatsapp: string;
  cpf_cnpj: string;
  address_zip: string;
  address_street: string;
  address_number: string;
  address_complement: string;
  address_district: string;
  address_city: string;
  address_state: string;
  resp1_name: string;
  resp1_cpf: string;
  resp1_phone: string;
  resp1_email: string;
};

function ClienteDadosPage() {
  const qc = useQueryClient();

  const client = useQuery({
    queryKey: ["my-client"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("clients").select("*").eq("user_id", u.user.id).maybeSingle();
      return data;
    },
  });

  const form = useForm<FormValues>({
    defaultValues: {
      name: "", phone: "", whatsapp: "", cpf_cnpj: "",
      address_zip: "", address_street: "", address_number: "", address_complement: "",
      address_district: "", address_city: "", address_state: "",
      resp1_name: "", resp1_cpf: "", resp1_phone: "", resp1_email: "",
    },
  });

  const isPj = client.data?.type === "pj";

  useEffect(() => {
    if (client.data) {
      form.reset({
        name: client.data.name ?? "",
        phone: client.data.phone ?? "",
        whatsapp: client.data.whatsapp ?? "",
        cpf_cnpj: client.data.cpf_cnpj ?? "",
        address_zip: client.data.address_zip ?? "",
        address_street: client.data.address_street ?? "",
        address_number: client.data.address_number ?? "",
        address_complement: client.data.address_complement ?? "",
        address_district: client.data.address_district ?? "",
        address_city: client.data.address_city ?? "",
        address_state: client.data.address_state ?? "",
        resp1_name: client.data.resp1_name ?? "",
        resp1_cpf: client.data.resp1_cpf ?? "",
        resp1_phone: client.data.resp1_phone ?? "",
        resp1_email: client.data.resp1_email ?? "",
      });
    }
  }, [client.data, form]);

  const saveMut = useMutation({
    mutationFn: async (values: FormValues) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Não autenticado");
      const payload = Object.fromEntries(
        Object.entries(values).map(([k, v]) => [k, v === "" ? null : v]),
      ) as never;
      if (client.data?.id) {
        const { error } = await supabase.from("clients").update(payload).eq("id", client.data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("clients")
          .insert({ ...(payload as object), user_id: u.user.id, name: values.name || u.user.email || "Cliente" } as never);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Dados atualizados"); qc.invalidateQueries({ queryKey: ["my-client"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="bg-background p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <UserCircle className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Meus dados</h1>
            <p className="text-sm text-muted-foreground">Mantenha seu cadastro e endereço de entrega atualizados.</p>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">{client.data ? "Editar cadastro" : "Completar cadastro"}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit((v) => saveMut.mutate(v))} className="space-y-4">
              <Tabs defaultValue="pessoal">
                <TabsList>
                  <TabsTrigger value="pessoal">Pessoal</TabsTrigger>
                  <TabsTrigger value="endereco">Endereço</TabsTrigger>
                </TabsList>
                <TabsContent value="pessoal" className="grid gap-3 pt-4 md:grid-cols-2">
                  <Field label="Nome *"><Input {...form.register("name", { required: true })} /></Field>
                  <Field label="CPF / CNPJ"><Input {...form.register("cpf_cnpj")} /></Field>
                  <Field label="Telefone"><Input {...form.register("phone")} /></Field>
                  <Field label="WhatsApp"><Input {...form.register("whatsapp")} /></Field>
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
