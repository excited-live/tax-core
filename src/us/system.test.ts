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

	it("computes end-to-end tax for typical single W-2 employee with withholding refund when excluding FICA", () => {
		const result = calculateUsTax({
			filingStatus: "single",
			income: { w2Wages: 85_000 },
			withholding: 10_000,
			includeFica: false,
		})

		expect(result.grossIncome).toBe(usd(85_000))
		expect(result.taxableIncome).toBe(usd(68_900))
		expect(result.breakdown.regularIncomeTax).toBe(usd(9_870))
		expect(result.totalTax).toBe(usd(9_870))
		expect(result.marginalRate).toBe(0.22)
		expect(result.effectiveRate).toBeCloseTo(9_870 / 85_000, 6)
		expect(result.netTaxPayable).toBe(usd(-130, "netTaxPayable", { allowNegative: true }))
		expect(result.breakdown.electedDeduction).toBe("standard")
		expect(result.breakdown.niit.tax).toBe(usd(0))
	})

	it("computes default end-to-end tax including FICA payroll taxes", () => {
		const result = calculateUsTax({
			filingStatus: "single",
			income: { w2Wages: 85_000 },
			withholding: 10_000,
		})
		expect(result.breakdown.regularIncomeTax).toBe(usd(9_870))
		expect(result.breakdown.fica?.totalFicaTax).toBe(usd(6_502.5))
		expect(result.totalTax).toBe(usd(16_372.5))
		expect(result.netTaxPayable).toBe(usd(6_372.5))
	})

	it("computes MFJ couple with adjustments, itemized deductions, and preferential income", () => {
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
				mortgageInterest: 30_000,
				stateAndLocalTaxes: 15_000,
			},
			includeFica: false,
		})

		expect(result.breakdown.grossIncome).toBe(usd(240_000))
		expect(result.breakdown.agi).toBe(usd(230_000))
		expect(result.breakdown.electedDeduction).toBe("itemized")
		expect(result.breakdown.allowableDeduction).toBe(usd(40_000))
		expect(result.taxableIncome).toBe(usd(190_000))
		expect(result.breakdown.ordinaryTaxableIncome).toBe(usd(150_000))
		expect(result.breakdown.preferentialTaxableIncome).toBe(usd(40_000))
	})

	it("computes self-employment tax and flows 50% deductible SE tax into AGI adjustments", () => {
		const result = calculateUsTax({
			filingStatus: "single",
			income: { selfEmploymentNetEarnings: 100_000 },
			includeFica: false,
		})
		expect(result.breakdown.scheduleSe?.totalSelfEmploymentTax).toBe(usd(14_129.55))
		expect(result.breakdown.scheduleSe?.deductiblePortion).toBe(usd(7_064.78))
		expect(result.breakdown.adjustments.deductibleSelfEmploymentTax).toBe(usd(7_064.78))
		expect(result.breakdown.agi).toBe(usd(92_935.22))
	})

	it("computes Form 6251 AMT when preference items trigger alternative minimum tax", () => {
		const result = calculateUsTax({
			filingStatus: "single",
			income: { w2Wages: 150_000 },
			amtPreferences: 200_000,
			includeFica: false,
		})
		expect(result.breakdown.amt?.amtTax).toBe(usd(38_748))
		expect(result.totalTax).toBe(usd(result.breakdown.regularIncomeTax + 38_748))
	})

	it("computes CTC, ACTC, and EITC refundable credits reducing net tax payable", () => {
		const result = calculateUsTax({
			filingStatus: "single",
			income: { w2Wages: 30_000 },
			credits: {
				qualifyingChildrenForChildTaxCredit: 1,
				eitcQualifyingChildren: 1,
			},
			includeFica: false,
		})
		expect(result.breakdown.credits?.childCredits.nonRefundableCtcUsed).toBe(usd(1_420))
		expect(result.breakdown.credits?.childCredits.actcRefundable).toBe(usd(580))
		expect(result.breakdown.credits?.eitc.credit).toBe(usd(3_263.73))
		expect(result.netTaxPayable).toBe(usd(-3_843.73, "netTaxPayable", { allowNegative: true }))
	})

	it("computes high-income single filer with NIIT and 37% top bracket", () => {
		const result = calculateUsTax({
			filingStatus: "single",
			income: {
				w2Wages: 800_000,
				longTermCapitalGains: 100_000,
			},
			includeFica: false,
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
