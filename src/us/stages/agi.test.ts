import { describe, expect, it } from "bun:test"
import { TaxValidationError, usd } from "../../core/money"
import { US_2026_PARAMETERS } from "../parameters"
import { calculateUsAdjustments } from "./adjustments"
import { calculateUsAgi } from "./agi"

describe("Schedule 1 Adjustments and AGI Stage", () => {
	it("sums ordinary and preferential income correctly", () => {
		const res = calculateUsAgi(
			{
				w2Wages: 100_000,
				selfEmploymentNetEarnings: 20_000,
				ordinaryInterest: 1_500,
				ordinaryDividends: 2_500,
				shortTermCapitalGains: 3_000,
				rentalAndOtherOrdinaryIncome: 5_000,
				longTermCapitalGains: 10_000,
				qualifiedDividends: 4_000,
			},
			undefined,
			"single",
			US_2026_PARAMETERS,
		)
		expect(res.ordinaryGrossIncome).toBe(usd(132_000))
		expect(res.preferentialGrossIncome).toBe(usd(14_000))
		expect(res.grossIncome).toBe(usd(146_000))
		expect(res.agi).toBe(usd(146_000))
	})

	it("handles Schedule C self-employment loss signed in ordinary and gross income", () => {
		const res = calculateUsAgi(
			{
				w2Wages: 50_000,
				selfEmploymentNetEarnings: -10_000,
			},
			undefined,
			"single",
			US_2026_PARAMETERS,
		)
		expect(res.ordinaryGrossIncome).toBe(usd(40_000))
		expect(res.grossIncome).toBe(usd(40_000))
		expect(res.agi).toBe(usd(40_000))
	})

	it("clamps educator expenses to $350 for single and $700 for MFJ both", () => {
		const singleAdj = calculateUsAdjustments(
			{ educatorExpenses: 500 },
			"single",
			US_2026_PARAMETERS,
		)
		expect(singleAdj.breakdown.educatorExpenses.requested).toBe(500)
		expect(singleAdj.breakdown.educatorExpenses.allowed).toBe(350)
		expect(singleAdj.breakdown.educatorExpenses.wasClamped).toBe(true)

		const mfjAdj = calculateUsAdjustments(
			{ educatorExpenses: 800, bothSpousesEducators: true },
			"married_filing_jointly",
			US_2026_PARAMETERS,
		)
		expect(mfjAdj.breakdown.educatorExpenses.allowed).toBe(700)
	})

	it("clamps HSA contributions with coverage type and age 55 catch-up", () => {
		const selfHsa = calculateUsAdjustments(
			{ hsaContributions: 6_000, hsaCoverageType: "self_only", age55OrOlder: true },
			"single",
			US_2026_PARAMETERS,
		)
		expect(selfHsa.breakdown.hsa.cap).toBe(5_400) // 4,400 + 1,000
		expect(selfHsa.breakdown.hsa.allowed).toBe(5_400)

		const familyHsa = calculateUsAdjustments(
			{ hsaContributions: 10_000, hsaCoverageType: "family" },
			"married_filing_jointly",
			US_2026_PARAMETERS,
		)
		expect(familyHsa.breakdown.hsa.cap).toBe(8_750)
		expect(familyHsa.breakdown.hsa.allowed).toBe(8_750)
	})

	it("clamps IRA and 401(k) with age 50 catch-up", () => {
		const adj = calculateUsAdjustments(
			{
				traditionalIraContributions: 9_000,
				preTaxDeferrals401k: 35_000,
				studentLoanInterest: 3_000,
				age50OrOlder: true,
				deductibleSelfEmploymentTax: 1_413,
			},
			"single",
			US_2026_PARAMETERS,
		)
		expect(adj.breakdown.traditionalIra.cap).toBe(8_600) // 7,500 + 1,100
		expect(adj.breakdown.traditionalIra.allowed).toBe(8_600)
		expect(adj.breakdown.preTaxDeferrals401k.cap).toBe(32_500) // 24,500 + 8,000
		expect(adj.breakdown.preTaxDeferrals401k.allowed).toBe(32_500)
		expect(adj.breakdown.studentLoanInterest.cap).toBe(2_500)
		expect(adj.breakdown.studentLoanInterest.allowed).toBe(2_500)
		expect(adj.breakdown.deductibleSelfEmploymentTax).toBe(usd(1_413))
	})

	it("floors AGI at 0 when adjustments exceed gross income", () => {
		const res = calculateUsAgi(
			{ w2Wages: 10_000 },
			{ preTaxDeferrals401k: 24_500 },
			"single",
			US_2026_PARAMETERS,
		)
		expect(res.grossIncome).toBe(usd(10_000))
		expect(res.totalAdjustmentsCents).toBe(2_450_000)
		expect(res.agi).toBe(usd(0))
	})

	it("throws TaxValidationError on negative income or adjustment input", () => {
		expect(() =>
			calculateUsAgi({ w2Wages: -1_000 }, undefined, "single", US_2026_PARAMETERS),
		).toThrow(TaxValidationError)
		expect(() =>
			calculateUsAdjustments({ educatorExpenses: -100 }, "single", US_2026_PARAMETERS),
		).toThrow(TaxValidationError)
	})
})
