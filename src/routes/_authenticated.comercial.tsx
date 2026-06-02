import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/role-guard";

export const Route = createFileRoute("/_authenticated/comercial")({
  component: () => <RoleGuard allowed={["admin", "comercial"]} />,
});
