import { useEffect, useMemo, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { logErrorToService } from "@/lib/error-logger";

type Props = {
  error: Error;
  reset?: () => void;
  source: "react_error_boundary" | "router_default_error";
};

function generateErrorId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `err_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function FriendlyErrorScreen({ error, reset, source }: Props) {
  const router = useRouter();
  const errorId = useMemo(() => generateErrorId(), [error]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void logErrorToService(error, { source, extra: { errorId } });
  }, [error, errorId, source]);

  const details = useMemo(() => {
    const route =
      typeof window !== "undefined"
        ? window.location.pathname + window.location.search
        : "";
    return [
      `Error ID: ${errorId}`,
      `Rota: ${route}`,
      `Hor\u00e1rio: ${new Date().toISOString()}`,
      `Mensagem: ${error.message}`,
      error.stack ? `Stack:\n${error.stack}` : undefined,
    ]
      .filter(Boolean)
      .join("\n");
  }, [error, errorId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(details);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Algo deu errado
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Encontramos um problema ao carregar esta p\u00e1gina. Voc\u00ea pode tentar
          novamente ou enviar o Error ID abaixo para o suporte.
        </p>

        <div className="mt-6 rounded-md border border-border bg-muted/40 p-3 text-left">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Error ID
          </p>
          <code className="mt-1 block break-all font-mono text-sm text-foreground">
            {errorId}
          </code>
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset?.();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <button
            onClick={handleCopy}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {copied ? "Copiado!" : "Copiar detalhes"}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Ir para o in\u00edcio
          </a>
        </div>
      </div>
    </div>
  );
}
