// Server-only helper that forwards an error event to an external logging service.
// Configure ERROR_LOGGER_WEBHOOK_URL (secret) to enable. Without it, logs to console only.

export type ErrorEventPayload = {
  source: "ssr_wrapper" | "react_error_boundary" | "router_default_error" | "manual";
  message: string;
  stack?: string;
  name?: string;
  route?: string;
  userId?: string | null;
  userEmail?: string | null;
  userAgent?: string | null;
  timestamp: string;
  environment: string;
  extra?: Record<string, unknown>;
};

function toSerializableError(error: unknown): { message: string; stack?: string; name?: string } {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack, name: error.name };
  }
  if (typeof error === "string") return { message: error };
  try {
    return { message: JSON.stringify(error) };
  } catch {
    return { message: String(error) };
  }
}

export async function forwardErrorToService(
  error: unknown,
  context: Partial<Omit<ErrorEventPayload, "message" | "stack" | "name" | "timestamp" | "environment">> = {},
): Promise<void> {
  const serialized = toSerializableError(error);
  const payload: ErrorEventPayload = {
    source: context.source ?? "manual",
    ...serialized,
    route: context.route,
    userId: context.userId ?? null,
    userEmail: context.userEmail ?? null,
    userAgent: context.userAgent ?? null,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? "production",
    extra: context.extra,
  };

  // Always mirror to server console (visible in Server Logs).
  console.error("[error-logger]", JSON.stringify(payload));

  const webhookUrl = process.env.ERROR_LOGGER_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      // Don't keep SSR hanging if the logging endpoint is slow.
      signal: AbortSignal.timeout(3000),
    });
  } catch (err) {
    console.error("[error-logger] failed to deliver to webhook:", err);
  }
}
