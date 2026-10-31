import { describe, expect, it } from "bun:test"
import { TaxValidationError } from "./errors"
import { applyPercentage, roundHalfUp } from "./rounding"

describe("Rounding & percentage application", () => {
	it("performs half-away-from-zero rounding on numbers", () => {
		expect(roundHalfUp(1.4)).toBe(1)
		expect(roundHalfUp(1.5)).toBe(2)
		expect(roundHalfUp(2.5)).toBe(3)
		expect(roundHalfUp(-1.5)).toBe(-2)
		expect(Object.is(roundHalfUp(-0.2), 0)).toBe(true)
	})

	it("applies statutory percentage in minor units with exact rational math", () => {
		expect(applyPercentage(10_000, 0.05)).toBe(500)
		expect(applyPercentage(1000, 0.33333)).toBe(333)
		expect(applyPercentage(100, 0.025, "floor")).toBe(2)
		expect(applyPercentage(100, 0.025, "ceil")).toBe(3)
		expect(applyPercentage(100, 0.025, "half-up")).toBe(3)

		// Exact statutory boundary cases that fail under IEEE 754 float arithmetic
		expect(applyPercentage(90, 0.35, "half-up")).toBe(32)
		expect(applyPercentage(170, 0.35, "half-up")).toBe(60)
		expect(applyPercentage(180, 0.35, "floor")).toBe(63)
		expect(applyPercentage(100, 0.07, "ceil")).toBe(7)

		// Tiny exponent rate safely handled
		expect(applyPercentage(1_000_000, 1e-7)).toBe(0)

		// Negative amounts (refund / adjustment) with allowNegative
		expect(applyPercentage(-100, 0.025, "floor", { allowNegative: true })).toBe(-3)
		expect(applyPercentage(-100, 0.025, "ceil", { allowNegative: true })).toBe(-2)
		expect(applyPercentage(-100, 0.025, "half-up", { allowNegative: true })).toBe(-3)
	})

	it("rejects non-integer minor units or invalid rate in applyPercentage", () => {
		expect(() => applyPercentage(10.5, 0.05)).toThrow(TaxValidationError)
		expect(() => applyPercentage(10_000, 1.5)).toThrow(TaxValidationError)
		expect(() => applyPercentage(10_000, -0.05)).toThrow(TaxValidationError)
	})
})
