import { describe, expect, it } from "bun:test"
import { TaxValidationError } from "../../core/money"
import { calculateAllowances } from "../stages/allowances"
import { calculateDonationAllowances } from "../stages/allowances-donations"

describe("Thailand Donation Allowances and Allowance Aggregator", () => {
	it("calculates 2x and 1x donations within 10% statutory caps", () => {
		// Net before donations = 500,000 THB
		// 10% cap for 2x is 50,000 THB.
		// Donation 2x of 20,000 THB * 2 = 40,000 THB (below 50,000 cap)
		// Remaining net = 500k - 40k = 460k THB.
		// 10% cap for 1x is 46,000 THB.
		// Donation 1x of 30,000 THB (below 46k cap)
		const res = calculateDonationAllowances(20_000, 30_000, 500_000)
		expect(res.breakdown.donation2x.allowed).toBe(40_000)
		expect(res.breakdown.donation2x.wasClamped).toBe(false)
		expect(res.breakdown.donation1x.allowed).toBe(30_000)
		expect(res.breakdown.donation1x.wasClamped).toBe(false)
		expect(res.allowedDonationsTotal).toBe(70_000)
		expect(res.netTaxableIncome).toBe(430_000)
	})

	it("clamps 2x and 1x donations when exceeding 10% limits", () => {
		// Net before donations = 200,000 THB
		// 10% cap for 2x is 20,000 THB.
		// Donation 2x of 15,000 * 2 = 30,000 -> clamped to 20,000 THB.
		// Remaining net = 200k - 20k = 180,000 THB.
		// 10% cap for 1x is 18,000 THB.
		// Donation 1x of 25,000 -> clamped to 18,000 THB.
		const res = calculateDonationAllowances(15_000, 25_000, 200_000)
		expect(res.breakdown.donation2x.allowed).toBe(20_000)
		expect(res.breakdown.donation2x.wasClamped).toBe(true)
		expect(res.breakdown.donation1x.allowed).toBe(18_000)
		expect(res.breakdown.donation1x.wasClamped).toBe(true)
		expect(res.netTaxableIncome).toBe(162_000)
	})

	it("yields 0 donations when net before donations is zero or negative", () => {
		const res = calculateDonationAllowances(10_000, 10_000, -50_000)
		expect(res.allowedDonationsTotal).toBe(0)
		expect(res.netTaxableIncome).toBe(0)
	})

	it("validates donation inputs strictly", () => {
		expect(() => calculateDonationAllowances(-500, 0, 100_000)).toThrow(TaxValidationError)
		expect(() => calculateDonationAllowances(0, -100, 100_000)).toThrow(TaxValidationError)
	})

	it("aggregates all allowances in calculateAllowances", () => {
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
