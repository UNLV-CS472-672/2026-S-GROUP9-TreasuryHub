import { describe, it, expect } from "vitest"
import {
    isValidDisplayName,
    normalizeDisplayName,
    MAX_DISPLAY_NAME_LENGTH,
} from "../lib/profileValidation"

// ─────────────────────────────────────────────
// normalizeDisplayName
// ─────────────────────────────────────────────
describe("normalizeDisplayName", () => {
    it("trims surrounding whitespace", () => {
        expect(normalizeDisplayName("  Keith  ")).toBe("Keith")
    })

    it("preserves internal whitespace", () => {
        expect(normalizeDisplayName("Keith T")).toBe("Keith T")
    })

    it("leaves a clean name unchanged", () => {
        expect(normalizeDisplayName("Keith")).toBe("Keith")
    })

    it("returns empty string for whitespace-only input", () => {
        expect(normalizeDisplayName("   ")).toBe("")
    })
})

// ─────────────────────────────────────────────
// isValidDisplayName
// ─────────────────────────────────────────────
describe("isValidDisplayName", () => {
    it("accepts a normal name", () => {
        expect(isValidDisplayName("Keith")).toBe(true)
    })

    it("accepts a single character", () => {
        expect(isValidDisplayName("K")).toBe(true)
    })

    it("accepts a name at the max length", () => {
        expect(isValidDisplayName("a".repeat(MAX_DISPLAY_NAME_LENGTH))).toBe(true)
    })

    it("rejects an empty name", () => {
        expect(isValidDisplayName("")).toBe(false)
    })

    it("rejects a name over the max length", () => {
        expect(isValidDisplayName("a".repeat(MAX_DISPLAY_NAME_LENGTH + 1))).toBe(false)
    })

    it("documents the current max length", () => {
        // Pin so changes to the limit are explicit
        expect(MAX_DISPLAY_NAME_LENGTH).toBe(100)
    })
})