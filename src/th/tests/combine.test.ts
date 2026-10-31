import { describe, expect, it } from "bun:test"
import { TaxValidationError } from "../../core/money"
import { combineThLiability, sumThAmounts } from "../stages/combine"

const base = {
	regularTax: 0,
	separateSheetTax: 0,
	realEstateTax: 0,
	finalWithholdingTax: 0,
	dividendTaxCredit: 0,
	withholdingTax: 0,
}

describe("Combined Thailand tax liability", () => {
	it("returns the regular tax unchanged when no special regime applies", () => {
		const res = combineThLiability({ ...base, regularTax: 20_600 })
		expect(res.totalCombinedTax).toBe(20_600)
		expect(res.creditsAndPayments).toBe(0)
		expect(res.netTaxPayable).toBe(20_600)
	})

	it("sums all four taxes before credits and payments", () => {
		const res = combineThLiability({
			...base,
			regularTax: 20_600,
			separateSheetTax: 23_000,
			realEstateTax: 47_499.99,
			finalWithholdingTax: 15_000,
		})
		expect(res.totalCombinedTax).toBe(106_099.99)
		// final withholding was already withheld at source
		expect(res.creditsAndPayments).toBe(15_000)
		expect(res.netTaxPayable).toBe(91_099.99)
	})

	it("subtracts dividend credit and withholding tax and allows refunds", () => {
		const res = combineThLiability({
			...base,
			regularTax: 10_000,
			finalWithholdingTax: 5_000,
			dividendTaxCredit: 25_000,
			withholdingTax: 2_000.5,
		})
		expect(res.totalCombinedTax).toBe(15_000)
		expect(res.creditsAndPayments).toBe(32_000.5)
		expect(res.netTaxPayable).toBe(-17_000.5)
	})

	it("computes in satang without float drift", () => {
		const res = combineThLiability({ ...base, regularTax: 0.1, separateSheetTax: 0.2 })
		expect(res.totalCombinedTax).toBe(0.3)
	})

	it("rejects negative or non-finite components", () => {
		expect(() => combineThLiability({ ...base, regularTax: -1 })).toThrow(TaxValidationError)
		expect(() => combineThLiability({ ...base, realEstateTax: Number.NaN })).toThrow(
			TaxValidationError,
		)
		expect(() => combineThLiability({ ...base, withholdingTax: -1 })).toThrow(TaxValidationError)
	})

	it("sums amounts exactly in satang and rejects invalid amounts", () => {
		expect(sumThAmounts([0.1, 0.2])).toBe(0.3)
		expect(sumThAmounts([])).toBe(0)
		expect(() => sumThAmounts([1, -1])).toThrow(TaxValidationError)
	})
})
