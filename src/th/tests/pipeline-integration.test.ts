import { describe, expect, it } from "bun:test"
import { TaxValidationError, thb } from "../../core/money"
import { calculateThTax } from "../calculate"
import { th } from "../system"

describe("Thailand PIT Pipeline Integration (ภ.ง.ด.90/91)", () => {
	it("processes default empty input smoothly", () => {
		const res = calculateThTax()
		expect(res.jurisdiction).toBe("TH")
		expect(res.taxYear).toBe(2026)
		expect(res.currency).toBe("THB")
		expect(res.grossIncome).toBe(thb(0))
		expect(res.taxableIncome).toBe(thb(0))
		expect(res.totalTax).toBe(thb(0))
		expect(res.netTaxPayable).toBe(thb(0))
		expect(res.effectiveRate).toBe(0)
		expect(res.breakdown.allowances.personal.allowed).toBe(60_000)
	})

	it("calculates employment salary earner tax correctly", () => {
		// Salary: 600,000 THB
		// Expense: 50% max 100k -> 100k
		// Allowances: Personal 60k + Social Security 9k -> 69k
		// Net taxable: 600k - 100k - 69k = 431,000 THB
		// Brackets:
		// 0 - 150k @ 0% = 0
		// 150k - 300k @ 5% = 7,500
		// 300k - 431k (131k) @ 10% = 13,100
		// Total tax: 20,600 THB
		const res = calculateThTax({
			taxYear: 2026,
			income: { section40_1: 600_000 },
			allowances: { socialSecurity: 9_000 },
		})

		expect(res.grossIncome).toBe(thb(600_000))
		expect(res.taxableIncome).toBe(thb(431_000))
		expect(res.totalTax).toBe(thb(20_600))
		expect(res.marginalRate).toBe(0.1)
		expect(res.netTaxPayable).toBe(thb(20_600))
		expect(res.breakdown.minimumGrossTax.isApplicable).toBe(false)
	})

	it("subtracts withholding tax and handles refund (negative netTaxPayable)", () => {
		const res = calculateThTax({
			income: { section40_1: 600_000 },
			allowances: { socialSecurity: 9_000 },
			withholdingTax: 30_000,
		})

		expect(res.totalTax).toBe(thb(20_600))
		expect(res.netTaxPayable).toBe(thb(-9_400, "netTaxPayable", { allowNegative: true }))
		expect(res.breakdown.withholdingTax).toBe(30_000)
	})

	it("applies Section 48(2) Minimum Gross Tax when it exceeds bracket tax", () => {
		// Gross Section 40(8) = 2,400,000 THB
		// With huge actual expense: 2,350,000 THB
		// Net income after expenses = 50,000 THB
		// Personal allowance = 60,000 THB -> Taxable income = 0 THB -> Progressive tax = 0
		// Minimum gross tax: 2,400,000 * 0.5% = 12,000 THB (> 5,000 and > 0)
		const res = calculateThTax({
			income: {
				section40_8: {
					amount: 2_400_000,
					expenseElection: "actual",
					actualExpense: 2_350_000,
				},
			},
		})

		expect(res.breakdown.minimumGrossTax.isApplicable).toBe(true)
		expect(res.breakdown.minimumGrossTax.wasApplied).toBe(true)
		expect(res.breakdown.minimumGrossTax.calculatedTax).toBe(12_000)
		expect(res.breakdown.progressiveTax).toBe(0)
		expect(res.totalTax).toBe(thb(12_000))
	})

	it("rejects unsupported tax years with TaxValidationError", () => {
		expect(() =>
			calculateThTax({
				// @ts-expect-error - testing runtime rejection of unsupported taxYear
				taxYear: 2025,
			}),
		).toThrow(TaxValidationError)
	})

	it("conforms to TaxSystem interface under th", () => {
		expect(th.jurisdiction).toBe("TH")
		expect(th.taxYear).toBe(2026)
		expect(th.currency).toBe("THB")

		const resFromSystem = th.calculate({
			income: { section40_1: 300_000 },
		})
		const resDirect = calculateThTax({
			income: { section40_1: 300_000 },
		})

		expect(resFromSystem.totalTax).toBe(resDirect.totalTax)
	})
})
