import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { forwardErrorToService } from "./error-logger.server";

const reportSchema = z.object({
  message: z.string().min(1).max(4000),
  stack: z.string().max(20000).optional(),
  name: z.string().max(200).optional(),
  source: z
    .enum(["ssr_wrapper", "react_error_boundary", "router_default_error", "manual"])
    .default("manual"),
  route: z.string().max(2000).optional(),
  userId: z.string().max(200).nullable().optional(),
  userEmail: z.string().max(320).nullable().optional(),
  userAgent: z.string().max(1000).nullable().optional(),
  extra: z.record(z.string().max(200), z.unknown()).optional(),
});

export const reportClientError = createServerFn({ method: "POST" })
  .inputValidator((input) => reportSchema.parse(input))
  .handler(async ({ data }) => {
    const { message, stack, name, ...context } = data;
    const err = Object.assign(new Error(message), { stack, name });
    await forwardErrorToService(err, context);
    return { ok: true };
  });
