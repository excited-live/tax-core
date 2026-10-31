import { describe, expect, it } from "bun:test"
import { calculateExpenses40_1_2 } from "../stages/expenses-40-1-2"

describe("Section 40(1) & 40(2) Expense Deductions", () => {
	it("calculates 50% deduction when below 100,000 THB ceiling", () => {
		const res = calculateExpenses40_1_2(60_000, 40_000)
		expect(res.requested).toBe(50_000)
		expect(res.allowed).toBe(50_000)
		expect(res.cap).toBe(100_000)
		expect(res.wasClamped).toBe(false)
	})

	it("clamps to 100,000 THB when 50% exceeds ceiling", () => {
		const res = calculateExpenses40_1_2(300_000, 200_000)
		expect(res.requested).toBe(250_000)
		expect(res.allowed).toBe(100_000)
		expect(res.cap).toBe(100_000)
		expect(res.wasClamped).toBe(true)
	})
})
