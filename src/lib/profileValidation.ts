// Validation helpers for profile updates.

export const MAX_DISPLAY_NAME_LENGTH = 100

export function normalizeDisplayName(name: string): string {
    return name.trim()
}

export function isValidDisplayName(name: string): boolean {
    if (!name) return false
    if (name.length === 0) return false
    if (name.length > MAX_DISPLAY_NAME_LENGTH) return false
    return true
}