import { describe, expect, it } from "bun:test"
import { TaxValidationError, usd } from "../core/money"
import { calculateUsTax } from "./index"
import type { UsFilingStatus } from "./types"

describe("US Federal Tax Engine Edge Cases and Validation", () => {
	it("rejects unsupported tax year with TaxValidationError", () => {
		expect(() =>
			calculateUsTax({
				taxYear: 2025,
				filingStatus: "single",
				income: { w2Wages: 50_000 },
			}),
		).toThrow(TaxValidationError)
	})

	it("rejects invalid filing status with TaxValidationError", () => {
		expect(() =>
			calculateUsTax({
				filingStatus: "invalid_status" as unknown as UsFilingStatus,
				income: { w2Wages: 50_000 },
			}),
		).toThrow(TaxValidationError)
	})

	it("handles zero income gracefully", () => {
		const result = calculateUsTax({
			filingStatus: "single",
			income: {},
		})
		expect(result.grossIncome).toBe(usd(0))
		expect(result.taxableIncome).toBe(usd(0))
		expect(result.totalTax).toBe(usd(0))
		expect(result.effectiveRate).toBe(0)
		expect(result.marginalRate).toBe(0.1)
		expect(result.netTaxPayable).toBe(usd(0))
	})

	it("floors taxable income at zero when deductions exceed AGI", () => {
		const result = calculateUsTax({
			filingStatus: "single",
			income: { w2Wages: 10_000 },
		})
		expect(result.grossIncome).toBe(usd(10_000))
		expect(result.breakdown.allowableDeduction).toBe(usd(16_100))
		expect(result.taxableIncome).toBe(usd(0))
		expect(result.breakdown.regularIncomeTax).toBe(usd(0))
		// FICA payroll tax on 10,000 W-2 is 7.65% = 765
		expect(result.totalTax).toBe(usd(765))
		expect(result.effectiveRate).toBe(0.0765)
	})

	it("correctly caps preferential taxable income when deductions absorb ordinary and part of preferential", () => {
		// Ordinary: 10,000. LTCG: 20,000. Total gross: 30,000.
		// Standard deduction: 16,100.
		// Taxable income: 30,000 - 16,100 = 13,900.
		// Ordinary taxable = max(0, 13,900 - 20,000) = 0.
		// Preferential taxable = 13,900 - 0 = 13,900.
		const result = calculateUsTax({
			filingStatus: "single",
			income: {
				w2Wages: 10_000,
				longTermCapitalGains: 20_000,
			},
		})
		expect(result.taxableIncome).toBe(usd(13_900))
		expect(result.breakdown.ordinaryTaxableIncome).toBe(usd(0))
		expect(result.breakdown.preferentialTaxableIncome).toBe(usd(13_900))
		expect(result.breakdown.ordinaryTax).toBe(usd(0))
		// All 13,900 is within 0% preferential tier ($49,450)
		expect(result.breakdown.preferentialTax).toBe(usd(0))
		expect(result.breakdown.regularIncomeTax).toBe(usd(0))
		// FICA tax: 765
		expect(result.totalTax).toBe(usd(765))
	})

	it("throws on invalid withholding amount", () => {
		expect(() =>
			calculateUsTax({
				filingStatus: "single",
				income: { w2Wages: 50_000 },
				withholding: -500,
			}),
		).toThrow(TaxValidationError)
	})

	it("accepts explicit 2026 tax year parameter", () => {
		const result = calculateUsTax({
			taxYear: 2026,
			filingStatus: "married_filing_separately",
			income: { w2Wages: 50_000 },
		})
		expect(result.taxYear).toBe(2026)
	})
})
