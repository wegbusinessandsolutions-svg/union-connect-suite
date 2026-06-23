import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { formatCpf, formatCnpj, formatPhone, formatCep, onlyDigits } from "@/lib/br-format";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : "/dashboard",
  }),
  head: () => ({ meta: [{ title: "Entrar" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: redirect, replace: true });
    });
  }, [navigate, redirect]);

  const onAuthed = () => navigate({ to: redirect, replace: true });

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Acessar o sistema</CardTitle>
          <CardDescription>Entre ou crie uma conta para continuar.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>
            <TabsContent value="login"><SignInForm onSuccess={onAuthed} /></TabsContent>
            <TabsContent value="signup"><SignUpForm /></TabsContent>
          </Tabs>
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <Link to="/forgot-password" className="hover:underline">Esqueci minha senha</Link>
            <Link to="/" className="hover:underline">Voltar ao início</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const signInSchema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(6, "Mínimo de 6 caracteres").max(72),
});

function SignInForm({ onSuccess }: { onSuccess: () => void }) {
  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const submit = form.handleSubmit(async (values) => {
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      toast.error("Não foi possível entrar", { description: error.message });
      return;
    }
    onSuccess();
  });

  return (
    <Form {...form}>
      <form onSubmit={submit} className="space-y-4 pt-4">
        <FormField name="email" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>E-mail</FormLabel>
            <FormControl><Input type="email" autoComplete="email" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField name="password" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Senha</FormLabel>
            <FormControl><Input type="password" autoComplete="current-password" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Entrando…" : "Entrar"}
        </Button>
      </form>
    </Form>
  );
}

const signUpSchema = z.object({
  type: z.enum(["pf", "pj"], { errorMap: () => ({ message: "Selecione o tipo" }) }),
  name: z.string().trim().min(2, "Informe o nome").max(120),
  cpf_cnpj: z.string().trim().min(11, "Documento inválido").max(20),
  email: z.string().trim().email("E-mail inválido").max(255),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  address_zip: z.string().trim().max(15).optional().or(z.literal("")),
  address_street: z.string().trim().max(160).optional().or(z.literal("")),
  address_number: z.string().trim().max(20).optional().or(z.literal("")),
  address_complement: z.string().trim().max(80).optional().or(z.literal("")),
  address_district: z.string().trim().max(80).optional().or(z.literal("")),
  address_city: z.string().trim().max(80).optional().or(z.literal("")),
  address_state: z.string().trim().max(2).optional().or(z.literal("")),
  resp1_name: z.string().trim().max(120).optional().or(z.literal("")),
  resp1_cpf: z.string().trim().max(20).optional().or(z.literal("")),
  resp1_phone: z.string().trim().max(30).optional().or(z.literal("")),
  resp1_email: z.string().trim().max(255).optional().or(z.literal("")),
  password: z.string().min(8, "Mínimo de 8 caracteres").max(72),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "As senhas não coincidem", path: ["confirm"],
}).refine((d) => {
  const len = onlyDigits(d.cpf_cnpj).length;
  return d.type === "pf" ? len === 11 : len === 14;
}, { message: "Documento incompatível com o tipo selecionado", path: ["cpf_cnpj"] });

function SignUpForm() {
  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      type: "pf", name: "", cpf_cnpj: "", email: "", phone: "",
      address_zip: "", address_street: "", address_number: "", address_complement: "",
      address_district: "", address_city: "", address_state: "",
      resp1_name: "", resp1_cpf: "", resp1_phone: "", resp1_email: "",
      password: "", confirm: "",
    },
  });

  const personType = form.watch("type");

  const submit = form.handleSubmit(async (values) => {
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          name: values.name,
          phone: values.phone || null,
          type: values.type,
          cpf_cnpj: values.type === "pf" ? formatCpf(values.cpf_cnpj) : formatCnpj(values.cpf_cnpj),
          address_zip: values.address_zip || null,
          address_street: values.address_street || null,
          address_number: values.address_number || null,
          address_complement: values.address_complement || null,
          address_district: values.address_district || null,
          address_city: values.address_city || null,
          address_state: (values.address_state || "").toUpperCase() || null,
          resp1_name: values.resp1_name || null,
          resp1_cpf: values.resp1_cpf ? formatCpf(values.resp1_cpf) : null,
          resp1_phone: values.resp1_phone || null,
          resp1_email: values.resp1_email || null,
        },
      },
    });
    if (error) {
      toast.error("Não foi possível cadastrar", { description: error.message });
      return;
    }
    toast.success("Cadastro iniciado", {
      description:
        "Enviamos um e-mail de confirmação. Após confirmar, faça login para acessar sua conta.",
    });
    form.reset();
  });

  const formatDoc = personType === "pj" ? formatCnpj : formatCpf;

  return (
    <Form {...form}>
      <form onSubmit={submit} className="space-y-4 pt-4">
        <FormField name="type" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo de cadastro</FormLabel>
            <FormControl>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { field.onChange("pf"); form.setValue("cpf_cnpj", ""); }}
                  className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                    field.value === "pf"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background hover:bg-accent"
                  }`}
                >
                  Pessoa Física
                </button>
                <button
                  type="button"
                  onClick={() => { field.onChange("pj"); form.setValue("cpf_cnpj", ""); }}
                  className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                    field.value === "pj"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background hover:bg-accent"
                  }`}
                >
                  Pessoa Jurídica
                </button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField name="name" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>{personType === "pj" ? "Razão social / Nome do condomínio" : "Nome completo"}</FormLabel>
            <FormControl><Input autoComplete={personType === "pj" ? "organization" : "name"} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField name="cpf_cnpj" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>{personType === "pj" ? "CNPJ" : "CPF"}</FormLabel>
            <FormControl>
              <Input
                inputMode="numeric"
                placeholder={personType === "pj" ? "00.000.000/0000-00" : "000.000.000-00"}
                value={field.value}
                onChange={(e) => field.onChange(formatDoc(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField name="email" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>E-mail</FormLabel>
            <FormControl><Input type="email" autoComplete="email" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField name="phone" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Telefone</FormLabel>
            <FormControl>
              <Input
                type="tel"
                autoComplete="tel"
                placeholder="(00) 00000-0000"
                value={field.value ?? ""}
                onChange={(e) => field.onChange(formatPhone(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="space-y-3 rounded-md border bg-muted/30 p-3">
          <p className="text-xs font-semibold text-muted-foreground">Endereço</p>
          <div className="grid grid-cols-2 gap-3">
            <FormField name="address_zip" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>CEP</FormLabel>
                <FormControl>
                  <Input
                    placeholder="00000-000"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(formatCep(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="address_state" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>UF</FormLabel>
                <FormControl>
                  <Input
                    maxLength={2}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <FormField name="address_street" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>Rua / Logradouro</FormLabel>
              <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <div className="grid grid-cols-2 gap-3">
            <FormField name="address_number" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Número</FormLabel>
                <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="address_complement" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Complemento</FormLabel>
                <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField name="address_district" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Bairro</FormLabel>
                <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="address_city" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Cidade</FormLabel>
                <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>

        {personType === "pj" && (
          <div className="space-y-3 rounded-md border bg-muted/30 p-3">
            <p className="text-xs font-semibold text-muted-foreground">Responsável</p>
            <FormField name="resp1_name" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do responsável</FormLabel>
                <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField name="resp1_cpf" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF do responsável</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric"
                      placeholder="000.000.000-00"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(formatCpf(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="resp1_phone" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="(00) 00000-0000"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(formatPhone(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField name="resp1_email" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail do responsável</FormLabel>
                <FormControl><Input type="email" {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        )}

        <FormField name="password" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Senha</FormLabel>
            <FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField name="confirm" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Confirmar senha</FormLabel>
            <FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <p className="text-xs text-muted-foreground">
          Após confirmar seu e-mail, você poderá entrar e acessar a sua conta.
        </p>
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Cadastrando…" : "Cadastrar"}
        </Button>
      </form>
    </Form>
  );
}
