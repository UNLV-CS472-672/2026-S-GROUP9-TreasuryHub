// Shared validation helpers for auth-related forms.
// Used by login, register, forgot-password, and reset-password.

// Minimum password length per UC1 ("password must meet certain minimum requirements").
// Supabase Auth's default minimum is 6, we're slightly stricter at 8.
export const MIN_PASSWORD_LENGTH = 8

// RFC 5322 is overkill for our use case. This catches the common typos
// (missing @, missing TLD, spaces) without being a regex maze.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(email: string): boolean {
    if (!email) return false
    return EMAIL_PATTERN.test(email.trim())
}

export function isValidPassword(password: string): boolean {
    if (!password) return false
    return password.length >= MIN_PASSWORD_LENGTH
}