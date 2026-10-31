import { describe, expect, it } from "bun:test"
import { usd } from "../../core/money"
import { US_2026_PARAMETERS } from "../parameters"
import { calculateUsScheduleSe } from "./se"

describe("Schedule SE Self-Employment Tax Stage", () => {
	it("returns zero SE tax when self-employment earnings are zero or missing", () => {
		const res = calculateUsScheduleSe({}, US_2026_PARAMETERS)
		expect(res.totalSeTaxCents).toBe(0)
		expect(res.deductiblePortionCents).toBe(0)
		expect(res.breakdown.totalSelfEmploymentTax).toBe(usd(0))
	})

	it("returns zero SE tax when net earnings after 92.35% are below $400 floor", () => {
		// $430 * 0.9235 = $397.105 < $400
		const res = calculateUsScheduleSe({ selfEmploymentNetEarnings: 430 }, US_2026_PARAMETERS)
		expect(res.totalSeTaxCents).toBe(0)
		expect(res.breakdown.subjectEarnings).toBe(usd(0))
	})

	it("computes full 15.3% SE tax on earnings below wage base", () => {
		// $100,000 net earnings * 0.9235 = $92,350 subject
		// SS (12.4%): 92,350 * 0.124 = $11,451.40 (1,145,140 cents)
		// Medicare (2.9%): 92,350 * 0.029 = $2,678.15 (267,815 cents)
		// Total: $14,129.55 (1,412,955 cents)
		// 50% Deductible: $7,064.78 (706,478 cents)
		const res = calculateUsScheduleSe({ selfEmploymentNetEarnings: 100_000 }, US_2026_PARAMETERS)
		expect(res.breakdown.netEarnings).toBe(usd(100_000))
		expect(res.breakdown.subjectEarnings).toBe(usd(92_350))
		expect(res.breakdown.socialSecurityTax).toBe(usd(11_451.4))
		expect(res.breakdown.medicareTax).toBe(usd(2_678.15))
		expect(res.breakdown.totalSelfEmploymentTax).toBe(usd(14_129.55))
		expect(res.breakdown.deductiblePortion).toBe(usd(7_064.78))
		expect(res.deductiblePortionDollars).toBe(7_064.78)
	})

	it("coordinates Social Security wage base with W-2 wages", () => {
		// Wage base is $181,800.
		// W-2 wages: $150,000 -> remaining wage base for SE SS is $31,800.
		// SE net earnings: $100,000 -> subject is $92,350.
		// SS taxable is capped at remaining wage base: $31,800.
		// SS tax: 31,800 * 0.124 = $3,943.20.
		// Medicare is uncapped on all $92,350: 92,350 * 0.029 = $2,678.15.
		// Total SE tax: 3,943.20 + 2,678.15 = $6,621.35.
		const res = calculateUsScheduleSe(
			{
				selfEmploymentNetEarnings: 100_000,
				w2Wages: 150_000,
			},
			US_2026_PARAMETERS,
		)
		expect(res.breakdown.socialSecurityTaxable).toBe(usd(31_800))
		expect(res.breakdown.socialSecurityTax).toBe(usd(3_943.2))
		expect(res.breakdown.medicareTax).toBe(usd(2_678.15))
		expect(res.breakdown.totalSelfEmploymentTax).toBe(usd(6_621.35))
	})

	it("applies only Medicare when W-2 wages exceed Social Security wage base", () => {
		// W-2 wages: $200,000 >= $181,800. Remaining SS wage base = 0.
		// SE earnings: $50,000 * 0.9235 = $46,175.
		// SS tax: 0.
		// Medicare tax: 46,175 * 0.029 = $1,339.08.
		const res = calculateUsScheduleSe(
			{
				selfEmploymentNetEarnings: 50_000,
				w2Wages: 200_000,
			},
			US_2026_PARAMETERS,
		)
		expect(res.breakdown.socialSecurityTaxable).toBe(usd(0))
		expect(res.breakdown.socialSecurityTax).toBe(usd(0))
		expect(res.breakdown.medicareTax).toBe(usd(1_339.08))
		expect(res.breakdown.totalSelfEmploymentTax).toBe(usd(1_339.08))
	})
})
