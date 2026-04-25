import { describe, it, expect } from "vitest"
import { isValidEmail, isValidPassword, MIN_PASSWORD_LENGTH } from "../lib/authValidation"

// ─────────────────────────────────────────────
// isValidEmail
// ─────────────────────────────────────────────
describe("isValidEmail", () => {
    it("accepts a normal email", () => {
        expect(isValidEmail("test@example.com")).toBe(true)
    })

    it("accepts an email with a subdomain", () => {
        expect(isValidEmail("user@mail.unlv.edu")).toBe(true)
    })

    it("accepts an email with a plus tag", () => {
        expect(isValidEmail("user+tag@example.com")).toBe(true)
    })

    it("rejects an empty string", () => {
        expect(isValidEmail("")).toBe(false)
    })

    it("rejects a string with no @ sign", () => {
        expect(isValidEmail("notanemail.com")).toBe(false)
    })

    it("rejects a string with no domain", () => {
        expect(isValidEmail("user@")).toBe(false)
    })

    it("rejects a string with no TLD", () => {
        expect(isValidEmail("user@example")).toBe(false)
    })

    it("rejects an email with spaces", () => {
        expect(isValidEmail("user @example.com")).toBe(false)
    })

    it("trims surrounding whitespace before validating", () => {
        expect(isValidEmail("  test@example.com  ")).toBe(true)
    })
})

// ─────────────────────────────────────────────
// isValidPassword
// ─────────────────────────────────────────────
describe("isValidPassword", () => {
    it("accepts a password meeting the minimum length", () => {
        expect(isValidPassword("a".repeat(MIN_PASSWORD_LENGTH))).toBe(true)
    })

    it("accepts a long password", () => {
        expect(isValidPassword("a-very-long-password-1234")).toBe(true)
    })

    it("rejects a password shorter than the minimum", () => {
        expect(isValidPassword("a".repeat(MIN_PASSWORD_LENGTH - 1))).toBe(false)
    })

    it("rejects an empty password", () => {
        expect(isValidPassword("")).toBe(false)
    })

    it("documents the current minimum length", () => {
        // If we ever bump the minimum, this test pin makes the change explicit
        expect(MIN_PASSWORD_LENGTH).toBe(8)
    })
})