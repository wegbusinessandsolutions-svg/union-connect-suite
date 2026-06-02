import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type AppRole = "admin" | "financeiro" | "vendedor" | "estoque" | "entregador" | "cliente";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin role required");
}

const listInputSchema = z.object({
  page: z.number().int().min(1).max(10000).default(1),
  perPage: z.number().int().min(5).max(100).default(25),
  search: z.string().trim().max(255).default(""),
});

export const listUsersWithRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => listInputSchema.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    const { page, perPage, search } = data;

    // When searching, fetch a wider window once and filter in memory.
    // Without search, page directly through the Auth admin API.
    let pageUsers: Array<{
      id: string;
      email: string | null;
      created_at: string;
      last_sign_in_at: string | null;
    }> = [];
    let total = 0;
    let hasMore = false;

    if (search) {
      const term = search.toLowerCase();
      const SCAN_PAGE = 1000;
      let scanPage = 1;
      const matched: typeof pageUsers = [];
      // Hard cap scan to avoid runaway loops on very large user bases.
      while (scanPage <= 10) {
        const { data: usersData, error } =
          await supabaseAdmin.auth.admin.listUsers({ page: scanPage, perPage: SCAN_PAGE });
        if (error) throw new Error(error.message);
        const batch = usersData.users;
        for (const u of batch) {
          if ((u.email ?? "").toLowerCase().includes(term) || u.id.includes(term)) {
            matched.push({
              id: u.id,
              email: u.email ?? null,
              created_at: u.created_at,
              last_sign_in_at: u.last_sign_in_at ?? null,
            });
          }
        }
        if (batch.length < SCAN_PAGE) break;
        scanPage++;
      }
      total = matched.length;
      const start = (page - 1) * perPage;
      pageUsers = matched.slice(start, start + perPage);
      hasMore = start + perPage < total;
    } else {
      const { data: usersData, error } =
        await supabaseAdmin.auth.admin.listUsers({ page, perPage });
      if (error) throw new Error(error.message);
      pageUsers = usersData.users.map((u) => ({
        id: u.id,
        email: u.email ?? null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
      }));
      total = usersData.total ?? -1;
      hasMore = total >= 0
        ? page * perPage < total
        : pageUsers.length === perPage;
    }

    const ids = pageUsers.map((u) => u.id);
    let rolesByUser = new Map<string, string[]>();
    if (ids.length > 0) {
      const { data: rolesData, error: rolesError } = await supabaseAdmin
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", ids);
      if (rolesError) throw new Error(rolesError.message);
      for (const r of rolesData ?? []) {
        const arr = rolesByUser.get(r.user_id) ?? [];
        arr.push(r.role);
        rolesByUser.set(r.user_id, arr);
      }
    }

    return {
      users: pageUsers.map((u) => ({ ...u, roles: rolesByUser.get(u.id) ?? [] })),
      page,
      perPage,
      total,
      hasMore,
    };
  });


const roleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum([
    "admin",
    "financeiro",
    "vendedor",
    "estoque",
    "entregador",
    "cliente",
  ]),
});

export const grantRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => roleSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.role as AppRole });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    return { ok: true };
  });

export const revokeRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => roleSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    if (data.role === "admin" && data.userId === context.userId) {
      const { count, error: countError } = await supabaseAdmin
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");
      if (countError) throw new Error(countError.message);
      if ((count ?? 0) <= 1) {
        throw new Error("Não é possível remover o último admin do sistema.");
      }
    }
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("role", data.role);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
