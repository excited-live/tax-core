import { describe, expect, it } from "bun:test"
import { usd } from "../core/money"
import { calculateUsTax, us } from "./index"

describe("US Federal Individual Income Tax System", () => {
	it("satisfies TaxSystem contract interface", () => {
		expect(us.jurisdiction).toBe("US")
		expect(us.taxYear).toBe(2026)
		expect(us.currency).toBe("USD")
		expect(typeof us.calculate).toBe("function")
	})

	it("computes end-to-end tax for typical single W-2 employee with withholding refund", () => {
		// Gross income: $85,000 W-2.
		// Standard deduction: $16,100.
		// Taxable income: $68,900.
		// Ordinary brackets:
		// 10% on 12,400 = 1,240
		// 12% on (50,400 - 12,400 = 38,000) = 4,560
		// 22% on (68,900 - 50,400 = 18,500) = 4,070
		// Total tax: 1,240 + 4,560 + 4,070 = 9,870.
		// Withholding: 10,000.
		// Net tax payable: -130 (refund).
		const result = calculateUsTax({
			filingStatus: "single",
			income: { w2Wages: 85_000 },
			withholding: 10_000,
		})

		expect(result.grossIncome).toBe(usd(85_000))
		expect(result.taxableIncome).toBe(usd(68_900))
		expect(result.totalTax).toBe(usd(9_870))
		expect(result.marginalRate).toBe(0.22)
		expect(result.effectiveRate).toBeCloseTo(9_870 / 85_000, 6)
		expect(result.netTaxPayable).toBe(usd(-130, "netTaxPayable", { allowNegative: true }))
		expect(result.breakdown.electedDeduction).toBe("standard")
		expect(result.breakdown.niit.tax).toBe(usd(0))
	})

	it("computes MFJ couple with adjustments, itemized deductions, and preferential income", () => {
		// MFJ with 200k wages, 40k LTCG, 10k 401k deferral, 20k mortgage, 15k SALT
		// Gross: 240k (200k ord + 40k pref).
		// Adjustments: 10k 401k -> AGI = 230k.
		// Itemized: mortgage 20k + SALT capped at 10k = 30k.
		// Standard deduction: 32,200.
		// Auto elects standard (32,200 > 30,000).
		// Taxable income: 230,000 - 32,200 = 197,800.
		// Pref gross: 40,000. Ordinary taxable: 197,800 - 40,000 = 157,800. Pref taxable: 40,000.
		const result = calculateUsTax({
			filingStatus: "married_filing_jointly",
			income: {
				w2Wages: 200_000,
				longTermCapitalGains: 40_000,
			},
			adjustments: {
				preTaxDeferrals401k: 10_000,
			},
			itemizedDeductions: {
				mortgageInterest: 20_000,
				stateAndLocalTaxes: 15_000,
			},
		})

		expect(result.breakdown.grossIncome).toBe(usd(240_000))
		expect(result.breakdown.agi).toBe(usd(230_000))
		expect(result.breakdown.electedDeduction).toBe("standard")
		expect(result.breakdown.allowableDeduction).toBe(usd(32_200))
		expect(result.taxableIncome).toBe(usd(197_800))
		expect(result.breakdown.ordinaryTaxableIncome).toBe(usd(157_800))
		expect(result.breakdown.preferentialTaxableIncome).toBe(usd(40_000))
	})

	it("computes high-income single filer with NIIT and 37% top bracket", () => {
		// Single with 800k wages, 100k capital gains.
		// Standard deduction: 16,100.
		// Gross: 900k. AGI: 900k. Taxable: 883,900.
		// Ordinary taxable: 783,900. Pref taxable: 100,000.
		// NIIT: NII = 100k. MAGI = 900k. Single threshold = 200k. Excess = 700k.
		// Subject to NIIT = min(100k, 700k) = 100k. NIIT = 100k * 0.038 = 3,800.
		const result = calculateUsTax({
			filingStatus: "single",
			income: {
				w2Wages: 800_000,
				longTermCapitalGains: 100_000,
			},
		})

		expect(result.marginalRate).toBe(0.37)
		expect(result.breakdown.niit.tax).toBe(usd(3_800))
		expect(result.totalTax).toBe(usd(result.breakdown.regularIncomeTax + 3_800))
	})

	it("computes Head of Household filer correctly", () => {
		const result = calculateUsTax({
			filingStatus: "head_of_household",
			income: { w2Wages: 60_000 },
		})
		expect(result.breakdown.standardDeduction.base).toBe(usd(24_150))
		expect(result.taxableIncome).toBe(usd(35_850))
	})
})
