// Client-side helper: gathers route + user context and ships the error to the
// server function that forwards to the external logging service.

import { supabase } from "@/integrations/supabase/client";
import { reportClientError } from "./error-logger.functions";

type ReportContext = {
  source?: "react_error_boundary" | "router_default_error" | "manual";
  route?: string;
  extra?: Record<string, unknown>;
};

function serialize(error: unknown): { message: string; stack?: string; name?: string } {
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

export async function logErrorToService(error: unknown, context: ReportContext = {}): Promise<void> {
  if (typeof window === "undefined") return;

  let userId: string | null = null;
  let userEmail: string | null = null;
  try {
    const { data } = await supabase.auth.getSession();
    userId = data.session?.user?.id ?? null;
    userEmail = data.session?.user?.email ?? null;
  } catch {
    // ignore — best-effort
  }

  const { message, stack, name } = serialize(error);

  try {
    await reportClientError({
      data: {
        message,
        stack,
        name,
        source: context.source ?? "manual",
        route: context.route ?? window.location.pathname + window.location.search,
        userId,
        userEmail,
        userAgent: navigator.userAgent,
        extra: context.extra,
      },
    });
  } catch (err) {
    // Don't let logging failures cascade.
    console.error("[error-logger] client report failed:", err);
  }
}
