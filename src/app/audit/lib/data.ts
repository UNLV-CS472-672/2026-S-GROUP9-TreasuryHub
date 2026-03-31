export const AuditLogType = {
    FINANCIAL: "financial",
    ACCOUNT: "account",
    FILE: "file",
    SYSTEM: "system",
} as const;

export type AuditLogType = typeof AuditLogType[keyof typeof AuditLogType];
