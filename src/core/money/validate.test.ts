import { describe, expect, it } from "bun:test"
import { TaxValidationError } from "./errors"
import { validateIntegerMinorUnits, validateMonetaryAmount, validateRate } from "./validate"

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
})
