import { describe, expect, it } from "bun:test"
import { TaxValidationError } from "./errors"
import {
	multiplySafeInteger,
	validateIntegerMinorUnits,
	validateMonetaryAmount,
	validateRate,
	validateSafeIntegerCount,
} from "./validate"

describe("Boundary validation and TaxValidationError", () => {
	it("throws TaxValidationError on NaN and Infinity", () => {
		expect(() => validateMonetaryAmount(Number.NaN, "income")).toThrow(TaxValidationError)
		expect(() => validateMonetaryAmount(Number.POSITIVE_INFINITY, "bonus")).toThrow(
			TaxValidationError,
		)
	})

	it("throws TaxValidationError on negative amounts when not allowed", () => {
		expect(() => validateMonetaryAmount(-100, "deduction")).toThrow(TaxValidationError)
		expect(() =>
			validateMonetaryAmount(-100, "netTaxPayable", { allowNegative: true }),
		).not.toThrow()
	})

	it("validates rate ratio and safe integers", () => {
		expect(() => validateRate(Number.NaN, "rate")).toThrow(TaxValidationError)
		expect(() => validateRate(1.2, "rate")).toThrow(TaxValidationError)
		expect(() => validateRate(-0.1, "rate")).toThrow(TaxValidationError)
		expect(() => validateRate(0.15, "rate")).not.toThrow()
		expect(() => validateIntegerMinorUnits(1.5, "units")).toThrow(TaxValidationError)
		expect(() => validateIntegerMinorUnits(150, "units")).not.toThrow()
	})

	it("validates counts as safe integers at or above a minimum", () => {
		expect(() => validateSafeIntegerCount(0, "years")).not.toThrow()
		expect(() => validateSafeIntegerCount(5, "years", 1)).not.toThrow()
		expect(() => validateSafeIntegerCount(-1, "years")).toThrow(TaxValidationError)
		expect(() => validateSafeIntegerCount(0, "years", 1)).toThrow(TaxValidationError)
		expect(() => validateSafeIntegerCount(2.5, "years")).toThrow(TaxValidationError)
		expect(() => validateSafeIntegerCount(2 ** 53, "years")).toThrow(TaxValidationError)
		expect(() => validateSafeIntegerCount(Number.NaN, "years")).toThrow(TaxValidationError)
	})

	it("multiplies safe integers and rejects unsafe products", () => {
		expect(multiplySafeInteger(7_000_00, 20, "years")).toBe(14_000_000)
		expect(multiplySafeInteger(0, 2 ** 52, "years")).toBe(0)
		expect(() => multiplySafeInteger(7_000_00, 2 ** 52, "years")).toThrow(TaxValidationError)
		expect(() => multiplySafeInteger(2 ** 40, 2 ** 40, "wage")).toThrow(/wage/)
	})
})
