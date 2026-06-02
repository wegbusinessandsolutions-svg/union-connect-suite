import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/role-guard";

export const Route = createFileRoute("/_authenticated/cliente")({
  component: () => <RoleGuard allowed={["admin", "cliente"]} />,
});
