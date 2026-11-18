import type { Permission } from "../types/inventory";

export function hasPermissions(
  userPermissions: readonly Permission[],
  requiredPermissions: readonly Permission[],
) {
  return requiredPermissions.every((permission) =>
    userPermissions.includes(permission),
  );
}
