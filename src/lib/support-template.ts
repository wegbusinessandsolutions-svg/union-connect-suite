// Configurable mailto template for the "Falar com o suporte" button.
// Configure via env (Workspace Settings → Build Secrets):
//   VITE_SUPPORT_EMAIL              — destination address
//   VITE_SUPPORT_SUBJECT_TEMPLATE   — subject line, e.g. "Erro {errorId} em {route}"
//   VITE_SUPPORT_BODY_TEMPLATE      — body, multi-line with \n separators
//
// Available placeholders: {errorId} {route} {timestamp} {message} {stack} {userAgent}
// Unknown placeholders are left untouched.

export type SupportTemplateVars = {
  errorId: string;
  route: string;
  timestamp: string;
  message: string;
  stack?: string;
  userAgent?: string;
};

const DEFAULT_SUBJECT = "Erro na aplicação — {errorId}";
const DEFAULT_BODY = [
  "Olá, encontrei um erro na aplicação.",
  "",
  "Error ID: {errorId}",
  "Rota: {route}",
  "Horário: {timestamp}",
  "Mensagem: {message}",
  "",
  "Descreva o que estava fazendo quando o erro ocorreu:",
  "",
].join("\n");

export const SUPPORT_EMAIL =
  (import.meta.env.VITE_SUPPORT_EMAIL as string | undefined) ?? "suporte@exemplo.com";

const SUBJECT_TEMPLATE =
  (import.meta.env.VITE_SUPPORT_SUBJECT_TEMPLATE as string | undefined) ?? DEFAULT_SUBJECT;

const BODY_TEMPLATE =
  (import.meta.env.VITE_SUPPORT_BODY_TEMPLATE as string | undefined) ?? DEFAULT_BODY;

function render(template: string, vars: SupportTemplateVars): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = (vars as Record<string, unknown>)[key];
    return value == null ? match : String(value);
  });
}

export function buildSupportMailto(vars: SupportTemplateVars): string {
  const subject = render(SUBJECT_TEMPLATE, vars);
  const body = render(BODY_TEMPLATE, vars);
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
