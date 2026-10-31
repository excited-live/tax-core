import { describe, expect, it } from "bun:test"
import { toMinorUnits, usd } from "../../core/money"
import { US_2026_PARAMETERS } from "../parameters"
import { calculateUsChildCredits } from "./credits-child"

describe("Child Tax Credit (CTC), ODC, and ACTC Stage", () => {
	it("returns zero when no children or dependents are claimed", () => {
		const res = calculateUsChildCredits(
			undefined,
			80_000,
			80_000,
			toMinorUnits(10_000, "USD"),
			"single",
			US_2026_PARAMETERS,
		)
		expect(res.nonRefundableUsedCents).toBe(0)
		expect(res.actcRefundableCents).toBe(0)
		expect(res.breakdown.allowedCtc).toBe(usd(0))
	})

	it("computes full non-refundable CTC and ODC when tax liability is sufficient", () => {
		// 2 children ($4,000 CTC), 1 other dependent ($500 ODC).
		// Tax available: $10,000.
		// Both CTC and ODC fully utilized non-refundably.
		// ACTC refundable = 0 because all CTC is used up non-refundably.
		const res = calculateUsChildCredits(
			{
				qualifyingChildrenForChildTaxCredit: 2,
				otherDependents: 1,
			},
			100_000,
			100_000,
			toMinorUnits(10_000, "USD"),
			"single",
			US_2026_PARAMETERS,
		)
		expect(res.breakdown.initialCtc).toBe(usd(4_000))
		expect(res.breakdown.initialOdc).toBe(usd(500))
		expect(res.breakdown.allowedCtc).toBe(usd(4_000))
		expect(res.breakdown.allowedOdc).toBe(usd(500))
		expect(res.breakdown.nonRefundableCtcUsed).toBe(usd(4_000))
		expect(res.breakdown.nonRefundableOdcUsed).toBe(usd(500))
		expect(res.breakdown.actcRefundable).toBe(usd(0))
	})

	it("computes refundable ACTC when tax liability is zero", () => {
		// 1 child ($2,000 CTC). Tax available: $0.
		// Earned income: $30,000.
		// ACTC max: 1 * $1,700 = $1,700.
		// Earned income formula: (30,000 - 2,500) * 15% = 27,500 * 0.15 = $4,125.
		// ACTC allowed = min($2,000 unused, $1,700 max, $4,125 formula) = $1,700.
		const res = calculateUsChildCredits(
			{ qualifyingChildrenForChildTaxCredit: 1 },
			30_000,
			30_000,
			0,
			"single",
			US_2026_PARAMETERS,
		)
		expect(res.breakdown.nonRefundableCtcUsed).toBe(usd(0))
		expect(res.breakdown.actcRefundable).toBe(usd(1_700))
		expect(res.actcRefundableCents).toBe(toMinorUnits(1_700, "USD"))
	})

	it("phases out credits at $50 per $1,000 of MAGI excess over threshold", () => {
		// Single filer threshold: $200,000.
		// MAGI: $210,000. Excess = $10,000 -> 10 steps of $50 = $500 reduction.
		// 1 child ($2,000) + 1 dependent ($500) = $2,500 initial.
		// Reduction = $500. Phased out from ODC first.
		// Allowed ODC = 500 - 500 = 0. Allowed CTC = $2,000.
		const res = calculateUsChildCredits(
			{
				qualifyingChildrenForChildTaxCredit: 1,
				otherDependents: 1,
			},
			210_000,
			210_000,
			toMinorUnits(5_000, "USD"),
			"single",
			US_2026_PARAMETERS,
		)
		expect(res.breakdown.phaseoutReduction).toBe(usd(500))
		expect(res.breakdown.allowedOdc).toBe(usd(0))
		expect(res.breakdown.allowedCtc).toBe(usd(2_000))
	})
})
