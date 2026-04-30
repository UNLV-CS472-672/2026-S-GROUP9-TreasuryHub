import { describe, expect, it } from "vitest";
import {
  AUDIT_VIEW_ROLES,
  FILE_VIEW_ROLES,
  FILE_WRITE_ROLES,
  MEMBER_MANAGEMENT_ROLES,
  ORGANIZATION_ROLE,
  ORGANIZATION_ROLES,
  TASK_MANAGEMENT_ROLES,
  TRANSACTION_EXPORT_ROLES,
  TRANSACTION_MANAGEMENT_ROLES,
  TRANSACTION_VIEW_ROLES,
  canDeleteFiles,
  canExportTransactions,
  canManageMembers,
  canManageTasks,
  canManageTransactions,
  canUploadFiles,
  canViewAudit,
  canViewFiles,
  canViewOrganizationDashboard,
  canViewTransactions,
  getAuditVisibilityScope,
  isOrganizationRole,
} from "../lib/roles";

describe("roles", () => {
  it("keeps the canonical role list in the expected order", () => {
    expect(ORGANIZATION_ROLES).toEqual([
      ORGANIZATION_ROLE.MEMBER,
      ORGANIZATION_ROLE.EXECUTIVE,
      ORGANIZATION_ROLE.ADVISOR,
      ORGANIZATION_ROLE.TREASURY_TEAM,
      ORGANIZATION_ROLE.TREASURER,
      ORGANIZATION_ROLE.ADMIN,
    ]);
  });

  it("rejects stale role names", () => {
    expect(isOrganizationRole("owner")).toBe(false);
    expect(isOrganizationRole("creator")).toBe(false);
    expect(isOrganizationRole("Officer")).toBe(false);
    expect(isOrganizationRole("Treasurer")).toBe(false);
  });

  it("allows dashboard organization scope for treasury team", () => {
    expect(canViewOrganizationDashboard(ORGANIZATION_ROLE.TREASURY_TEAM)).toBe(
      true
    );
  });

  it("does not allow organization scope for member", () => {
    expect(canViewOrganizationDashboard(ORGANIZATION_ROLE.MEMBER)).toBe(false);
  });

  it("keeps member management limited to treasurer and admin", () => {
    expect(MEMBER_MANAGEMENT_ROLES).toEqual([
      ORGANIZATION_ROLE.TREASURER,
      ORGANIZATION_ROLE.ADMIN,
    ]);
    expect(canManageMembers(ORGANIZATION_ROLE.TREASURER)).toBe(true);
    expect(canManageMembers(ORGANIZATION_ROLE.ADMIN)).toBe(true);
    expect(canManageMembers(ORGANIZATION_ROLE.EXECUTIVE)).toBe(false);
  });

  it("keeps file access aligned across read and write helpers", () => {
    expect(FILE_VIEW_ROLES).toEqual([
      ORGANIZATION_ROLE.EXECUTIVE,
      ORGANIZATION_ROLE.ADVISOR,
      ORGANIZATION_ROLE.TREASURY_TEAM,
      ORGANIZATION_ROLE.TREASURER,
      ORGANIZATION_ROLE.ADMIN,
    ]);
    expect(FILE_WRITE_ROLES).toEqual([
      ORGANIZATION_ROLE.TREASURY_TEAM,
      ORGANIZATION_ROLE.TREASURER,
      ORGANIZATION_ROLE.ADMIN,
    ]);
    expect(canViewFiles(ORGANIZATION_ROLE.ADVISOR)).toBe(true);
    expect(canUploadFiles(ORGANIZATION_ROLE.ADVISOR)).toBe(false);
    expect(canDeleteFiles(ORGANIZATION_ROLE.ADMIN)).toBe(true);
  });

  it("keeps audit visibility split between treasurer and admin", () => {
    expect(AUDIT_VIEW_ROLES).toEqual([
      ORGANIZATION_ROLE.TREASURER,
      ORGANIZATION_ROLE.ADMIN,
    ]);
    expect(canViewAudit(ORGANIZATION_ROLE.TREASURER)).toBe(true);
    expect(canViewAudit(ORGANIZATION_ROLE.ADMIN)).toBe(true);
    expect(getAuditVisibilityScope(ORGANIZATION_ROLE.TREASURER)).toBe(
      "financial_only"
    );
    expect(getAuditVisibilityScope(ORGANIZATION_ROLE.ADMIN)).toBe("all");
    expect(getAuditVisibilityScope(ORGANIZATION_ROLE.MEMBER)).toBe("none");
  });

  it("keeps transaction export restricted to treasurer and admin", () => {
    expect(TRANSACTION_EXPORT_ROLES).toEqual([
      ORGANIZATION_ROLE.TREASURER,
      ORGANIZATION_ROLE.ADMIN,
    ]);
    expect(canExportTransactions(ORGANIZATION_ROLE.TREASURER)).toBe(true);
    expect(canExportTransactions(ORGANIZATION_ROLE.ADMIN)).toBe(true);
  });


  it("allows task management only for treasury team, treasurer, and admin", () => {
    expect(TASK_MANAGEMENT_ROLES).toEqual([
      ORGANIZATION_ROLE.TREASURY_TEAM,
      ORGANIZATION_ROLE.TREASURER,
      ORGANIZATION_ROLE.ADMIN,
    ]);
    expect(canManageTasks(ORGANIZATION_ROLE.TREASURY_TEAM)).toBe(true);
    expect(canManageTasks(ORGANIZATION_ROLE.TREASURER)).toBe(true);
    expect(canManageTasks(ORGANIZATION_ROLE.ADMIN)).toBe(true);
    expect(canManageTasks(ORGANIZATION_ROLE.EXECUTIVE)).toBe(false);
    expect(canManageTasks("Officer")).toBe(false);
    expect(canManageTasks("Treasurer")).toBe(false);
  });

  it("separates transaction viewing from transaction management", () => {
    expect(TRANSACTION_VIEW_ROLES).toEqual([
      ORGANIZATION_ROLE.EXECUTIVE,
      ORGANIZATION_ROLE.ADVISOR,
      ORGANIZATION_ROLE.TREASURY_TEAM,
      ORGANIZATION_ROLE.TREASURER,
      ORGANIZATION_ROLE.ADMIN,
    ]);
    expect(TRANSACTION_MANAGEMENT_ROLES).toEqual([
      ORGANIZATION_ROLE.TREASURY_TEAM,
      ORGANIZATION_ROLE.TREASURER,
      ORGANIZATION_ROLE.ADMIN,
    ]);
    expect(canViewTransactions(ORGANIZATION_ROLE.ADVISOR)).toBe(true);
    expect(canViewTransactions(ORGANIZATION_ROLE.MEMBER)).toBe(false);
    expect(canManageTransactions(ORGANIZATION_ROLE.ADVISOR)).toBe(false);
    expect(canManageTransactions(ORGANIZATION_ROLE.TREASURER)).toBe(true);
  });
});