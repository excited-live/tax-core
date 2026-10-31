import { describe, expect, it } from "bun:test"
import { TaxValidationError } from "./errors"
import { applyGrossUp, applyPercentage, roundHalfUp } from "./rounding"

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

	it("applies the gross-up ratio rate / (1 - rate) with exact half-up rounding", () => {
		// 20% -> 0.25 ratio: 1,000.00 THB => 250.00 THB
		expect(applyGrossUp(100_000, 0.2)).toBe(25_000)
		// exact tie: 2 satang * 0.25 = 0.5 -> rounds half up to 1
		expect(applyGrossUp(2, 0.2)).toBe(1)
		// 30% -> 3/7: 700 * 3/7 = 300
		expect(applyGrossUp(700, 0.3)).toBe(300)
		// 10 * 0.3/0.7 = 4.2857 -> 4
		expect(applyGrossUp(10, 0.3)).toBe(4)
		expect(applyGrossUp(12_345, 0)).toBe(0)
		// rates above 50% produce ratios above 1
		expect(applyGrossUp(100, 0.75)).toBe(300)
	})

	it("rejects gross-up rates outside [0, 1) and non-integer minor units", () => {
		expect(() => applyGrossUp(100, 1)).toThrow(TaxValidationError)
		expect(() => applyGrossUp(100, -0.1)).toThrow(TaxValidationError)
		expect(() => applyGrossUp(100, Number.NaN)).toThrow(TaxValidationError)
		expect(() => applyGrossUp(1.5, 0.2)).toThrow(TaxValidationError)
	})

	it("throws when the gross-up result is not a safe integer", () => {
		// 1e13 * 0.999 / 0.001 = 9.99e15 + ... exceeds Number.MAX_SAFE_INTEGER
		expect(() => applyGrossUp(1e13, 0.999)).toThrow(TaxValidationError)
		expect(applyGrossUp(1e12, 0.5)).toBe(1e12)
		try {
			applyGrossUp(1e13, 0.999, "dividend")
			throw new Error("expected TaxValidationError")
		} catch (error) {
			expect((error as TaxValidationError).field).toBe("dividend")
		}
	})
})
