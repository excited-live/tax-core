import { describe, expect, it } from "bun:test"
import { evaluateThBrackets } from "../stages/bracket-eval"

describe("Thailand Progressive Bracket Evaluator (evaluateThBrackets)", () => {
	it("computes progressive tax for taxable income spanning multiple tiers", () => {
		// 431,000 THB:
		// 0 - 150,000 @ 0% = 0
		// 150,001 - 300,000 @ 5% (150,000 * 0.05 = 7,500)
		// 300,001 - 500,000 @ 10% (131,000 * 0.10 = 13,100)
		// Total tax = 20,600 THB
		const res = evaluateThBrackets(431_000, 600_000)
		expect(res.totalTax).toBe(20_600)
		expect(res.brackets.slices.length).toBe(8)
		expect(res.brackets.marginalRate).toBe(0.1)
		expect(res.brackets.effectiveRate).toBeCloseTo(20_600 / 600_000, 4)
	})

	it("computes zero tax when taxable income is within the 0% exempt bracket", () => {
		const res = evaluateThBrackets(120_000, 200_000)
		expect(res.totalTax).toBe(0)
		expect(res.brackets.slices[0]?.tax).toBe(0)
	})
})
