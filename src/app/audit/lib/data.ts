export const AuditLogType = {
    FINANCIAL: "financial",
    ACCOUNT: "account",
    FILE: "file",
    SYSTEM: "system",
} as const;

export type AuditLogType = typeof AuditLogType[keyof typeof AuditLogType];

const FINANCIAL_TASK_TYPE = new Set([
    "PAYROLL",
    "INVOICE",
    "PAYMENT",
    "FUNDRAISER"
]);


export function getAuditTaskType(taskType: string): AuditLogType {
    if (FINANCIAL_TASK_TYPE.has(taskType)) {
        return AuditLogType.FINANCIAL;
    }
    return AuditLogType.SYSTEM;
}