import { describe, expect, it } from "bun:test"
import { resolveSpecialRegimes } from "../stages/special-regimes"

describe("Special regime resolution", () => {
	it("is inert when no special regime input is given", () => {
		const res = resolveSpecialRegimes({ income: { section40_1: 100_000, section40_4: 5_000 } })
		expect(res.regularIncome.section40_1).toBe(100_000)
		expect(res.regularIncome.section40_4).toBe(5_000)
		expect(res.grossOutsideRegular).toBe(0)
		expect(res.separateSheet.isEligible).toBe(false)
		expect(res.realEstate.tax).toBe(0)
		expect(res.dividendTaxCredit.isApplicable).toBe(false)
	})

	it("grosses up included dividends and excludes final-withheld sources from regular income", () => {
		const res = resolveSpecialRegimes({
			income: {
				section40_4: {
					amount: 1_000,
					interest: { amount: 40_000, election: "final" },
					dividends: { amount: 80_000, corpTaxRate: 0.2 },
				},
			},
		})
		expect(res.regularIncome.section40_4).toBe(101_000)
		expect(res.dividendTaxCredit.credit).toBe(20_000)
		expect(res.finalWithholding.totalTax).toBe(6_000)
		expect(res.grossOutsideRegular).toBe(40_000)
	})

	it("counts eligible lump sums and real estate outside the regular schedule", () => {
		const res = resolveSpecialRegimes({
			separateSheet: { amount: 700_000, yearsOfService: 30, lastDailyWage: 1_500 },
			realEstateTransfer: { grossTransferValue: 2_000_000, holdingYears: 10 },
		})
		expect(res.regularIncome.section40_1).toBe(0)
		expect(res.grossOutsideRegular).toBe(2_700_000)
	})

	it("folds only the non-exempt part of an ineligible severance into Section 40(1)", () => {
		const res = resolveSpecialRegimes({
			income: { section40_1: 50_000 },
			separateSheet: { amount: 700_000, yearsOfService: 3, lastDailyWage: 1_500 },
		})
		// exemption min(700k, 400*1,500=600k, 600k) = 600,000 counts as gross outside the regular schedule
		expect(res.regularIncome.section40_1).toBe(150_000)
		expect(res.grossOutsideRegular).toBe(600_000)
	})

	it("folds an ineligible retirement payment into Section 40(1) in full", () => {
		const res = resolveSpecialRegimes({
			income: { section40_1: 50_000 },
			separateSheet: {
				amount: 700_000,
				yearsOfService: 3,
				lastDailyWage: 1_500,
				paymentType: "retirement",
			},
		})
		expect(res.regularIncome.section40_1).toBe(750_000)
		expect(res.grossOutsideRegular).toBe(0)
	})
})
