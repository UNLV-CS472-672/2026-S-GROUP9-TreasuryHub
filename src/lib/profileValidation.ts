// Validation helpers for profile updates.

export const MAX_DISPLAY_NAME_LENGTH = 100

export function normalizeDisplayName(name: string): string {
    return name.trim()
}

export function isValidDisplayName(name: string): boolean {
    if (!name) return false
    //4-27-2026 -- Flipped control flow logic to cover all branches in Vitest
    if (name.length > 0 && name.length <= MAX_DISPLAY_NAME_LENGTH)
        return true

    return false
}