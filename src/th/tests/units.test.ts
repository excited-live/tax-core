import { describe, expect, it } from "bun:test"
import { TaxValidationError } from "../../core/money"
import { ThBracketField } from "../types"
import { fromSatang, sumThAmounts, toSatang } from "../units"
import { validateCorpTaxRate } from "../validate"

describe("Thailand unit helpers", () => {
	it("converts THB to satang and back without float drift", () => {
		expect(toSatang(10.55)).toBe(1055)
		expect(fromSatang(1055)).toBe(10.55)
		expect(fromSatang(-250, "refund", { allowNegative: true })).toBe(-2.5)
		expect(() => toSatang(-1, "amount")).toThrow(TaxValidationError)
		expect(() => fromSatang(-1)).toThrow(TaxValidationError)
	})

	it("sums amounts exactly in satang and rejects invalid amounts", () => {
		expect(sumThAmounts([0.1, 0.2])).toBe(0.3)
		expect(sumThAmounts([])).toBe(0)
		expect(() => sumThAmounts([1, -1])).toThrow(TaxValidationError)
	})

	it("reports the caller's typed field when a sum leaves the safe integer range", () => {
		try {
			sumThAmounts([6e13, 6e13], ThBracketField.GrossIncome)
			throw new Error("expected TaxValidationError")
		} catch (error) {
			expect(error).toBeInstanceOf(TaxValidationError)
			expect((error as TaxValidationError).field).toBe(ThBracketField.GrossIncome)
		}
	})
})

describe("Corporate tax rate validation", () => {
	it("accepts rates in [0, 1) and rejects everything else", () => {
		for (const bad of [-0.01, 1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
			expect(() => validateCorpTaxRate(bad)).toThrow(TaxValidationError)
		}
		expect(() => validateCorpTaxRate(0)).not.toThrow()
		expect(() => validateCorpTaxRate(0.999)).not.toThrow()
	})
})
