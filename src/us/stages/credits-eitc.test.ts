import { describe, expect, it } from "bun:test"
import { usd } from "../../core/money"
import { US_2026_PARAMETERS } from "../parameters"
import { calculateUsEitc } from "./credits-eitc"

describe("Earned Income Tax Credit (EITC) Stage", () => {
	it("disqualifies credit when investment income exceeds statutory limit", () => {
		// Limit is $11,950 for 2026. Investment income $12,000.
		const res = calculateUsEitc(
			{ eitcQualifyingChildren: 1 },
			20_000,
			12_000,
			20_000,
			"single",
			US_2026_PARAMETERS,
		)
		expect(res.creditCents).toBe(0)
		expect(res.breakdown.disqualifiedByInvestmentIncome).toBe(true)
		expect(res.breakdown.credit).toBe(usd(0))
	})

	it("returns zero credit for MFS or zero earned income", () => {
		const mfs = calculateUsEitc(
			{ eitcQualifyingChildren: 1 },
			20_000,
			0,
			20_000,
			"married_filing_separately",
			US_2026_PARAMETERS,
		)
		expect(mfs.creditCents).toBe(0)

		const zeroEarned = calculateUsEitc(
			{ eitcQualifyingChildren: 1 },
			0,
			0,
			0,
			"single",
			US_2026_PARAMETERS,
		)
		expect(zeroEarned.creditCents).toBe(0)
	})

	it("computes maximum credit for 1 qualifying child", () => {
		// 1 child: max credit is $4,328 for earned income between $12,730 and $23,340 for Single.
		// Earned income: $18,000, AGI: $18,000.
		const res = calculateUsEitc(
			{ eitcQualifyingChildren: 1 },
			18_000,
			0,
			18_000,
			"single",
			US_2026_PARAMETERS,
		)
		expect(res.breakdown.qualifyingChildren).toBe(1)
		expect(res.breakdown.credit).toBe(usd(4_328))
	})

	it("phases out credit for higher income levels", () => {
		// 1 child: phaseout starts at $23,340 for Single at 15.98% rate.
		// Earned income: $25,340 ($2,000 excess).
		// Reduction = 2,000 * 0.1598 = $319.60.
		// Credit: 4,328 - 319.60 = $4,008.40.
		const res = calculateUsEitc(
			{ eitcQualifyingChildren: 1 },
			25_340,
			0,
			25_340,
			"single",
			US_2026_PARAMETERS,
		)
		expect(res.breakdown.credit).toBe(usd(4_008.4))
	})

	it("computes credit across 0, 2, and 3+ child tiers", () => {
		const c0 = calculateUsEitc(
			{ eitcQualifyingChildren: 0 },
			8_000,
			0,
			8_000,
			"single",
			US_2026_PARAMETERS,
		)
		expect(c0.breakdown.credit).toBe(usd(8_000 * 0.0765))

		const c2 = calculateUsEitc(
			{ eitcQualifyingChildren: 2 },
			15_000,
			0,
			15_000,
			"married_filing_jointly",
			US_2026_PARAMETERS,
		)
		expect(c2.breakdown.credit).toBe(usd(15_000 * 0.4))

		const c3 = calculateUsEitc(
			{ eitcQualifyingChildren: 4 },
			15_000,
			0,
			15_000,
			"married_filing_jointly",
			US_2026_PARAMETERS,
		)
		expect(c3.breakdown.credit).toBe(usd(15_000 * 0.45))
	})
})
