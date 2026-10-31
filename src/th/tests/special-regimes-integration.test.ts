import { describe, expect, it } from "bun:test"
import { TaxValidationError, thb } from "../../core/money"
import { calculateThTax } from "../calculate"

// Hand-computed worked examples (Raidaai was not reachable for cross-validation).
const refund = { allowNegative: true }
const salary = { section40_1: 600_000 }
const ss = { socialSecurity: 9_000 } // salary-only regular tax = 20,600
const sheet = { amount: 1_500_000, yearsOfService: 20, lastDailyWage: 2_000 } // tax 23,000
const estate = { grossTransferValue: 5_000_000, holdingYears: 3 } // tax 47,500

describe("Thailand special regimes: Section 40(4), 47 bis, 48(4), 48(5)", () => {
	it("keeps final-elected interest out of the brackets (15% withheld at source)", () => {
		const res = calculateThTax({
			income: { ...salary, section40_4: { interest: { amount: 100_000, election: "final" } } },
			allowances: ss,
		})
		expect(res.taxableIncome).toBe(thb(431_000))
		expect(res.grossIncome).toBe(thb(700_000))
		expect(res.breakdown.assessableIncome.section40_4).toBe(0)
		expect(res.breakdown.regularTax).toBe(20_600)
		expect(res.breakdown.finalWithholding.interest.tax).toBe(15_000)
		expect(res.totalTax).toBe(thb(35_600))
		expect(res.netTaxPayable).toBe(thb(20_600))
		expect(res.effectiveRate).toBeCloseTo(35_600 / 700_000, 10)
	})

	it("taxes included interest progressively: 531,000 taxable -> 32,150", () => {
		// 7,500 + 20,000 + 31,000 * 15% = 32,150
		const res = calculateThTax({
			income: { ...salary, section40_4: { interest: { amount: 100_000 } } },
			allowances: ss,
		})
		expect(res.taxableIncome).toBe(thb(531_000))
		expect(res.totalTax).toBe(thb(32_150))
		expect(res.breakdown.finalWithholding.totalTax).toBe(0)
	})

	it("refunds a dividend tax credit that exceeds the tax owed", () => {
		// 100,000 dividend, 20% corporate: credit 25,000, assessable 125,000, taxable 65,000 -> tax 0
		const res = calculateThTax({
			income: { section40_4: { dividends: { amount: 100_000, corpTaxRate: 0.2 } } },
		})
		expect(res.grossIncome).toBe(thb(125_000))
		expect(res.breakdown.dividendTaxCredit.credit).toBe(25_000)
		expect(res.breakdown.dividendTaxCredit.grossedUpAmount).toBe(125_000)
		expect(res.totalTax).toBe(thb(0))
		expect(res.netTaxPayable).toBe(thb(-25_000, "refund", refund))
	})

	it("grosses up and credits dividends alongside salary", () => {
		// 850,000 assessable - 100,000 expense - 60,000 personal = 690,000 -> 7,500 + 20,000 + 28,500
		const res = calculateThTax({
			income: { ...salary, section40_4: { dividends: { amount: 200_000, corpTaxRate: 0.2 } } },
		})
		expect(res.taxableIncome).toBe(thb(690_000))
		expect(res.totalTax).toBe(thb(56_000))
		expect(res.netTaxPayable).toBe(thb(6_000))
	})

	it("gives no credit for final-elected dividends", () => {
		const res = calculateThTax({
			income: {
				section40_4: { dividends: { amount: 100_000, election: "final", corpTaxRate: 0.2 } },
			},
		})
		expect(res.breakdown.dividendTaxCredit.credit).toBe(0)
		expect(res.breakdown.finalWithholding.dividends.tax).toBe(10_000)
		expect(res.totalTax).toBe(thb(10_000))
		expect(res.netTaxPayable).toBe(thb(0))
	})

	it("taxes an eligible separate sheet beside regular salary tax", () => {
		const res = calculateThTax({ income: salary, allowances: ss, separateSheet: sheet })
		expect(res.breakdown.separateSheet.tax).toBe(23_000)
		expect(res.totalTax).toBe(thb(43_600))
		expect(res.grossIncome).toBe(thb(2_100_000))
		expect(res.taxableIncome).toBe(thb(431_000))
		expect(res.marginalRate).toBe(0.1)
	})

	it("treats under 5 years of service as regular Section 40(1) income", () => {
		// 1,000,000 salary: 840,000 taxable -> 7,500 + 20,000 + 37,500 + 18,000 = 83,000
		const res = calculateThTax({
			income: salary,
			separateSheet: { amount: 400_000, yearsOfService: 4, lastDailyWage: 2_000 },
		})
		expect(res.breakdown.separateSheet.isEligible).toBe(false)
		expect(res.breakdown.separateSheet.addedToSection40_1).toBe(400_000)
		expect(res.breakdown.separateSheet.tax).toBe(0)
		expect(res.breakdown.assessableIncome.section40_1).toBe(1_000_000)
		expect(res.grossIncome).toBe(thb(1_000_000))
		expect(res.totalTax).toBe(thb(83_000))
	})

	it("switches to the separate sheet at exactly 5 years of service", () => {
		const input = { amount: 400_000, lastDailyWage: 2_000 }
		const four = calculateThTax({ separateSheet: { ...input, yearsOfService: 4 } })
		const five = calculateThTax({ separateSheet: { ...input, yearsOfService: 5 } })
		expect(four.breakdown.separateSheet.isEligible).toBe(false)
		expect(five.breakdown.separateSheet.isEligible).toBe(true)
		expect(five.totalTax).toBe(thb(0))
		// 400,000 - 100,000 expense - 60,000 personal = 240,000 -> 7,500 + 0.1 * ... = 4,500
		expect(four.totalTax).toBe(thb(4_500))
		expect(four.breakdown.assessableIncome.section40_1).toBe(400_000)
		expect(five.breakdown.assessableIncome.section40_1).toBe(0)
	})

	it("taxes a real estate transfer separately from the regular schedule", () => {
		const res = calculateThTax({ realEstateTransfer: estate })
		expect(res.breakdown.realEstate.tax).toBe(47_500)
		expect(res.totalTax).toBe(thb(47_500))
		expect(res.grossIncome).toBe(thb(5_000_000))
		expect(res.netTaxPayable).toBe(thb(47_500))
	})

	it("combines every regime into one audited liability", () => {
		// regular: 600k + 80k + 20k credit - 100k - 69k = 531,000 -> 32,150
		// total = 32,150 + 23,000 + 47,500 + 15,000 = 117,650
		// net = total - 15,000 final - 20,000 credit - 5,000 withheld = 77,650
		const res = calculateThTax({
			income: {
				...salary,
				section40_4: {
					interest: { amount: 100_000, election: "final" },
					dividends: { amount: 80_000, corpTaxRate: 0.2 },
				},
			},
			allowances: ss,
			separateSheet: sheet,
			realEstateTransfer: estate,
			withholdingTax: 5_000,
		})
		const b = res.breakdown
		expect(b.regularTax).toBe(32_150)
		expect(b.separateSheet.tax).toBe(23_000)
		expect(b.realEstate.tax).toBe(47_500)
		expect(b.finalWithholding.totalTax).toBe(15_000)
		expect(b.dividendTaxCredit.credit).toBe(20_000)
		expect(b.totalCombinedTax).toBe(117_650)
		expect(res.totalTax).toBe(thb(117_650))
		expect(res.netTaxPayable).toBe(thb(77_650))
		expect(b.netTaxPayable).toBe(77_650)
		expect(res.grossIncome).toBe(thb(7_300_000))
		expect(res.taxableIncome).toBe(thb(531_000))
	})

	it("excludes final-withheld income from minimum gross tax", () => {
		const res = calculateThTax({
			income: { section40_4: { interest: { amount: 1_000_000, election: "final" } } },
		})
		expect(res.breakdown.minimumGrossTax.isApplicable).toBe(false)
		expect(res.breakdown.regularTax).toBe(0)
		expect(res.totalTax).toBe(thb(150_000))
	})

	it("handles fractional satang in withholding and credit", () => {
		// final: 1,000.01 * 15% = 150.0015 -> 150.00; credit: 1,000.02 * 0.25 = 250.005 -> 250.01
		const res = calculateThTax({
			income: {
				section40_4: {
					interest: { amount: 1_000.01, election: "final" },
					dividends: { amount: 1_000.02, corpTaxRate: 0.2 },
				},
			},
		})
		expect(res.breakdown.finalWithholding.interest.tax).toBe(150)
		expect(res.breakdown.dividendTaxCredit.credit).toBe(250.01)
		expect(res.totalTax).toBe(thb(150))
		expect(res.netTaxPayable).toBe(thb(-250.01, "refund", refund))
	})

	it("keeps legacy Section 40(4) shapes unchanged", () => {
		const a = calculateThTax({ income: { section40_4: 50_000 } })
		const b = calculateThTax({ income: { section40_4: { amount: 50_000 } } })
		expect(a.grossIncome).toBe(thb(50_000))
		expect(b.breakdown.assessableIncome.section40_4).toBe(50_000)
		expect(a.breakdown.finalWithholding.totalAmount).toBe(0)
	})

	it("rejects invalid special-regime inputs", () => {
		const bad: Parameters<typeof calculateThTax>[0][] = [
			{ income: { section40_4: { dividends: { amount: 1, corpTaxRate: 1 } } } },
			{ income: { section40_4: { interest: -5 } } },
			{ income: { section40_1: -1 }, separateSheet: sheet },
			{ separateSheet: { ...sheet, yearsOfService: 2.5 } },
			{ separateSheet: { ...sheet, amount: -1 } },
			{ realEstateTransfer: { ...estate, holdingYears: 0 } },
			{ realEstateTransfer: { ...estate, grossTransferValue: Number.NaN } },
		]
		for (const input of bad) {
			expect(() => calculateThTax(input)).toThrow(TaxValidationError)
		}
	})
})
