import { describe, expect, it } from "bun:test"
import { calculateAllowances } from "../stages/allowances"

describe("Thailand Allowance Aggregator (calculateAllowances)", () => {
	it("aggregates all allowances into complete breakdown", () => {
		const res = calculateAllowances(
			{
				personal: 60_000,
				socialSecurity: 9_000,
				donation1x: 5_000,
			},
			"single",
			500_000,
			100_000,
			500_000,
		)
		expect(res.breakdown.personal.allowed).toBe(60_000)
		expect(res.breakdown.socialSecurity.allowed).toBe(9_000)
		expect(res.breakdown.donations.donation1x.allowed).toBe(5_000)
		expect(res.breakdown.total).toBe(74_000)
		expect(res.netTaxableIncome).toBe(326_000)
	})
})
