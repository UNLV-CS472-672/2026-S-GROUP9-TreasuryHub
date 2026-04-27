export const ORGANIZATION_ROLE = {
  MEMBER: "member",
  EXECUTIVE: "executive",
  ADVISOR: "advisor",
  TREASURY_TEAM: "treasury_team",
  TREASURER: "treasurer",
  ADMIN: "admin",
} as const;

export type OrganizationRole =
  (typeof ORGANIZATION_ROLE)[keyof typeof ORGANIZATION_ROLE];

export const ORGANIZATION_ROLES = [
  ORGANIZATION_ROLE.MEMBER,
  ORGANIZATION_ROLE.EXECUTIVE,
  ORGANIZATION_ROLE.ADVISOR,
  ORGANIZATION_ROLE.TREASURY_TEAM,
  ORGANIZATION_ROLE.TREASURER,
  ORGANIZATION_ROLE.ADMIN,
] as const;

export const ROLE_LABELS: Record<OrganizationRole, string> = {
  [ORGANIZATION_ROLE.MEMBER]: "Member",
  [ORGANIZATION_ROLE.EXECUTIVE]: "Executive",
  [ORGANIZATION_ROLE.ADVISOR]: "Advisor",
  [ORGANIZATION_ROLE.TREASURY_TEAM]: "Treasury Team",
  [ORGANIZATION_ROLE.TREASURER]: "Treasurer",
  [ORGANIZATION_ROLE.ADMIN]: "Admin",
};

export const MEMBER_MANAGEMENT_ROLES = [
  ORGANIZATION_ROLE.TREASURER,
  ORGANIZATION_ROLE.ADMIN,
] as const;

export const ORG_DASHBOARD_ROLES = [
  ORGANIZATION_ROLE.EXECUTIVE,
  ORGANIZATION_ROLE.ADVISOR,
  ORGANIZATION_ROLE.TREASURY_TEAM,
  ORGANIZATION_ROLE.TREASURER,
  ORGANIZATION_ROLE.ADMIN,
] as const;

export const FILE_VIEW_ROLES = [...ORG_DASHBOARD_ROLES] as const;

export const FILE_WRITE_ROLES = [
  ORGANIZATION_ROLE.TREASURY_TEAM,
  ORGANIZATION_ROLE.TREASURER,
  ORGANIZATION_ROLE.ADMIN,
] as const;

export const AUDIT_VIEW_ROLES = [
  ORGANIZATION_ROLE.TREASURER,
  ORGANIZATION_ROLE.ADMIN,
] as const;

export const TRANSACTION_EXPORT_ROLES = [
  ORGANIZATION_ROLE.TREASURER,
] as const;

export const TASK_MANAGEMENT_ROLES = [
  ORGANIZATION_ROLE.TREASURY_TEAM,
  ORGANIZATION_ROLE.TREASURER,
  ORGANIZATION_ROLE.ADMIN,
] as const;

export const TRANSACTION_VIEW_ROLES = [...ORG_DASHBOARD_ROLES] as const;

export const TRANSACTION_MANAGEMENT_ROLES = [
  ORGANIZATION_ROLE.TREASURY_TEAM,
  ORGANIZATION_ROLE.TREASURER,
  ORGANIZATION_ROLE.ADMIN,
] as const;

type RoleValue = string | null | undefined;

type PermissionRoleGroup = readonly OrganizationRole[];

function hasRole(
  allowedRoles: PermissionRoleGroup,
  role: RoleValue
): role is OrganizationRole {
  if (role == null) {
    return false;
  }

  return allowedRoles.includes(role as OrganizationRole);
}

export function isOrganizationRole(
  value: RoleValue
): value is OrganizationRole {
  return hasRole(ORGANIZATION_ROLES, value);
}

export function canManageMembers(role: RoleValue) {
  return hasRole(MEMBER_MANAGEMENT_ROLES, role);
}

export function canViewOrganizationDashboard(role: RoleValue) {
  return hasRole(ORG_DASHBOARD_ROLES, role);
}

export function canViewFiles(role: RoleValue) {
  return hasRole(FILE_VIEW_ROLES, role);
}

export function canUploadFiles(role: RoleValue) {
  return hasRole(FILE_WRITE_ROLES, role);
}

export function canDeleteFiles(role: RoleValue) {
  return hasRole(FILE_WRITE_ROLES, role);
}

export function canViewAudit(role: RoleValue) {
  return hasRole(AUDIT_VIEW_ROLES, role);
}

export function canExportTransactions(role: RoleValue) {
  return hasRole(TRANSACTION_EXPORT_ROLES, role);
}

export function canManageTasks(role: RoleValue) {
  return hasRole(TASK_MANAGEMENT_ROLES, role);
}

export function canViewTransactions(role: RoleValue) {
  return hasRole(TRANSACTION_VIEW_ROLES, role);
}

export function canManageTransactions(role: RoleValue) {
  return hasRole(TRANSACTION_MANAGEMENT_ROLES, role);
}

export function getAuditVisibilityScope(
  role: RoleValue
): "financial_only" | "all" | "none" {
  if (role === ORGANIZATION_ROLE.TREASURER) {
    return "financial_only";
  }

  if (role === ORGANIZATION_ROLE.ADMIN) {
    return "all";
  }

  return "none";
}