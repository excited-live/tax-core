import { describe, expect, it } from "bun:test"
import { toMinorUnits, usd } from "../../core/money"
import { US_2026_PARAMETERS } from "../parameters"
import { calculateUsCredits } from "./credits"

describe("Statutory Credits Stage Coordinator", () => {
	it("returns zeroes when no credits are claimed", () => {
		const res = calculateUsCredits(
			{
				filingStatus: "single",
				income: { w2Wages: 60_000 },
			},
			toMinorUnits(60_000, "USD"),
			toMinorUnits(7_000, "USD"),
			US_2026_PARAMETERS,
		)
		expect(res.allowedNonRefundableCents).toBe(0)
		expect(res.totalRefundableCents).toBe(0)
		expect(res.breakdown.totalNonRefundableAllowed).toBe(usd(0))
		expect(res.breakdown.totalRefundable).toBe(usd(0))
	})

	it("caps non-refundable credits at available tax liability", () => {
		// Available tax liability: $1,000.
		// Foreign tax credit: $1,500.
		// Allowed non-refundable credit should be capped at $1,000.
		const res = calculateUsCredits(
			{
				filingStatus: "single",
				income: { w2Wages: 50_000 },
				credits: { foreignTaxCredit: 1_500 },
			},
			toMinorUnits(50_000, "USD"),
			toMinorUnits(1_000, "USD"),
			US_2026_PARAMETERS,
		)
		expect(res.breakdown.totalNonRefundableClaimed).toBe(usd(1_500))
		expect(res.breakdown.totalNonRefundableAllowed).toBe(usd(1_000))
		expect(res.allowedNonRefundableCents).toBe(toMinorUnits(1_000, "USD"))
	})

	it("aggregates both non-refundable and refundable credits across all sources", () => {
		// 1 child ($2,000 CTC), 1 AOTC student ($4,000 expenses: $1,500 non-ref, $1,000 ref)
		// Tax available: $5,000.
		// Non-refundable: $2,000 CTC + $1,500 AOTC = $3,500 <= $5,000.
		// Refundable: $1,000 AOTC.
		const res = calculateUsCredits(
			{
				filingStatus: "single",
				income: { w2Wages: 70_000 },
				credits: {
					qualifyingChildrenForChildTaxCredit: 1,
					educationStudents: [{ type: "aotc", qualifiedExpenses: 4_000 }],
				},
			},
			toMinorUnits(70_000, "USD"),
			toMinorUnits(5_000, "USD"),
			US_2026_PARAMETERS,
		)
		expect(res.breakdown.totalNonRefundableAllowed).toBe(usd(3_500))
		expect(res.breakdown.totalRefundable).toBe(usd(1_000))
	})
})
