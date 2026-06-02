import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminIndex,
});

function AdminIndex() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/admin/usuarios", replace: true });
  }, [navigate]);
  return null;
}
