import { useRoles, hasAnyRole } from "./use-roles";

export function useIsAdmin() {
  const { data: roles, isLoading } = useRoles();
  return { isAdmin: hasAnyRole(roles, ["admin"]), isLoading };
}
