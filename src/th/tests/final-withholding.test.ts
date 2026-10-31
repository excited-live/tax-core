import { describe, expect, it } from "bun:test"
import { TaxValidationError } from "../../core/money"
import { resolveSection40_4 } from "../stages/final-withholding"

describe("Section 40(4) Final Withholding Election", () => {
	it("returns zeros when no Section 40(4) income is given", () => {
		const res = resolveSection40_4(undefined)
		expect(res.includedAmount).toBe(0)
		expect(res.includedDividends).toBe(0)
		expect(res.corpTaxRate).toBeUndefined()
		expect(res.finalWithholding.totalAmount).toBe(0)
		expect(res.finalWithholding.totalTax).toBe(0)
		expect(res.finalWithholding.interest.rate).toBe(0.15)
		expect(res.finalWithholding.dividends.rate).toBe(0.1)
		expect(res.finalWithholding.digitalAssets.rate).toBe(0.15)
	})

	it("keeps legacy number and { amount } shapes fully included", () => {
		expect(resolveSection40_4(12_000).includedAmount).toBe(12_000)
		expect(resolveSection40_4({ amount: 7_500 }).includedAmount).toBe(7_500)
		expect(resolveSection40_4({ amount: 7_500 }).finalWithholding.totalTax).toBe(0)
	})

	it("defaults to include for bare numbers and omitted elections", () => {
		const res = resolveSection40_4({
			interest: 10_000,
			dividends: { amount: 20_000 },
			digitalAssets: { amount: 30_000, election: "include" },
		})
		expect(res.includedAmount).toBe(60_000)
		expect(res.includedDividends).toBe(20_000)
		expect(res.finalWithholding.interest.election).toBe("include")
		expect(res.finalWithholding.totalAmount).toBe(0)
		expect(res.finalWithholding.totalTax).toBe(0)
	})

	it("withholds 15% interest, 10% dividends, 15% digital assets as final tax", () => {
		// 100,000 * 15% = 15,000; 200,000 * 10% = 20,000; 50,000 * 15% = 7,500
		const res = resolveSection40_4({
			amount: 1_000,
			interest: { amount: 100_000, election: "final" },
			dividends: { amount: 200_000, election: "final" },
			digitalAssets: { amount: 50_000, election: "final" },
		})
		expect(res.includedAmount).toBe(1_000)
		expect(res.finalWithholding.interest.tax).toBe(15_000)
		expect(res.finalWithholding.dividends.tax).toBe(20_000)
		expect(res.finalWithholding.digitalAssets.tax).toBe(7_500)
		expect(res.finalWithholding.interest.amount).toBe(100_000)
		expect(res.finalWithholding.totalAmount).toBe(350_000)
		expect(res.finalWithholding.totalTax).toBe(42_500)
	})

	it("mixes final and included sources", () => {
		const res = resolveSection40_4({
			interest: { amount: 40_000, election: "final" },
			dividends: { amount: 80_000, election: "include", corpTaxRate: 0.2 },
		})
		expect(res.includedAmount).toBe(80_000)
		expect(res.includedDividends).toBe(80_000)
		expect(res.corpTaxRate).toBe(0.2)
		expect(res.finalWithholding.totalAmount).toBe(40_000)
		expect(res.finalWithholding.totalTax).toBe(6_000)
	})

	it("drops the corporate rate for final dividends but still validates it", () => {
		const res = resolveSection40_4({
			dividends: { amount: 10_000, election: "final", corpTaxRate: 0.2 },
		})
		expect(res.includedDividends).toBe(0)
		expect(res.corpTaxRate).toBeUndefined()
		expect(res.finalWithholding.dividends.tax).toBe(1_000)
		expect(() =>
			resolveSection40_4({ dividends: { amount: 10_000, election: "final", corpTaxRate: 1 } }),
		).toThrow(TaxValidationError)
	})

	it("rounds withholding half-up in satang", () => {
		// 1,000.01 THB = 100,001 satang * 0.15 = 15,000.15 -> 15,000 satang = 150.00 THB
		const res = resolveSection40_4({ interest: { amount: 1_000.01, election: "final" } })
		expect(res.finalWithholding.interest.tax).toBe(150)
		// 0.03 THB = 3 satang * 0.15 = 0.45 -> 0; 0.04 THB * 0.15 = 0.6 -> 1 satang
		const small = resolveSection40_4({ interest: { amount: 0.04, election: "final" } })
		expect(small.finalWithholding.interest.tax).toBe(0.01)
	})

	it("rejects negative and non-finite amounts for every source", () => {
		const bad = [-1, Number.NaN, Number.POSITIVE_INFINITY]
		for (const value of bad) {
			expect(() => resolveSection40_4({ amount: value })).toThrow(TaxValidationError)
			expect(() => resolveSection40_4({ interest: value })).toThrow(TaxValidationError)
			expect(() => resolveSection40_4({ dividends: { amount: value } })).toThrow(TaxValidationError)
			expect(() => resolveSection40_4({ digitalAssets: { amount: value } })).toThrow(
				TaxValidationError,
			)
		}
		expect(() => resolveSection40_4(-5)).toThrow(TaxValidationError)
	})
})
